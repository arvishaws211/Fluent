// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Fluent Cloud Functions entry point.
 *
 * Why these live server-side rather than calling Gemini from the browser:
 *   1. The Vertex AI service-account credential never leaves Google's network.
 *   2. We can enforce App Check + Auth + per-uid rate limits centrally.
 *   3. We can cache responses in Firestore to keep costs predictable.
 *
 * Functions are 2nd-gen callable HTTPS functions. Auth context is verified by
 * the Functions runtime; App Check enforcement is opt-in via `enforceAppCheck`.
 */

export {
  aiMatchReasoning,
  aiSensoryAdvice,
  aiBatchMatchmaking,
} from './ai-proxy';

export { onAttendeeCreate, setRoleClaim } from './attendee-lifecycle';
