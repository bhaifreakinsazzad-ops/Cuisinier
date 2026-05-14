# Cuisinier PWA Testing Guide

## Requirements

- Deploy over HTTPS for real install testing
- Use a production or preview build, not only `npm run dev`
- Confirm the manifest, service worker, and icons are accessible after deploy

## Local Validation

1. Run `npm install`
2. Run `npm run build`
3. Run `npm run preview`
4. Open the preview URL in Chrome
5. Check:
   - `/manifest.webmanifest` loads
   - service worker registers
   - `/offline.html` exists
   - `/install` shows install help

## Desktop Chrome Install Test

1. Open the deployed site in Chrome.
2. Wait for the page to settle and interact with the home screen.
3. Use the in-app install CTA.
4. Confirm:
   - install prompt appears, or fallback guidance appears
   - installed app opens in standalone mode
   - `App Mode Active` badge is visible in standalone mode

## Chrome Android Install Test

1. Open the deployed site in Chrome on Android.
2. Wait for the page to settle and interact with the app.
3. Use the in-app install CTA.
4. If the browser prompt does not appear, open the Chrome menu and use `Add to Home screen` or `Install app`.
5. Launch the installed app from the home screen.
6. Confirm:
   - splash and home load correctly
   - standalone display is applied
   - install prompt banner no longer blocks the app after dismissal or install

## iPhone Safari Add to Home Screen

1. Open the deployed site in Safari on iPhone.
2. Tap the Share button.
3. Tap `Add to Home Screen`.
4. Launch the installed shortcut.
5. Confirm:
   - app opens cleanly
   - theme and icons look correct
   - `/install` instructions match the user flow

Note: iPhone does not support the Chrome-style `beforeinstallprompt` event. The fallback guidance is expected.

## Offline Shell Test

1. Open the deployed site once while online.
2. Visit the home route and one customer flow route such as `/menu`.
3. Disconnect the device from the internet.
4. Reload the app shell.
5. Confirm:
   - shell still loads
   - offline fallback appears where expected
   - checkout submission remains blocked without internet

## Standalone Mode Test

1. Launch the installed app from the home screen or desktop shortcut.
2. Confirm browser chrome is removed or minimized.
3. Confirm `App Mode Active` appears on the home screen.

## Cache Clearing And Service Worker Update Test

1. Open DevTools in Chrome.
2. Go to Application > Service Workers.
3. Check for an active service worker.
4. Use `Update` or hard refresh after a new deploy.
5. If stale assets remain, clear site data and reload.

## Lighthouse PWA Audit

1. Open Chrome DevTools.
2. Run Lighthouse against the deployed HTTPS build.
3. Include the PWA category.
4. Verify:
   - manifest is valid
   - service worker is controlling the page
   - installability checks pass
   - icons and theme color are correct

## HTTPS Requirement

- Real install behavior should only be trusted on HTTPS
- Preview or production deploys are the correct validation target
- Do not claim final PWA launch readiness from localhost alone
