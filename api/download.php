<?php
/** Serves one uploaded file by a long random token. The token is only in the email to EverSafe. */
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('X-Robots-Tag: noindex, nofollow');
$token = (string)($_GET['t'] ?? '');
if (!preg_match('/^[a-f0-9]{64}$/', $token)) { http_response_code(404); exit('Not found'); }
evs_rate_limit('download', 300, 3600);
$cfg = evs_config();
$ref = $cfg['upload_dir'] . '/_tokens/' . hash('sha256', $token) . '.json';
$t = is_file($ref) ? json_decode((string)file_get_contents($ref), true) : null;
if (!is_array($t) || (int)$t['expires'] < time() || !evs_valid_quote_id((string)$t['quote_id'])) { http_response_code(404); exit('This link is not valid or has expired.'); }
$dir = evs_quote_dir($t['quote_id']);
$m = json_decode((string)@file_get_contents($dir . '/manifest.json'), true);
$f = $m['files'][$t['file_id']] ?? null;
if (!$f || empty($f['done']) || !hash_equals((string)($f['token_hash'] ?? ''), hash('sha256', $token))) { http_response_code(404); exit('This link is not valid or has expired.'); }
$path = $dir . '/' . basename($f['stored']);
if (!is_file($path)) { http_response_code(404); exit('This file was deleted.'); }
$name = evs_clean_name($f['name']);
while (ob_get_level()) ob_end_clean();
header('Content-Type: application/octet-stream');
header('Content-Length: ' . filesize($path));
header('Content-Disposition: attachment; filename="' . addcslashes(preg_replace('/[^\x20-\x7E]/', '_', $name), '"\\') . '"; filename*=UTF-8\'\'' . rawurlencode($name));
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
readfile($path);
