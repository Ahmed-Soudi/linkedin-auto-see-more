# LinkedIn Auto See More

A lightweight, privacy-friendly Chrome extension that expands truncated text on LinkedIn as you browse.

**Version 1.1.0:** Specifically supports the "… more" button in the right-hand **About the job** panel of LinkedIn job-search results, including when switching job listings without reloading the page.

## What it does
- Automatically clicks **See more**, **Show more**, **Read more**, and **…more** text-expansion buttons on LinkedIn.
- Works with dynamically loaded content, including posts, job descriptions and profile text.
- Detects the job description expansion button inside LinkedIn's `JobDetails_AboutTheJob_` section, even when the layout uses generated class names.
- Avoids clicking controls that load more comments, jobs, results or people.
- Has a persistent on/off toggle in the toolbar popup.
- Runs exclusively on LinkedIn. Does not collect or send data.

## Install (Chrome / Edge)
1. Extract the ZIP to a permanent folder.
2. Open `chrome://extensions/` (or `edge://extensions/`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extracted `linkedin-auto-see-more` folder (the folder that contains `manifest.json`).
5. Refresh an already-open LinkedIn tab once.
6. Click the toolbar icon to turn auto-expansion on or off.

## Notes
- Only expands text; it does not click LinkedIn's **See more comments**, **Show more jobs**, or **See more results** controls.
- The extension works entirely in your browser, using a local content script. No requests are made to external servers.
- LinkedIn may change its markup and labels, so selectors might eventually need an update.
- This project is not affiliated with LinkedIn.

## Files
- `manifest.json`: Chrome Manifest V3 configuration.
- `content.js`: detects and clicks truncated-text controls.
- `popup.html`, `popup.css`, `popup.js`: toolbar on/off control.
- `icons/`: toolbar and extension icons.
