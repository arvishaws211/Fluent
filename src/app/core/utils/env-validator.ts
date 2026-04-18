// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
//
// Runtime environment validator.
//
// The most painful class of bug in a Firebase app is the silent
// misconfiguration: the build succeeds, the page loads, and then the *first*
// auth request fails with `auth/api-key-not-valid` or `auth/api-error`. By
// that point the user is already clicking buttons and blaming the UI.
//
// This module inspects `environment.*` once at bootstrap and classifies each
// required key. Anything still holding a placeholder (`__FOO__`) or obviously
// invalid (empty string) is surfaced with actionable remediation text.

import type { FluentEnvironment } from '../../../environments/types';
import { logger } from './logger';

export interface EnvValidationResult {
  ok: boolean;
  hasAuth: boolean;
  hasAppCheck: boolean;
  hasMaps: boolean;
  problems: string[];
}

const PLACEHOLDER_RE = /^__[A-Z0-9_]+__$/;

function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (PLACEHOLDER_RE.test(trimmed)) return true;
  if (trimmed.startsWith('your-')) return true;
  return false;
}

/**
 * Inspects the active environment and reports which product groups have
 * valid configuration. Never throws; the caller decides how to react.
 */
export function validateEnvironment(env: FluentEnvironment): EnvValidationResult {
  const problems: string[] = [];

  const authFieldChecks: Array<[string, string]> = [
    ['firebase.apiKey', env.firebase?.apiKey],
    ['firebase.authDomain', env.firebase?.authDomain],
    ['firebase.projectId', env.firebase?.projectId],
    ['firebase.appId', env.firebase?.appId],
  ];
  for (const [label, value] of authFieldChecks) {
    if (isPlaceholder(value)) {
      problems.push(
        `${label} is missing or a placeholder. Copy its value from Firebase Console -> Project settings -> General -> "Your apps" -> SDK setup and configuration.`,
      );
    }
  }

  if (isPlaceholder(env.appCheckSiteKey)) {
    problems.push(
      'appCheckSiteKey is missing. Create a reCAPTCHA Enterprise key (Google Cloud Console -> Security -> reCAPTCHA Enterprise -> Create key, type "Website") and paste its site key into APP_CHECK_SITE_KEY in .env. Until then App Check cannot be enforced and Firebase requests will fail with auth/api-error when enforcement is enabled in the Firebase console.',
    );
  }

  if (isPlaceholder(env.googleMapsApiKey)) {
    problems.push(
      'googleMapsApiKey is missing. Create a browser-restricted key at Google Cloud Console -> APIs & Services -> Credentials and add it to GOOGLE_MAPS_API_KEY in .env. Wayfinding will render a fallback message until this is set.',
    );
  }

  return {
    ok: problems.length === 0,
    hasAuth: authFieldChecks.every(([, v]) => !isPlaceholder(v)),
    hasAppCheck: !isPlaceholder(env.appCheckSiteKey),
    hasMaps: !isPlaceholder(env.googleMapsApiKey),
    problems,
  };
}

/**
 * Fire-and-forget logger hook. Call once from `main.ts` so the very first
 * thing a developer sees in the console is a precise list of what to fix.
 */
export function reportEnvironment(env: FluentEnvironment): EnvValidationResult {
  const result = validateEnvironment(env);
  if (result.ok) {
    logger.info('env.validated', {
      production: env.production,
      emulators: env.emulators,
      project: env.firebase.projectId,
    });
    return result;
  }

  logger.error(
    'env.invalid — Firebase / App Check / Maps configuration is incomplete. ' +
      'A setup screen will be rendered in place of the app until the items below ' +
      'are resolved. App Check enforcement failures and auth/api-error are the ' +
      'symptoms this check is designed to prevent.',
    {
      production: env.production,
      emulators: env.emulators,
      hasAuth: result.hasAuth,
      hasAppCheck: result.hasAppCheck,
      hasMaps: result.hasMaps,
      problems: result.problems,
      howToFix:
        '1) cp .env.example .env  2) paste real values from Firebase + GCP console  3) npm run build (re-runs scripts/setup-env.mjs)',
    },
  );
  return result;
}
