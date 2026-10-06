# Ours, always — Memory Vault

A soft, romantic private space for a shared love letter, voice note, and photo memories.

## Live pages

- Home: https://project29756.websitepublisher.ai/ (sends visitors to sign-in)
- Private sign-in: https://project29756.websitepublisher.ai/login.html
- Private love letter and voice note: https://project29756.websitepublisher.ai/our-note.html
- Private photo gallery: https://project29756.websitepublisher.ai/memories.html

## Privacy and storage

- This GitHub repository is private and contains only the site source. It does not contain the passcode, letter, voice recording, or photos.
- Tenant Auth checks the shared passcode on the server. Membership is provisioned; visitors cannot sign themselves up.
- Photos, the letter artwork, and the voice recording live in WebsitePublisher's private Gated Files storage, not in the website's public asset library or this repository.
- File access is checked against the signed-in member. Photos, the letter, and recording are delivered with short-lived links.
- New photos upload directly to private storage. Accepted types: JPEG, PNG, WebP and GIF. Upload limit: 25 MB per image.
- The account login identifier is kept in the page script so the sign-in screen only needs the shared passcode. If the passcode is forgotten, the site owner can reset it through Tenant Auth.

The member upload interface is append-only. The gallery currently does not provide a delete action for uploaded photos.
