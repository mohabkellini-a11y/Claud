<?php
/** Contact form. POST: name, company, email, phone, need, message, _honey (honeypot). */
declare(strict_types=1);
require __DIR__ . '/lib.php';
evs_require_post();
evs_require_same_origin();
evs_rate_limit('contact', 8, 3600);
if (evs_line($_POST['_honey'] ?? '') !== '') evs_json(['ok' => true]);
$name = evs_line($_POST['name'] ?? '', 120); $company = evs_line($_POST['company'] ?? '', 160);
$email = evs_line($_POST['email'] ?? '', 200); $phone = evs_line($_POST['phone'] ?? '', 40);
$need = evs_line($_POST['need'] ?? '', 40); $message = evs_text($_POST['message'] ?? '', 5000);
$needs = ['Review and seal', 'Design', 'Code and analysis', 'Not sure'];
$errors = [];
if ($name === '') $errors['name'] = 'Enter your name.';
if ($company === '') $errors['company'] = 'Enter your company.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Enter a valid email address.';
if (!in_array($need, $needs, true)) $errors['need'] = 'Choose what you need.';
if ($message === '') $errors['message'] = 'Tell us about the project.';
if ($errors) evs_json(['ok' => false, 'error' => 'fields', 'fields' => $errors], 400);
$cfg = evs_config();
$body = "New proposal request from the website.\n\nName: $name\nCompany: $company\nEmail: $email\nPhone: " . ($phone ?: 'not given') . "\nNeeds: $need\n\nProject details:\n$message\n";
if (!evs_send_mail($cfg['mail_to'], "New proposal request — $need — $company", $body, $email)) evs_fail(502, 'mail', 'We could not send your message.');
evs_send_mail($email, 'We received your request', "Thanks for reaching out to EverSafe Fire Protection.\n\nWe have your request and will follow up with a fixed-fee proposal, usually within one business day.\nNeed us sooner? Call 386-837-4057.\n\nEverSafe Fire Protection\n" . evs_site_url() . "\n", $cfg['mail_to']);
evs_json(['ok' => true]);
