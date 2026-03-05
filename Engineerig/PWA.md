# IShapeMyDays — PWA Implementation Plan

## Current State

| Area | Status |
|------|--------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Auth** | Supabase (session via middleware) |
| **UI** | Dark theme, mobile-first, `max-width: 640px`, BottomNav |
| **Manifest** | ❌ None |
| **Service Worker** | ❌ None |
| **Icons** | ❌ Only `favicon.ico` |
| **Offline Support** | ❌ None |
| **Install Prompt** | ❌ None |

> The app is already mobile-first with safe-area padding, 44px touch targets, and `100dvh` layout. It's structurally ready for PWA.

---

## What Makes a PWA

A PWA needs three things to be installable:

1. **Web App Manifest** (`manifest.json`) — app name, icons, theme, display mode
2. **Service Worker** — caching, offline fallback, background sync
3. **HTTPS** — already handled by Vercel/Supabase

---

## 1. Web App Manifest

### File: `public/manifest.json`

| Field | Value | Reason |
|-------|-------|--------|
| `name` | IShapeMyDays | Full name for install dialog |
| `short_name` | IShapeMyDays | Home screen label (≤12 chars ideal) |
| `description` | Shape your habits, shape your life | Install prompt subtitle |
| `start_url` | `/dashboard` | Launch directly into main view |
| `display` | `standalone` | No browser chrome — feels native |
| `orientation` | `portrait` | App is mobile-portrait only |
| `theme_color` | `#0F172A` | Matches `--bg-primary` (dark theme) |
| `background_color` | `#0F172A` | Splash screen background |
| `scope` | `/` | Entire app is within PWA scope |
| `categories` | `["productivity", "health", "lifestyle"]` | App store categorization |

### Required Icons

PWA needs multiple icon sizes. Generate from a single 1024×1024 source:

| Size | Purpose | File |
|------|---------|------|
| 72×72 | Android legacy | `icon-72x72.png` |
| 96×96 | Android legacy | `icon-96x96.png` |
| 128×128 | Android | `icon-128x128.png` |
| 144×144 | Android | `icon-144x144.png` |
| 152×152 | iOS | `icon-152x152.png` |
| 192×192 | Android install | `icon-192x192.png` |
| 384×384 | Android splash | `icon-384x384.png` |
| 512×512 | Android splash + store | `icon-512x512.png` |
| 180×180 | iOS home screen | `apple-touch-icon.png` |

All icons should use the app's emerald accent (`#10B981`) on dark background (`#0F172A`).

### Maskable Icon

Android requires a **maskable** icon variant — the logo should have 20% safe-area padding so it doesn't clip when the OS applies circle/squircle masks.

- Provide at least `icon-192x192-maskable.png` and `icon-512x512-maskable.png`
- Add `"purpose": "maskable"` to these entries in the manifest

---

## 2. Service Worker Strategy

### Recommended: `next-pwa` or `@serwist/next`

Since this is Next.js 16, the best approach is using **`@serwist/next`** (modern fork of the deprecated `next-pwa`). It auto-generates a service worker from the Next.js build.

### Caching Strategy

| Resource | Strategy | Reason |
|----------|----------|--------|
| **App Shell** (HTML, JS, CSS) | **Precache** | Instant loads, offline-capable |
| **Static assets** (fonts, icons) | **Cache First** | Rarely change, load instantly |
| **API calls** (Supabase) | **Network First** | Always fresh data, fallback to cache |
| **Images** | **Stale While Revalidate** | Show cached, update in background |
| **Auth routes** (`/login`, `/verify`) | **Network Only** | Must be online for auth |

### Offline Fallback

Create a simple offline page (`public/offline.html`) that shows:
- App logo
- "You're offline" message
- "Your data will sync when you're back online"
- Styled to match the dark theme

### What Should Work Offline

| Feature | Offline Behavior |
|---------|-----------------|
| **View cached log** | ✅ Show last-loaded daily log from cache |
| **View cached analytics** | ✅ Show last-loaded charts from cache |
| **Toggle habit** | ⚠️ Queue action, sync when online (background sync) |
| **Add food log** | ⚠️ Queue action, sync when online |
| **Login/Signup** | ❌ Requires network |
| **Profile edit** | ❌ Requires network |

> **Phase 1** (MVP): Precache app shell + offline fallback page only.
> **Phase 2** (Future): Background sync for queued actions.

---

## 3. Meta Tags for PWA

