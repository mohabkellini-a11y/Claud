<?php
/**
 * "Request this job": emails EverSafe the quote summary and the file list, and sends the client a confirmation.
 * POST (JSON or form): token, name, company, email, city, total, valid_until, summary, website (honeypot)
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';
evs_require_post();
evs_require_same_origin();
evs_rate_limit('request', 10, 3600);

$in = $_POST;
if (stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') === 0) {
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) evs_fail(400, 'json');
}
if (evs_line($in['website'] ?? '') !== '') evs_json(['ok' => true]);            // honeypot: pretend it worked

$quoteId = evs_token_check((string)($in['token'] ?? ''));
$name    = evs_line($in['name'] ?? '', 120);
$company = evs_line($in['company'] ?? '', 160);
$email   = evs_line($in['email'] ?? '', 200);
$city    = evs_line($in['city'] ?? '', 120);
$total   = evs_line($in['total'] ?? '', 30);
$valid   = evs_line($in['valid_until'] ?? '', 60);
$summary = evs_text($in['summary'] ?? '', 4000);
$kind    = ($in['kind'] ?? 'quote') === 'custom' ? 'custom' : 'quote';
if ($name === '' || $company === '' || $city === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) evs_fail(400, 'fields', 'Please check your name, company, email and project city.');

$cfg = evs_config();
$already = false; $files = [];
$m = evs_manifest_update($quoteId, function (array $m) use (&$already, &$files, $quoteId, $cfg, $name, $company, $email, $city, $total, $kind) {
    if (!empty($m['submitted'])) { $already = true; return $m; }                // double click: do nothing twice
    $dir = evs_quote_dir($quoteId);
    foreach ($m['files'] as $id => $f) {
        if (empty($f['done'])) { @unlink($dir . '/' . $f['stored']); unset($m['files'][$id]); continue; }   // drop unfinished uploads
        $token = bin2hex(random_bytes(32));
        $m['files'][$id]['token_hash'] = hash('sha256', $token);
        $m['files'][$id]['token_expires'] = time() + EVS_LINK_DAYS * 86400;
        evs_mkdir($cfg['upload_dir'] . '/_tokens');
        file_put_contents($cfg['upload_dir'] . '/_tokens/' . hash('sha256', $token) . '.json',
            json_encode(['quote_id' => $quoteId, 'file_id' => $id, 'expires' => time() + EVS_LINK_DAYS * 86400]), LOCK_EX);
        $files[] = ['name' => $f['name'], 'size' => (int)$f['size'], 'url' => evs_site_url() . '/api/download.php?t=' . $token];
    }
    $m['submitted'] = time();
    $m['contact'] = ['name' => $name, 'company' => $company, 'email' => $email, 'city' => $city, 'total' => $total, 'kind' => $kind];
    return $m;
});
if ($already) evs_json(['ok' => true, 'quote_id' => $quoteId, 'files' => count($m['files']), 'repeat' => true]);

$list = '';
foreach ($files as $f) $list .= '- ' . $f['name'] . ' (' . evs_human_bytes($f['size']) . ")\n  " . $f['url'] . "\n";
if ($list === '') $list = "No files were uploaded. Ask the client for the drawings and calcs.\n";
$plainList = '';
foreach ($files as $f) $plainList .= '- ' . $f['name'] . ' (' . evs_human_bytes($f['size']) . ")\n";

$subject = ($kind === 'custom' ? 'Custom quote request ' : 'Job request ') . $quoteId . ($total !== '' ? ' — ' . $total : '') . ' — ' . $company;
$body = ($kind === 'custom' ? "Custom quote request (over the instant quote limit).\n\n" : "The client asked for this job.\n\n")
    . "Quote: $quoteId\n" . ($total !== '' ? "Total: $total\n" : '') . ($valid !== '' ? "Valid until: $valid\n" : '')
    . "Name: $name\nCompany: $company\nEmail: $email\nProject city: $city, FL\n\n"
    . "Files (private links, valid " . EVS_LINK_DAYS . " days, files deleted after " . EVS_RETENTION_DAYS . " days):\n$list\n"
    . "Quote details:\n$summary\n";
$sentUs = evs_send_mail($cfg['mail_to'], $subject, $body, $email);
if (!$sentUs) {
    // Email failed. Undo "submitted" so the browser can fall back to FormSubmit and the client can retry.
    evs_manifest_update($quoteId, function (array $m) { $m['submitted'] = null; $m['mail_failed'] = time(); return $m; });
    evs_fail(502, 'mail', 'We could not send your request.');
}

$confirm = "Thank you for your request to EverSafe Fire Protection.\n\n"
    . "Quote: $quoteId\n" . ($total !== '' ? "Price: $total\n" : '') . ($valid !== '' ? "Valid until: $valid\n" : '') . "\n"
    . ($plainList !== ''
        ? "We received these files:\n$plainList\nNext step: we check the drawings against the quote and confirm the price by email, usually within one business day. Turnaround starts when we have a complete package.\n"
        : "We did not receive any files yet. Next step: reply to this email with your drawings and calcs, or use the upload on the quote page. We confirm the price when we receive them.\n")
    . "\nYour files are stored privately and deleted after " . EVS_RETENTION_DAYS . " days.\n"
    . "Questions? Call 386-837-4057 or reply to this email.\n\nEverSafe Fire Protection\n" . evs_site_url() . "\n";
$sentClient = evs_send_mail($email, 'We received your request ' . $quoteId, $confirm, $cfg['mail_to']);

evs_json(['ok' => true, 'quote_id' => $quoteId, 'files' => count($files), 'confirmation' => $sentClient]);
