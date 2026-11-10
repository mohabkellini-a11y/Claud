# EverSafe website: go-live checklist

This file is not shown on the website.

## Change log

| Phase | What changed |
|---|---|
| 1 | Risky claims replaced. New trust bar with FBPE Registry No. 40449. Redirects to `https://eversafe-fire.com`. Larger tap targets and text. Pages readable without JavaScript. |
| Look | The original look and all animation were kept, at the owner's request. |
| 2 | New menu. Services in three groups. One shared header and footer. New pages: About, Guides, Privacy, For MEP Firms, For General Contractors. |
| 3 | Drawing upload in the quote tool. New contact form. PHP handlers in `api/`. |
| 4 | Schema on every page, shorter titles and descriptions, five new FAQs, `llms-full.txt`, crawler rules, compression. |
| 5 | Copy pass, approved by the owner. Plain sentences, no long dashes, no promises about the AHJ. |

## A. Safe to merge at any time

The upload and the new contact handler stay **off** until step B is done. Until then:
- The quote tool works as before and sends through FormSubmit.
- The contact form sends through FormSubmit.
- The upload area does not show.

Two FAQ answers and the privacy page already describe the upload. So do step B soon after the merge.

## B. One-time steps on Hostinger (turns the upload on)

1. **Make the private folder.** In hPanel, File Manager, go to `domains/eversafe-fire.com/`. You see `public_html` there. Next to it (not inside it), create a folder named `eversafe-private`.
2. **Create `config.php`.** Copy `config.sample.php` from the repo into `eversafe-private` and rename it to `config.php`. Change three values:
   - `secret`: any long random text, 40 characters or more.
   - `smtp_pass`: a Google app password (see step 3).
   - Leave the rest as it is.
3. **Get a Google app password.** Sign in to the Google account of info@eversafe-fire.com. Turn on 2-Step Verification. Then open https://myaccount.google.com/apppasswords, create a password named "Website", and paste the 16 letters into `smtp_pass`. This is not your normal password. You can delete it at any time and the website loses access.
   If the page says app passwords are not available, your Workspace admin must allow them. Tell the next session and it can switch to another mail method.
4. **PHP limits.** In hPanel, Advanced, PHP Configuration, PHP Options: set `upload_max_filesize` to 16M or more and `post_max_size` to 16M or more. Files are sent in 5 MB parts, so this is enough for 100 MB files.
5. **Cron job.** In hPanel, Advanced, Cron Jobs, add a job that runs once a day:
   `php /home/USER/domains/eversafe-fire.com/public_html/api/cleanup.php`
   Replace `USER` with your Hostinger user name (File Manager shows the full path).

Client files are saved in `eversafe-private/uploads/`. That folder is outside `public_html`. A website deploy only rewrites `public_html`, so it cannot delete or expose client files.

## C. Five-minute live test (after B)

1. Open `/pe-stamping-plan-review.html`. Enter 120 devices and your own contact details. Press "Get my price".
2. An upload area shows under the price. Add a small PDF. It reaches "Uploaded".
3. Press "Request this job". A green message shows on the same page with the quote ID.
4. Check the inbox of info@eversafe-fire.com. One email with the quote and a private file link. Click the link. The PDF downloads.
5. Check the email address you typed. One confirmation email, with no file link.
6. On any page, send the contact form. A message shows on the page, and one email arrives.
7. In File Manager, open `eversafe-private/uploads/`. There is one folder named like the quote ID.
8. Open `https://eversafe-fire.com/api/lib.php` and `https://eversafe-fire.com/config.sample.php`. Both must show an error page, not code.

If step 2 shows no upload area, `config.php` is missing, in the wrong folder, or the `secret` is shorter than 32 characters.

## Rollback

On GitHub, open the merged pull request and press **Revert**. Merge the revert. Hostinger deploys the old site in seconds.
The last commit before this work was `cdea68c` on `hostinger-deploy`.
Rollback does not delete `eversafe-private`. Uploaded files stay.

## Only the owner can do these

- Google Search Console: the address is now `https://eversafe-fire.com` (no `www`). Submit `https://eversafe-fire.com/sitemap.xml`. Do the same in Bing Webmaster Tools.
- Check that the Google Business Profile links to `https://eversafe-fire.com`.
- Test the home page and `faq.html` in Google's Rich Results Test.
- Confirm the wording on `privacy.html` about how long messages are kept.
- Consider making the GitHub repo private and turning off GitHub Pages.
