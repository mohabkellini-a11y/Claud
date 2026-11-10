<?php
/**
 * Receives one file in 5 MB chunks, so it works under any PHP upload limit.
 * POST: token, action (chunk | delete), file_id, name, size, index, total, chunk (file part)
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';
evs_require_post();
evs_require_same_origin();
evs_rate_limit('upload', 1500, 3600);

$quoteId = evs_token_check((string)($_POST['token'] ?? ''));
$fileId  = (string)($_POST['file_id'] ?? '');
if (!preg_match('/^[a-f0-9]{16,32}$/', $fileId)) evs_fail(400, 'file_id');
$action  = (string)($_POST['action'] ?? 'chunk');
$dir     = evs_quote_dir($quoteId);

if ($action === 'delete') {
    evs_manifest_update($quoteId, function (array $m) use ($fileId, $dir) {
        if (!empty($m['submitted'])) return $m;
        if (isset($m['files'][$fileId])) {
            @unlink($dir . '/' . $m['files'][$fileId]['stored']);
            unset($m['files'][$fileId]);
        }
        return $m;
    });
    evs_json(['ok' => true]);
}

$name  = evs_clean_name((string)($_POST['name'] ?? ''));
$ext   = evs_ext($name);
$size  = (int)($_POST['size'] ?? -1);
$index = (int)($_POST['index'] ?? -1);
$total = (int)($_POST['total'] ?? 0);

if (!in_array($ext, EVS_ALLOWED_EXT, true)) evs_fail(415, 'type', 'This file type is not allowed. Allowed: ' . implode(', ', EVS_ALLOWED_EXT) . '.');
if ($size < 1) evs_fail(400, 'size', 'The file is empty.');
if ($size > EVS_MAX_FILE_BYTES) evs_fail(413, 'too_big', 'The file is larger than 100 MB.');
if ($total < 1 || $total !== (int)ceil($size / EVS_CHUNK_BYTES) || $index < 0 || $index >= $total) evs_fail(400, 'chunk');
$up = $_FILES['chunk'] ?? null;
if (!$up || ($up['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($up['tmp_name'])) evs_fail(400, 'chunk', 'The upload was interrupted.');
$chunkSize = (int)filesize($up['tmp_name']);
$expect = ($index === $total - 1) ? $size - EVS_CHUNK_BYTES * ($total - 1) : EVS_CHUNK_BYTES;
if ($chunkSize !== $expect) evs_fail(400, 'chunk', 'The upload was interrupted.');

$result = ['ok' => false];
evs_manifest_update($quoteId, function (array $m) use ($fileId, $name, $ext, $size, $index, $total, $up, $dir, &$result) {
    if (!empty($m['submitted'])) { $result = ['status' => 409, 'error' => 'used', 'message' => 'This quote was already sent.']; return $m; }
    $f = $m['files'][$fileId] ?? null;
    if ($f === null) {
        if (count($m['files']) >= EVS_MAX_FILES) { $result = ['status' => 413, 'error' => 'too_many', 'message' => 'You can upload up to ' . EVS_MAX_FILES . ' files per quote.']; return $m; }
        $sum = 0; foreach ($m['files'] as $o) $sum += (int)$o['size'];
        if ($sum + $size > EVS_MAX_QUOTE_BYTES) { $result = ['status' => 413, 'error' => 'quota', 'message' => 'The files for this quote are larger than 500 MB in total.']; return $m; }
        $f = ['name' => $name, 'ext' => $ext, 'size' => $size, 'total' => $total, 'next' => 0, 'done' => false,
              'stored' => bin2hex(random_bytes(16)) . '.part', 'started' => time()];
    }
    if ($f['done']) { $result = ['ok' => true, 'done' => true]; return $m; }
    if ($f['size'] !== $size || $f['total'] !== $total || $f['name'] !== $name) { $result = ['status' => 400, 'error' => 'chunk']; return $m; }
    if ($index < $f['next']) { $result = ['ok' => true, 'next' => $f['next']]; $m['files'][$fileId] = $f; return $m; }   // repeated chunk: fine
    if ($index > $f['next']) { $result = ['status' => 409, 'error' => 'order', 'next' => $f['next']]; $m['files'][$fileId] = $f; return $m; }

    $path = $dir . '/' . $f['stored'];
    // Truncate to the bytes we have confirmed, then append. A half-written chunk from a dropped connection is discarded.
    $out = fopen($path, 'c+b'); $in = fopen($up['tmp_name'], 'rb');
    if (!$out || !$in) { $result = ['status' => 500, 'error' => 'storage']; return $m; }
    ftruncate($out, $index * EVS_CHUNK_BYTES); fseek($out, 0, SEEK_END);
    stream_copy_to_stream($in, $out); fclose($in); fflush($out); fclose($out);
    $f['next'] = $index + 1;

    if ($f['next'] === $total) {
        clearstatcache(true, $path);
        if (filesize($path) !== $size || !evs_signature_ok($path, $ext)) {
            @unlink($path); unset($m['files'][$fileId]);
            $result = ['status' => 415, 'error' => 'signature', 'message' => 'This file does not look like a real .' . $ext . ' file. It was not saved.'];
            return $m;
        }
        $final = bin2hex(random_bytes(16)) . '.bin';      // random name, no real extension on disk
        rename($path, $dir . '/' . $final); @chmod($dir . '/' . $final, 0600);
        $f['stored'] = $final; $f['done'] = true; $f['finished'] = time();
        $result = ['ok' => true, 'done' => true];
    } else {
        $result = ['ok' => true, 'next' => $f['next']];
    }
    $m['files'][$fileId] = $f;
    return $m;
});

if (!empty($result['ok'])) evs_json($result);
$status = (int)($result['status'] ?? 500); unset($result['status']);
evs_json(['ok' => false] + $result, $status);
