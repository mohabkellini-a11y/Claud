<?php
/**
 * EverSafe Fire Protection: shared code for the /api endpoints.
 * No secrets live in this file. They live in config.php, outside public_html.
 */
declare(strict_types=1);

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) { http_response_code(404); exit; }

/* ---- Limits (one place) ---- */
const EVS_MAX_FILE_BYTES   = 100 * 1024 * 1024;   // 100 MB per file
const EVS_MAX_QUOTE_BYTES  = 500 * 1024 * 1024;   // 500 MB per quote
const EVS_MAX_FILES        = 20;                  // files per quote
const EVS_CHUNK_BYTES      = 5 * 1024 * 1024;     // 5 MB per chunk
const EVS_RETENTION_DAYS   = 90;                  // uploads are deleted after this
const EVS_LINK_DAYS        = 30;                  // download links expire after this
const EVS_TOKEN_HOURS      = 24;                  // upload session lifetime
const EVS_ALLOWED_EXT      = ['pdf', 'dwg', 'dxf', 'rvt', 'zip', 'jpg', 'png'];

function evs_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    $candidates = [];
    if (getenv('EVS_CONFIG')) $candidates[] = getenv('EVS_CONFIG');
    $docroot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
    if ($docroot !== '') $candidates[] = dirname($docroot) . '/eversafe-private/config.php';
    $candidates[] = dirname(__DIR__, 2) . '/eversafe-private/config.php';
    foreach ($candidates as $path) {
        if (is_file($path)) {
            $cfg = require $path;
            if (!is_array($cfg) || empty($cfg['secret']) || strlen((string)$cfg['secret']) < 32) evs_fail(503, 'not_configured');
            $cfg['_dir'] = dirname($path);
            $cfg['upload_dir'] = rtrim($cfg['upload_dir'] ?? ($cfg['_dir'] . '/uploads'), '/');
            return $cfg;
        }
    }
    evs_fail(503, 'not_configured');
}

function evs_json(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function evs_fail(int $status, string $code, string $message = ''): void {
    evs_json(['ok' => false, 'error' => $code, 'message' => $message], $status);
}

function evs_require_post(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); evs_fail(405, 'method'); }
}

/** Same-origin check: the request must come from a page on this site. */
function evs_require_same_origin(): void {
    $cfg = evs_config();
    $allowed = $cfg['allowed_hosts'] ?? ['eversafe-fire.com', 'www.eversafe-fire.com'];
    $src = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
    $host = strtolower((string)parse_url($src, PHP_URL_HOST));
    $port = parse_url($src, PHP_URL_PORT);
    if ($port) $host .= ':' . $port;
    if ($host === '' || !in_array($host, $allowed, true)) evs_fail(403, 'origin');
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin') === 'cross-site') evs_fail(403, 'origin');
}

function evs_ip(): string { return (string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'); }

function evs_mkdir(string $dir): void {
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) evs_fail(500, 'storage');
}

/** Per-IP rate limit, stored in small files. $max hits per $window seconds. */
function evs_rate_limit(string $bucket, int $max, int $window): void {
    $cfg = evs_config();
    $dir = $cfg['upload_dir'] . '/_rate';
    evs_mkdir($dir);
    $file = $dir . '/' . $bucket . '-' . hash_hmac('sha256', evs_ip(), (string)$cfg['secret']) . '.json';
    $fh = fopen($file, 'c+');
    if (!$fh) return;
    flock($fh, LOCK_EX);
    $now = time();
    $hits = json_decode((string)stream_get_contents($fh), true);
    $hits = is_array($hits) ? array_values(array_filter($hits, fn($t) => is_int($t) && $t > $now - $window)) : [];
    $blocked = count($hits) >= $max;
    if (!$blocked) $hits[] = $now;
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN); fclose($fh);
    if ($blocked) { header('Retry-After: ' . $window); evs_fail(429, 'rate', 'Too many requests. Please wait a few minutes and try again.'); }
}

/* ---- Signed upload session token: quote id + expiry + HMAC ---- */
function evs_valid_quote_id(string $id): bool { return (bool)preg_match('/^EVS-Q\d{6}-[A-Z0-9]{4}$/', $id); }

function evs_token_make(string $quoteId): string {
    $exp = time() + EVS_TOKEN_HOURS * 3600;
    $body = $quoteId . '.' . $exp;
    return $body . '.' . hash_hmac('sha256', $body, (string)evs_config()['secret']);
}

/** Returns the quote id, or stops the request. */
function evs_token_check(string $token): string {
    $parts = explode('.', $token);
    if (count($parts) !== 3) evs_fail(403, 'token');
    [$quoteId, $exp, $sig] = $parts;
    $good = hash_hmac('sha256', $quoteId . '.' . $exp, (string)evs_config()['secret']);
    if (!hash_equals($good, $sig) || !ctype_digit($exp) || (int)$exp < time() || !evs_valid_quote_id($quoteId)) {
        evs_fail(403, 'token', 'Your session expired. Please get your price again.');
    }
    return $quoteId;
}

/* ---- Per-quote folder and manifest ---- */
function evs_quote_dir(string $quoteId): string {
    return evs_config()['upload_dir'] . '/' . $quoteId;
}

