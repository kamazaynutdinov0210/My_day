# Mobile Deployment Guide

## Recommended approach

Use the existing responsive web app and add PWA support.

## Why PWA

- No rewrite of the app.
- Works on Android and iPhone via browser.
- Can be installed to home screen.
- Reuses existing Next.js frontend and NestJS backend.

## Required PWA files

- `apps/web/public/manifest.json`
- service worker
- icons in `apps/web/public/icons`

## manifest.json example

```json
{
  "name": "My Day",
  "short_name": "My Day",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b0f14",
  "theme_color": "#d4a85a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Native app option

Not recommended initially. React Native/Flutter would require a separate client and duplicate UI work. Use PWA first.