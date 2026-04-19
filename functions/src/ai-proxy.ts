// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * AI proxy callables. The browser calls these via `httpsCallable()`.
 *
 * The Vertex AI client is initialized once per cold-start and reused across
 * warm invocations to amortize the auth handshake.
 */

import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { logger } from 'firebase-functions/v2';
import { VertexAI, type GenerativeModel } from '@google-cloud/vertexai';

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 50,
  concurrency: 80,
  memory: '512MiB',
  timeoutSeconds: 30,
});

const PROJECT_ID = process.env['GCLOUD_PROJECT'] ?? process.env['GCP_PROJECT'] ?? '';
const LOCATION = process.env['VERTEX_LOCATION'] ?? 'us-central1';
const MODEL_NAME = process.env['VERTEX_MODEL'] ?? 'gemini-2.5-flash';

let cachedModel: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (cachedModel) return cachedModel;
  if (!PROJECT_ID) {
    throw new HttpsError(
      'failed-precondition',
      'GCP project not detected; ensure the function is deployed to a real GCP project.',
    );
  }
  const client = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  cachedModel = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { temperature: 0.4, maxOutputTokens: 256 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' as never },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' as never },
    ],
  });
  return cachedModel;
}

function requireAuth(req: CallableRequest<unknown>): string {
  if (!req.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required.');
  }
  return req.auth.uid;
}

async function generate(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return text.trim();
}

// ---- Public callables -----------------------------------------------------

export interface MatchReasoningInput {
  userName: string;
  partnerName: string;
  commonInterests: string[];
}

export const aiMatchReasoning = onCall<MatchReasoningInput, Promise<{ reasoning: string }>>(
  { enforceAppCheck: true },
  async (req) => {
    requireAuth(req);
    const { userName, partnerName, commonInterests } = req.data ?? {};
    if (!userName || !partnerName || !Array.isArray(commonInterests)) {
      throw new HttpsError(
        'invalid-argument',
        'userName, partnerName, commonInterests are required.',
      );
    }
    const prompt = [
      'You are an AI networking agent for the Fluent event platform.',
      `Professional 1: ${userName}`,
      `Professional 2: ${partnerName}`,
      `Common Interests: ${commonInterests.join(', ')}`,
      '',
      'Generate a single compelling sentence (under 100 characters) explaining',
      'why they should connect, focused on technical synergy and project potential.',
    ].join('\n');

    try {
      const reasoning = await generate(prompt);
      return {
        reasoning:
          reasoning ||
          `Connect with ${partnerName} on ${commonInterests[0] ?? 'shared interests'}.`,
      };
    } catch (err) {
      logger.error('aiMatchReasoning failed', err);
      return {
        reasoning: `Connect with ${partnerName} to discuss ${commonInterests[0] ?? 'collaboration'}.`,
      };
    }
  },
);

export interface SensoryAdviceInput {
  location: string;
  noiseLevel: number;
}

export const aiSensoryAdvice = onCall<SensoryAdviceInput, Promise<{ advice: string }>>(
  { enforceAppCheck: true },
  async (req) => {
    requireAuth(req);
    const { location, noiseLevel } = req.data ?? {};
    if (typeof location !== 'string' || typeof noiseLevel !== 'number') {
      throw new HttpsError(
        'invalid-argument',
        'location:string and noiseLevel:number are required.',
      );
    }
    const prompt = [
      `Location: ${location}`,
      `Noise Level: ${noiseLevel}/100`,
      '',
      'Give a single empathetic sentence of advice for someone with sensory',
      'sensitivities about whether to enter or avoid this location.',
    ].join('\n');

    try {
      const advice = await generate(prompt);
      return {
        advice:
          advice ||
          (noiseLevel > 70 ? 'This area is quite lively.' : 'This area is relatively calm.'),
      };
    } catch (err) {
      logger.error('aiSensoryAdvice failed', err);
      return {
        advice:
          noiseLevel > 70
            ? 'This area is quite lively. A quiet retreat may help.'
            : 'This area is relatively calm.',
      };
    }
  },
);

export interface BatchMatchmakingInput {
  userName: string;
  partners: { name: string; interests: string[]; type: 'sponsor' | 'attendee' | 'session' }[];
}

export interface BatchMatchmakingOutput {
  matches: {
    partnerName: string;
    type: 'sponsor' | 'attendee' | 'session';
    relevanceScore: number;
    reasoning: string;
  }[];
}

/**
 * Batches all match reasoning calls into a single function invocation. This
 * keeps cold starts amortized and reduces the number of network round trips
 * the client makes from O(n) to O(1).
 */
export const aiBatchMatchmaking = onCall<BatchMatchmakingInput, Promise<BatchMatchmakingOutput>>(
  { enforceAppCheck: true, timeoutSeconds: 60 },
  async (req) => {
    requireAuth(req);
    const { userName, partners } = req.data ?? {};
    if (typeof userName !== 'string' || !Array.isArray(partners)) {
      throw new HttpsError('invalid-argument', 'userName:string and partners:array are required.');
    }

    const matches = await Promise.all(
      partners.map(async (p) => {
        const prompt = [
          `Professional 1: ${userName}`,
          `Professional 2: ${p.name} (${p.type})`,
          `Common Interests: ${p.interests.join(', ')}`,
          '',
          'Single compelling sentence under 100 chars on why to connect.',
        ].join('\n');
        let reasoning: string;
        try {
          reasoning = await generate(prompt);
        } catch (err) {
          logger.warn('partner generate failed', { partner: p.name, err });
          reasoning = `Connect with ${p.name} to discuss ${p.interests[0] ?? 'collaboration'}.`;
        }
        return {
          partnerName: p.name,
          type: p.type,
          relevanceScore: 0.7 + Math.min(0.3, p.interests.length * 0.05),
          reasoning,
        };
      }),
    );

    return { matches };
  },
);
