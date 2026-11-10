<?php
/** Issues a signed upload session when the price is shown. POST quote_id. */
declare(strict_types=1);
require __DIR__ . '/lib.php';
evs_require_post();
evs_require_same_origin();
evs_rate_limit('token', 30, 3600);
$quoteId = evs_line($_POST['quote_id'] ?? '', 40);
if (!evs_valid_quote_id($quoteId)) evs_fail(400, 'quote_id');
$dir = evs_quote_dir($quoteId);
// A quote id that someone else already used cannot be opened again.
if (is_file($dir . '/manifest.json')) {
    $m = json_decode((string)file_get_contents($dir . '/manifest.json'), true);
    if (!empty($m['submitted'])) evs_fail(409, 'used');
}
evs_json(['ok' => true, 'token' => evs_token_make($quoteId),
    'limits' => ['file' => EVS_MAX_FILE_BYTES, 'quote' => EVS_MAX_QUOTE_BYTES, 'files' => EVS_MAX_FILES, 'chunk' => EVS_CHUNK_BYTES, 'types' => EVS_ALLOWED_EXT]]);
