# Fluent — Security & Secret Hygiene

This project follows a **no-secrets-in-source** policy. The repository
contains only **placeholders** and the *names* of the variables we expect to
be set at build time.

## Secret loading order

| Source                                                | When               | Notes                      |
| ----------------------------------------------------- | ------------------ | -------------------------- |
| Build-time env vars (`process.env.*`)                 | CI / production    | Highest priority           |
| `.env` file at repo root                              | Local dev          | Gitignored                 |
| Placeholder strings in `src/environments/environment.ts` | Fallback        | Fail loudly at runtime     |

Run `node scripts/setup-env.mjs` (auto-invoked by `npm run build` /
`npm start`) to materialize `environment.local.ts` (dev) and
`environment.prod.ts` (prod) from the merged sources.

## Diagnosing the common startup errors

These two errors are **almost always** caused by missing or placeholder
environment values, not by code bugs. Fix them in `.env` and rebuild.

### `FirebaseError: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)` or `auth/api-error`

Meaning: the Firebase Auth SDK called Google's identity platform with an
API key the project does not recognize.

Checklist:

1. Open the browser console. You will see a line beginning with
   `[error] env.invalid` listing every missing or placeholder field.
2. Ensure `.env` exists at the repo root and contains a real
   `FIREBASE_API_KEY` copied from Firebase Console → Project settings →
   General → "Your apps" → SDK setup and configuration.
3. Run `npm run build` (or `npm start`) — the prebuild hook regenerates
   `src/environments/environment.{local,prod}.ts`.
4. If the key IS real, check that it matches the same project as
   `FIREBASE_AUTH_DOMAIN` and `FIREBASE_PROJECT_ID` — mixing keys across
   Firebase projects produces the same error.

### `Could not reach reCAPTCHA` / `recaptcha/sitekey-missing` / `AppCheckError: app-check/recaptcha-error`

Meaning: `initializeAppCheck` was called with an empty or wrong
reCAPTCHA Enterprise site key.

Checklist:

1. Create a reCAPTCHA Enterprise key:
   - Go to <https://console.cloud.google.com/security/recaptcha>.
   - Select the **same** project as Firebase.
   - "Create key" → Platform **Website** → add `localhost` and your
     production domain → Save.
   - Copy the **Site key** (not the Legend/API key).
2. Register it with Firebase App Check:
   - Firebase Console → **App Check** → your web app → reCAPTCHA Enterprise.
   - Paste the site key and save.
3. Put the same value into `.env` as `APP_CHECK_SITE_KEY`, rebuild.
4. Only **after** you confirm App Check tokens arrive (Firebase Console →
   App Check → Requests tab), turn on **Enforce** for each product.
   Enabling enforcement before the key works is what causes the cascade
   from `app-check/*` errors into `auth/api-error`.

Until `APP_CHECK_SITE_KEY` is set, `app.config.ts` falls back to the App
Check debug-token path so the app still boots. You will see a
`[warn] appCheck.skipped` line in the console when this happens.

## What MUST be done in the GCP / Firebase consoles

Software cannot configure these. A human must:

1. **Restrict the Google Maps API key**
   - Cloud Console → APIs & Services → Credentials → your key.
   - "Application restrictions" → HTTP referrers: `https://*.run.app/*`,
     your production domain, `http://localhost:4200/*`.
   - "API restrictions": allow only **Maps JavaScript API** (and
     **Places API** if you ever enable places search).

2. **Register and enforce Firebase App Check**
   - Firebase Console → App Check → Web app → reCAPTCHA Enterprise.
   - Paste the site key from `.env`.
   - Verify the "Requests" tab shows incoming tokens for at least
     24 hours.
   - Only then click **Enforce** for Firestore, Functions, Auth (and
     AI Logic if you use it directly).

3. **Deploy Firestore security rules**
   - The `firestore.rules` file in this repo is the source of truth.
   - `firebase deploy --only firestore:rules`.
   - Run `firebase emulators:exec --only firestore "npm test"` locally
     before each rule change.

4. **Set GCP budget alerts**
   - Cloud Console → Billing → Budgets & alerts.
   - Alert at 50% / 90% / 100% of your monthly cap.
   - Without this, an App Check bypass = open wallet.

## Rotating keys previously committed to git history

If `git log --all -p -- src/environments/environment.ts` shows real keys,
rotate them:

```bash
# Maps key
gcloud services api-keys create --display-name "fluent-maps-2026" \
  --allowed-referrers "https://*.run.app/*,http://localhost:4200/*"
# Then delete the old one in console.

# Firebase apiKey rotation requires creating a new web app in Firebase
# Console; the old key keeps working but moves out of the active config.
```

Force-purge from git history if the project is pre-release:

```bash
git filter-repo --path src/environments/environment.ts --invert-paths
git push --force origin main
```

## Reporting vulnerabilities

Open a private security advisory in the repo's `Security` tab. Do not file
public issues for security-sensitive findings.
