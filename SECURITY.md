# Fluent — Security & Secret Hygiene

This project follows a **no-secrets-in-source** policy. The only thing the
repository contains is **placeholders** and the *names* of the variables we
expect to be set at build time.

## Secret loading order

| Source | When | Notes |
|--------|------|-------|
| Build-time env vars (`process.env.*`) | CI / production | Highest priority |
| `.env` file at repo root | Local dev | Gitignored |
| Placeholder strings in `src/environments/environment.ts` | Fallback | Fail loudly at runtime |

Run `npm run setup:env` to materialize `environment.local.ts` (dev) and
`environment.prod.ts` (prod) from the merged sources.

## What MUST be done in the GCP / Firebase consoles

Software cannot configure these. A human must:

1. **Restrict the Google Maps API key**
   - Console → Google Maps Platform → Credentials → your key
   - Set "Application restrictions" → HTTP referrers
   - Allow: `https://*.run.app/*`, `https://your-domain.com/*`, and dev origins
   - Set "API restrictions" → restrict to `Maps JavaScript API`, `Places API` (if used)

2. **Enable Firebase App Check**
   - Firebase Console → App Check → Web app → reCAPTCHA Enterprise
   - Register a site key and copy it into `APP_CHECK_SITE_KEY`
   - Set enforcement on **all** consumed services: Firestore, Functions, AI Logic
   - Until enforcement is on, anyone with your Firebase config can call Gemini
     on your billing.

3. **Set Firestore security rules**
   - The `firestore.rules` file in this repo is the source of truth
   - Deploy via `firebase deploy --only firestore:rules`
   - Run `firebase emulators:exec --only firestore "npm test"` locally before
     each rule change

4. **Set a GCP budget alert**
   - Cloud Console → Billing → Budgets & alerts
   - Recommended: alert at 50% / 90% / 100% of your monthly cap
   - Without this, an App Check bypass = open wallet

## Rotating the keys committed in commit `bd9b326`

The Firebase web `apiKey` and Maps `apiKey` were committed to git history.
Both need to be rotated **even though** the Firebase one is technically
identifier-not-secret:

```bash
# 1. Maps key
gcloud services api-keys create --display-name "fluent-maps-2026" \
  --allowed-referrers "https://*.run.app/*"
# Then delete the old one in console.

# 2. Firebase apiKey rotation requires creating a new web app in Firebase
#    Console; the old key keeps working but moves out of the active config.
```

## Reporting vulnerabilities

Open a private security advisory in the repo's `Security` tab. Do not file
public issues for security-sensitive findings.