### Add to `app/layout.tsx` `<head>`

```
<meta name="application-name" content="IShapeMyDays" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="IShapeMyDays" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#0F172A" />
<meta name="msapplication-TileColor" content="#0F172A" />

<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

---

## 4. Install Prompt (A2HS)

### Custom Install Banner

Instead of relying on the browser's default "Add to Home Screen" prompt, create a custom in-app install banner:

- **Where**: Show on the `/dashboard` page (first visit after login)
- **When**: Only show if `beforeinstallprompt` event fires (= not already installed)
- **What**: A dismissible banner at the top: "📲 Install IShapeMyDays for the best experience"
- **Persist dismissal**: Store in `localStorage` so it doesn't re-appear after dismissal
- **iOS**: On iOS (no `beforeinstallprompt`), show manual instructions: "Tap Share → Add to Home Screen"

---

## 5. iOS-Specific Considerations

iOS PWAs have limitations:

| Feature | iOS Support |
|---------|-------------|
| Push notifications | ✅ Supported since iOS 16.4 |
| Background sync | ❌ Not supported |
| `beforeinstallprompt` | ❌ Not supported (manual install only) |
| Splash screen | ✅ With `apple-touch-startup-image` |
| Status bar | ✅ With `apple-mobile-web-app-status-bar-style` |
| Cookie/Storage persistence | ⚠️ WebKit may evict after 7 days of no use |

### iOS Splash Screens

Apple requires specific splash screen images per device. Use `apple-touch-startup-image` media queries for each device size. Tools like **pwa-asset-generator** can auto-generate these.

---

## 6. Splash Screen Design

Since the app theme is dark with emerald accent:

| Element | Value |
|---------|-------|
| Background | `#0F172A` (--bg-primary) |
| Logo | App icon centered, white/emerald |
| App Name | "IShapeMyDays" in Inter 600, white |
| Tagline | "Shape Your Habits" in Inter 400, `#94A3B8` |

---

## 7. Play Store / App Store Distribution

### Google Play Store (via TWA)

If Play Store distribution is wanted later:

1. **Bubblewrap** generates an Android wrapper (Trusted Web Activity)
2. **Digital Asset Links** file required at `/.well-known/assetlinks.json`
3. **Offline navigation** must work (mandatory for TWA)
4. Must pass Lighthouse PWA audit

### Apple App Store

Not directly possible for PWAs. Would require a native WebView wrapper (e.g., Capacitor/Ionic).

---

## 8. Implementation Order

| Phase | What | Priority |
|-------|------|----------|
| **Phase 1** | Manifest + Icons + Meta tags | 🔴 Must have |
| **Phase 2** | Service Worker with precaching + offline page | 🔴 Must have |
| **Phase 3** | Custom install prompt banner | 🟡 Should have |
| **Phase 4** | iOS splash screens | 🟡 Should have |
| **Phase 5** | Background sync for offline actions | 🟢 Nice to have |
| **Phase 6** | Push notifications (daily reminders) | 🟢 Nice to have |
| **Phase 7** | TWA for Play Store | 🔵 Future |

---

## 9. Testing & Validation

### Lighthouse PWA Audit

Run in Chrome DevTools → Lighthouse → check "Progressive Web App":

- ✅ Installable
- ✅ Has manifest with proper icons
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Sets `theme-color`
- ✅ Redirects HTTP to HTTPS
- ✅ Viewport meta tag set

### Manual Testing

| Test | How |
|------|-----|
| Install on Android | Chrome → menu → "Install app" |
| Install on iOS | Safari → Share → "Add to Home Screen" |
| Offline behavior | Enable Airplane mode → open app |
| Splash screen | Kill app → reopen from home screen |
| Theme color | Check status bar matches `#0F172A` |

---

## 10. Files to Create/Modify

| File | Action |
|------|--------|
| `public/manifest.json` | **[NEW]** Web app manifest |
| `public/icons/` | **[NEW]** All icon sizes |
| `public/offline.html` | **[NEW]** Offline fallback page |
| `app/layout.tsx` | **[MODIFY]** Add meta tags + manifest link |
| `next.config.ts` | **[MODIFY]** Add `@serwist/next` plugin |
| `app/sw.ts` | **[NEW]** Service worker entry (if using Serwist) |
| `package.json` | **[MODIFY]** Add `@serwist/next` dependency |
| `components/ui/InstallBanner.tsx` | **[NEW]** Custom install prompt |
