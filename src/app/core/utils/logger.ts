// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Tiny structured logger. Exists so we have ONE place to swap in
 * `@google-cloud/logging-winston` later without touching every callsite.
 *
 * Emits JSON in production so Cloud Logging (and any sidecar like Datadog)
 * can index by severity/component without regex parsing.
 */

import { isDevMode } from '@angular/core';

type Level = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function emit(level: Level, message: string, context?: LogContext | unknown): void {
  if (isDevMode()) {
    const fn = console[level === 'debug' ? 'log' : level] ?? console.log;
    if (context !== undefined) fn(`[${level}] ${message}`, context);
    else fn(`[${level}] ${message}`);
    return;
  }
  const payload = {
    severity: level.toUpperCase(),
    message,
    time: new Date().toISOString(),
    ...(context && typeof context === 'object' ? { context } : { detail: context }),
  };

  console.log(JSON.stringify(payload));
}

export const logger = {
  debug: (m: string, c?: LogContext | unknown) => emit('debug', m, c),
  info: (m: string, c?: LogContext | unknown) => emit('info', m, c),
  warn: (m: string, c?: LogContext | unknown) => emit('warn', m, c),
  error: (m: string, c?: LogContext | unknown) => emit('error', m, c),
};
