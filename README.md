# Ours, always — Memory Vault

A romantic, private photo-memory site built with WebsitePublisher.

## Live pages

- Private sign-in: https://project29756.websitepublisher.ai/login.html
- Memory gallery: https://project29756.websitepublisher.ai/memories.html

## Privacy and storage

- The repository is private and stores only site source. It contains no passcode and no photos.
- Tenant Auth checks the shared passcode on the server. The account is provisioned, so visitors cannot sign themselves up.
- Photos upload directly into WebsitePublisher's private Gated Files storage. The public CDN is not used for memory photos.
- Image access is checked for the authenticated member, and image delivery uses temporary links.
- The account login identifier is kept in the page script so the login screen only needs the shared passcode. If the passcode is forgotten, the site owner can reset it through Tenant Auth.

Accepted photo types: JPEG, PNG, WebP and GIF. Upload limit: 25 MB per image.

The member upload interface is append-only in the current private-file integration. Photo removal is not exposed in the gallery UI.
