# Camoufox Fingerprint Manager

Web interface for capturing, managing, and comparing browser fingerprints for Camoufox browser spoofing.

## Features

### Pages

| Page | URL | Description |
|------|-----|-------------|
| **Capture** | `/` | Auto-detect fingerprint and save profile to database |
| **Profiles** | `/profiles` | List saved profiles, copy Python config, manage versions |
| **Compare** | `/compare` | Compare 14 browser-info fingerprint components + canvas images |
| **Detect** | `/detect` | Manual fingerprint detection with property inspector |
| **Canvas** | `/canvas` | Manual canvas fingerprint management |

### Profile Auto-Naming

Profiles are automatically named using the format: `Browser-WidthxHeight-hash4`

Examples:
- `Firefox-1920x1080-a3f2`
- `Chrome-2560x1440-b7c9`

You can override by passing `?profile=MyCustomName` query parameter.

### Versioning

Each profile stores the detector version used at capture time. When the fingerprint detection logic changes, increment `DETECTOR_VERSION` in `src/lib/fingerprint-detector.ts`.

Profiles page shows:
- Green badge: Profile is up-to-date
- Yellow badge: Profile is outdated, re-capture recommended

### Browser Info Components (14)

The compare page shows hashes for these fingerprint components:

1. **Canvas** - 2D canvas rendering fingerprint
2. **Plugins** - Browser plugin list
3. **Navigator** - Navigator properties + screen info
4. **Gamepad** - Gamepad API availability
5. **Fonts** - Font detection via canvas measureText
6. **Audio** - AudioContext fingerprint
7. **WebGL** - WebGL parameters and extensions
8. **Voices** - Speech synthesis voices
9. **Touch** - Touch support detection
10. **MediaQueries** - CSS media query matches
11. **MediaCodecs** - Video/audio codec support
12. **JsHeap** - JavaScript heap size limit
13. **ScreenAvail** - Screen available dimensions
14. **DNT** - Do Not Track setting

## Setup

```bash
# Install dependencies
bun install

# Push database schema
bun db:push

# Start development server
bun dev
```

## Usage Flow

### Capturing a Profile

1. Open `http://localhost:3000/?profile=MyMacbook` (or without param for auto-naming)
2. Page auto-detects ~100 fingerprint properties
3. Renders any captured canvas fingerprints for this device
4. Saves profile to database

### Using a Profile with Camoufox

1. Go to `/profiles`
2. Click "Copy Config" on your profile
3. Paste into `test.py`:

```python
from camoufox.sync_api import Camoufox

config = {
    # ... paste copied config here
}

with Camoufox(config=config) as browser:
    page = browser.new_page()
    page.goto("https://example.com")
```

### Comparing Fingerprints

1. Open `/compare` on original device - note the hashes
2. Run Camoufox with the profile config
3. Open `/compare` in Camoufox browser
4. Compare hashes to verify spoofing is working

## API Endpoints (tRPC)

### Profile Router

| Procedure | Type | Description |
|-----------|------|-------------|
| `profile.save` | mutation | Save/update profile with fingerprint and canvas data |
| `profile.list` | query | List all profiles with version info |
| `profile.get` | query | Get single profile by name |
| `profile.getConfig` | query | Get Python-ready config with canvas fingerprints |
| `profile.delete` | mutation | Delete a profile by name |
| `profile.deleteAll` | mutation | Delete all profiles |

### Canvas Router

| Procedure | Type | Description |
|-----------|------|-------------|
| `canvas.upload` | mutation | Upload a canvas fingerprint |
| `canvas.uploadBatch` | mutation | Upload multiple canvas fingerprints |
| `canvas.list` | query | List all canvas fingerprints with renders |
| `canvas.uploadRender` | mutation | Upload device-specific render |
| `canvas.delete` | mutation | Delete a canvas fingerprint |
| `canvas.deleteAll` | mutation | Delete all canvas fingerprints |
| `canvas.getConfig` | query | Get canvas config for Camoufox |

## Database Schema

```prisma
model Profile {
  id                String   @id
  name              String   @unique
  browser           String
  screenWidth       Int
  screenHeight      Int
  hashSuffix        String
  fingerprintConfig Json
  userAgent         String
  detectorVersion   Int
  createdAt         DateTime
  updatedAt         DateTime
  canvasFingerprints ProfileCanvasFingerprint[]
}

model ProfileCanvasFingerprint {
  id        String
  profileId String
  hash      String
  width     Int
  height    Int
  method    String
  dataURL   String
  createdAt DateTime
}
```

## Development

### Updating Fingerprint Detection

When modifying `src/lib/fingerprint-detector.ts`:

1. Make your changes to detection logic
2. Increment `DETECTOR_VERSION`
3. Existing profiles will show "Outdated" badge

### Adding New Browser Info Components

Edit `src/lib/browser-info-detector.ts`:

1. Add new detection function following the pattern
2. Add to `collectBrowserInfoFingerprints()` array
3. Component will appear on `/compare` page

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **API**: tRPC 11
- **Database**: SQLite via Prisma (D1-compatible)
- **Styling**: Tailwind CSS 4
- **Runtime**: Bun
