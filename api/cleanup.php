<?php
/**
 * Deletes uploads older than 90 days, expired download links and old rate-limit files.
 * Command line only. Add it as a daily Hostinger cron job:
 *   php /home/USER/domains/eversafe-fire.com/public_html/api/cleanup.php
 */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/lib.php';
$cfg = evs_config(); $root = $cfg['upload_dir']; $now = time(); $n = 0;
function evs_rmdir(string $d): void { foreach (glob($d . '/{,.}[!.,!..]*', GLOB_BRACE) ?: [] as $p) { is_dir($p) ? evs_rmdir($p) : @unlink($p); } @rmdir($d); }
foreach (glob($root . '/EVS-Q*', GLOB_ONLYDIR) ?: [] as $dir) {
    $m = json_decode((string)@file_get_contents($dir . '/manifest.json'), true);
    $created = (int)($m['created'] ?? filemtime($dir));
    $abandoned = empty($m['submitted']) && $created < $now - 2 * 86400;      // never requested: keep 2 days only
    if ($created < $now - EVS_RETENTION_DAYS * 86400 || $abandoned) { evs_rmdir($dir); $n++; }
}
foreach (glob($root . '/_tokens/*.json') ?: [] as $f) {
    $t = json_decode((string)@file_get_contents($f), true);
    if (!is_array($t) || (int)$t['expires'] < $now || !is_dir($root . '/' . ($t['quote_id'] ?? 'x'))) @unlink($f);
}
foreach (glob($root . '/_rate/*.json') ?: [] as $f) { if (filemtime($f) < $now - 86400) @unlink($f); }
echo date('c') . " cleanup done. Quote folders deleted: $n\n";
