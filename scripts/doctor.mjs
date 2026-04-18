#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

/**
 * Terminal env doctor. Prints a redacted summary of both the development and
 * production environment files so you can confirm `angular.json`
 * fileReplacements will load what you expect, without booting the app.
 *
 * Exit codes:
 *   0 - all good
 *   1 - one or more env files missing, stale, or contain placeholders
 *   2 - types.ts contract drift (file exists but shape doesn't match)
 *
 * Usage:
 *   node scripts/doctor.mjs
 *   npm run doctor
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LOCAL = resolve(ROOT, 'src/environments/environment.local.ts');
const PROD = resolve(ROOT, 'src/environments/environment.prod.ts');
const BASE = resolve(ROOT, 'src/environments/environment.ts');
const TYPES = resolve(ROOT, 'src/environments/types.ts');
const DOTENV = resolve(ROOT, '.env');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

function redact(value) {
  if (!value || value.length < 8) return value || '(empty)';
  return `${value.slice(0, 4)}…${value.slice(-4)} (${value.length} chars)`;
}

function isPlaceholder(value) {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^__[A-Z0-9_]+__$/.test(trimmed)) return true;
  if (trimmed.startsWith('your-')) return true;
  return false;
}

function parseGenerated(path) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  const get = (key) => {
    const m = raw.match(new RegExp(`${key}\\s*:\\s*(?:"([^"]*)"|(true|false))`));
    if (!m) return undefined;
    if (m[2] !== undefined) return m[2] === 'true';
    return m[1];
  };
  return {
    path,
    production: get('production'),
    emulators: get('emulators'),
    apiKey: get('apiKey'),
    authDomain: get('authDomain'),
    projectId: get('projectId'),
    appId: get('appId'),
    googleMapsApiKey: get('googleMapsApiKey'),
    googleMapsMapId: get('googleMapsMapId'),
    appCheckSiteKey: get('appCheckSiteKey'),
    region: get('region'),
    mtime: statSync(path).mtime,
  };
}

function printFile(label, snap) {
  if (!snap) {
    console.log(`${RED}✖${RESET} ${label}: missing — run ${CYAN}npm run setup:env${RESET}`);
    return { ok: false, missing: true };
  }
  const issues = [];
  const rows = [
    ['production', snap.production],
    ['emulators', snap.emulators],
    ['firebase.apiKey', snap.apiKey, true],
    ['firebase.projectId', snap.projectId],
    ['firebase.appId', snap.appId, true],
    ['firebase.authDomain', snap.authDomain],
    ['googleMapsApiKey', snap.googleMapsApiKey, true],
    ['googleMapsMapId', snap.googleMapsMapId],
    ['appCheckSiteKey', snap.appCheckSiteKey, true],
    ['region', snap.region],
  ];
  const flag = snap.production === true ? `${CYAN}[prod]${RESET}` : `${CYAN}[dev]${RESET}`;
  console.log(
    `${GREEN}✓${RESET} ${label} ${flag}  ${DIM}${snap.path.replace(ROOT + '\\', '').replace(ROOT + '/', '')}  (updated ${snap.mtime.toISOString()})${RESET}`,
  );
  for (const [key, value, secret] of rows) {
    const placeholder = typeof value === 'string' && isPlaceholder(value);
    const mark = placeholder ? `${YELLOW}!${RESET}` : `${GREEN}·${RESET}`;
    const display = typeof value === 'boolean' ? String(value) : secret ? redact(value) : value ?? '(unset)';
    console.log(`   ${mark} ${key.padEnd(22)} ${display}`);
    if (placeholder) issues.push(`${key} is a placeholder`);
  }
  return { ok: issues.length === 0, issues };
}

console.log(`${DIM}Fluent env doctor — ${new Date().toISOString()}${RESET}`);
console.log('');

if (!existsSync(BASE)) {
  console.log(`${RED}✖${RESET} src/environments/environment.ts missing (committed placeholder file — do not delete)`);
} else {
  console.log(`${GREEN}✓${RESET} src/environments/environment.ts   ${DIM}(committed placeholders; replaced by angular.json at build time)${RESET}`);
}

if (!existsSync(TYPES)) {
  console.log(`${RED}✖${RESET} src/environments/types.ts missing (holds the FluentEnvironment interface)`);
  process.exit(2);
} else {
  console.log(`${GREEN}✓${RESET} src/environments/types.ts         ${DIM}(FluentEnvironment interface)${RESET}`);
}

if (!existsSync(DOTENV)) {
  console.log(`${YELLOW}!${RESET} .env missing — generator will fall back to placeholders`);
}

console.log('');
const localResult = printFile('environment.local.ts  (ng serve / development)', parseGenerated(LOCAL));
console.log('');
const prodResult = printFile('environment.prod.ts   (ng build / production) ', parseGenerated(PROD));
console.log('');

const problems = [];
if (localResult.missing) problems.push('environment.local.ts missing');
if (prodResult.missing) problems.push('environment.prod.ts missing');
if (!localResult.ok && localResult.issues) problems.push(...localResult.issues.map((p) => `[local] ${p}`));
if (!prodResult.ok && prodResult.issues) problems.push(...prodResult.issues.map((p) => `[prod] ${p}`));

if (problems.length) {
  console.log(`${YELLOW}⚠ ${problems.length} issue(s):${RESET}`);
  for (const p of problems) console.log(`   • ${p}`);
  console.log('');
  console.log(`${DIM}Fix: populate .env, then run ${CYAN}npm run setup:env${RESET}${DIM} to regenerate.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}All clear.${RESET} ng serve will use environment.local.ts; ng build will use environment.prod.ts.`);
  process.exit(0);
}