/** Run $fn(array $manifest): array under an exclusive lock, save the result, return it. */
function evs_manifest_update(string $quoteId, callable $fn): array {
    $dir = evs_quote_dir($quoteId);
    evs_mkdir($dir);
    $fh = fopen($dir . '/manifest.json', 'c+');
    if (!$fh) evs_fail(500, 'storage');
    flock($fh, LOCK_EX);
    $m = json_decode((string)stream_get_contents($fh), true);
    if (!is_array($m)) $m = ['quote_id' => $quoteId, 'created' => time(), 'files' => [], 'submitted' => null];
    $m = $fn($m);
    ftruncate($fh, 0); rewind($fh);
    fwrite($fh, json_encode($m, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    fflush($fh); flock($fh, LOCK_UN); fclose($fh);
    return $m;
}

function evs_clean_name(string $name): string {
    $name = basename(str_replace('\\', '/', $name));
    $name = preg_replace('/[\x00-\x1F\x7F"<>|:*?\/\\\\]+/u', '_', $name) ?? 'file';
    $name = trim($name, " .");
    if ($name === '') $name = 'file';
    return mb_substr($name, 0, 150);
}

function evs_ext(string $name): string { return strtolower(pathinfo($name, PATHINFO_EXTENSION)); }

/** Does the start of the file match what the extension claims? */
function evs_signature_ok(string $path, string $ext): bool {
    $fh = fopen($path, 'rb'); if (!$fh) return false;
    $head = (string)fread($fh, 4096); fclose($fh);
    switch ($ext) {
        case 'pdf': return strpos(substr($head, 0, 1024), '%PDF-') !== false;
        case 'zip': return in_array(substr($head, 0, 4), ["PK\x03\x04", "PK\x05\x06", "PK\x07\x08"], true);
        case 'jpg': return substr($head, 0, 3) === "\xFF\xD8\xFF";
        case 'png': return substr($head, 0, 8) === "\x89PNG\r\n\x1A\n";
        case 'dwg': return (bool)preg_match('/^AC10\d\d/', $head);
        case 'rvt': return substr($head, 0, 8) === "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1";   // OLE compound file
        case 'dxf':
            if (substr($head, 0, 22) === "AutoCAD Binary DXF\r\n\x1A\x00") return true;
            if (strpos($head, "\x00") !== false) return false;                            // text DXF has no NUL bytes
            return (bool)preg_match('/^\s*(999\s+[^\n]*\n\s*)*0\s*\r?\n\s*SECTION/i', $head);
    }
    return false;
}

function evs_human_bytes(int $b): string {
    if ($b >= 1048576) return number_format($b / 1048576, 1) . ' MB';
    if ($b >= 1024) return number_format($b / 1024, 0) . ' KB';
    return $b . ' B';
}

/** One line of plain text from user input. */
function evs_line($v, int $max = 200): string {
    $v = is_string($v) ? $v : '';
    $v = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '');
    return mb_substr($v, 0, $max);
}

function evs_text($v, int $max = 5000): string {
    $v = is_string($v) ? $v : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', str_replace("\r\n", "\n", $v)) ?? '';
    return mb_substr(trim($v), 0, $max);
}

/**
 * Send one plain-text email through SMTP (PHPMailer).
 * mail_mode "log" writes the message to a file and sends nothing. It is for local tests.
 */
function evs_send_mail(string $to, string $subject, string $body, ?string $replyTo = null): bool {
    $cfg = evs_config();
    $subject = evs_line($subject, 180);
    if (($cfg['mail_mode'] ?? 'smtp') === 'log') {
        evs_mkdir($cfg['upload_dir']);
        return (bool)file_put_contents($cfg['upload_dir'] . '/_mail.log',
            "=== " . date('c') . "\nTo: $to\nReply-To: " . ($replyTo ?? '') . "\nSubject: $subject\n\n$body\n\n", FILE_APPEND | LOCK_EX);
    }
    require_once __DIR__ . '/vendor/phpmailer/Exception.php';
    require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
    require_once __DIR__ . '/vendor/phpmailer/SMTP.php';
    try {
        $m = new PHPMailer\PHPMailer\PHPMailer(true);
        $m->isSMTP();
        $m->Host = $cfg['smtp_host']; $m->Port = (int)$cfg['smtp_port'];
        $m->SMTPAuth = true; $m->Username = $cfg['smtp_user']; $m->Password = $cfg['smtp_pass'];
        $m->SMTPSecure = ((int)$cfg['smtp_port'] === 465) ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $m->Timeout = 20; $m->CharSet = 'UTF-8';
        $m->setFrom($cfg['mail_from'], $cfg['mail_from_name'] ?? 'EverSafe Fire Protection');
        $m->addAddress($to);
        if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $m->addReplyTo($replyTo);
        $m->Subject = $subject; $m->Body = $body; $m->isHTML(false);
        return $m->send();
    } catch (Throwable $e) {
        error_log('EverSafe mail error: ' . $e->getMessage());
        return false;
    }
}

function evs_site_url(): string {
    return rtrim(evs_config()['site_url'] ?? 'https://eversafe-fire.com', '/');
}
