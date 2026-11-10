<?php
/**
 * EverSafe website settings. SAMPLE FILE.
 *
 * 1. On Hostinger, make a folder NEXT TO public_html (not inside it) named:  eversafe-private
 *    Example:  /home/USER/domains/eversafe-fire.com/eversafe-private/
 * 2. Copy this file into that folder and name it:  config.php
 * 3. Fill in the three values marked CHANGE.
 * Never put config.php in the GitHub repo.
 */
return [
    // CHANGE: a long random text, at least 32 characters. Used to sign upload sessions.
    'secret' => 'CHANGE-ME-to-a-long-random-text-of-40-or-more-characters',

    // Email is sent through Google Workspace.
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_user' => 'info@eversafe-fire.com',
    // CHANGE: a Google "app password" (16 letters). This is NOT your normal Gmail password.
    'smtp_pass' => 'CHANGE-ME',

    'mail_from'      => 'info@eversafe-fire.com',
    'mail_from_name' => 'EverSafe Fire Protection',
    'mail_to'        => 'info@eversafe-fire.com',   // where requests are sent

    'site_url'      => 'https://eversafe-fire.com',
    'allowed_hosts' => ['eversafe-fire.com', 'www.eversafe-fire.com'],

    // Where client files are stored. Default: an "uploads" folder next to this config file,
    // which is outside public_html, so a website deploy can never touch it.
    // 'upload_dir' => '/home/USER/domains/eversafe-fire.com/eversafe-private/uploads',

    // 'mail_mode' => 'log',   // for tests only: write emails to a file and send nothing
];
