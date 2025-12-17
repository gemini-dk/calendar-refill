# Firebase Functions (Firestore trigger) for PDF generation

This project can generate PDFs asynchronously via a Firestore trigger instead of an external queue.

## What it does

- Stripe webhook writes purchase state to:
  - `stripe_sessions/{sessionId}`
  - `stripe/{userId}`
- A Firestore trigger (`functions/src/index.ts`) watches `stripe_sessions/{sessionId}`.
- When `status` becomes `paid_processing`, it:
  - sets status to `generating_pdf`
  - generates the PDF
  - saves it to Cloud Storage (`system-notebook/{userId}/...pdf`)
  - writes `stripe/{userId}.downloadUrl`
  - sets status to `completed` (or `failed` on error)

## Required environment variables

In the Firebase Functions environment:

- `FIREBASE_STORAGE_BUCKET` (recommended)
- `PDF_FONTS_GCS_PREFIX` (optional, default: `resources/fonts`)

### Fonts

PDFKit needs Japanese fonts to render Japanese text correctly.

Upload the required `.ttf` files to your Storage bucket under:

- `${PDF_FONTS_GCS_PREFIX}/Noto_Sans_JP/NotoSansJP-Medium.ttf`
- `${PDF_FONTS_GCS_PREFIX}/Noto_Serif_JP/NotoSerifJP-Medium.ttf`
- `${PDF_FONTS_GCS_PREFIX}/Montserrat/Montserrat-Medium.ttf`
- `${PDF_FONTS_GCS_PREFIX}/Playfair_Display/PlayfairDisplay-Medium.ttf`

If fonts are missing, the function still runs, but Japanese text may not render correctly in the PDF.

## Build / deploy

From repo root:

- `cd functions && npm i`
- `npm run build`
- `npm run deploy`

