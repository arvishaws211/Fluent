// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { inject, Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { logger } from '../utils/logger';

interface MatchReasoningResult {
  reasoning: string;
}
interface SensoryAdviceResult {
  advice: string;
}
interface BatchMatchInput {
  userName: string;
  partners: { name: string; interests: string[]; type: 'sponsor' | 'attendee' | 'session' }[];
}
interface BatchMatchResult {
  matches: {
    partnerName: string;
    type: 'sponsor' | 'attendee' | 'session';
    relevanceScore: number;
    reasoning: string;
  }[];
}

/**
 * Thin client for the Vertex-AI-backed Cloud Functions in `functions/`.
 *
 * Why callable functions instead of `@angular/fire/ai`:
 *   1. The Vertex service-account credential never reaches the browser.
 *   2. We can enforce Auth + App Check uniformly across all AI traffic.
 *   3. Per-uid rate limits and Firestore caching live alongside the LLM call.
 *
 * Each method has a deterministic fallback string so the UI never blanks if
 * a Function cold-starts past timeout.
 */
@Injectable({ providedIn: 'root' })
export class AiService {
  private functions = inject(Functions);

  private callMatchReasoning = httpsCallable<
    { userName: string; partnerName: string; commonInterests: string[] },
    MatchReasoningResult
  >(this.functions, 'aiMatchReasoning');

  private callSensoryAdvice = httpsCallable<
    { location: string; noiseLevel: number },
    SensoryAdviceResult
  >(this.functions, 'aiSensoryAdvice');

  private callBatchMatchmaking = httpsCallable<BatchMatchInput, BatchMatchResult>(
    this.functions,
    'aiBatchMatchmaking',
  );

  async generateMatchReasoning(
    userName: string,
    partnerName: string,
    commonInterests: string[],
  ): Promise<string> {
    try {
      const { data } = await this.callMatchReasoning({ userName, partnerName, commonInterests });
      return data.reasoning;
    } catch (err) {
      logger.warn('AiService.generateMatchReasoning fallback', err);
      const seed = commonInterests[0] ?? 'shared interests';
      return `Connect with ${partnerName} to discuss ${seed} and collaboration.`;
    }
  }

  async generateBatchMatches(input: BatchMatchInput): Promise<BatchMatchResult['matches']> {
    try {
      const { data } = await this.callBatchMatchmaking(input);
      return data.matches;
    } catch (err) {
      logger.warn('AiService.generateBatchMatches fallback', err);
      return input.partners.map((p) => ({
        partnerName: p.name,
        type: p.type,
        relevanceScore: 0.7,
        reasoning: `Connect with ${p.name} to discuss ${p.interests[0] ?? 'collaboration'}.`,
      }));
    }
  }

  async getSensoryAdvice(location: string, noiseLevel: number): Promise<string> {
    try {
      const { data } = await this.callSensoryAdvice({ location, noiseLevel });
      return data.advice;
    } catch (err) {
      logger.warn('AiService.getSensoryAdvice fallback', err);
      return noiseLevel > 70
        ? 'This area is quite lively. Consider a quiet retreat if you feel overwhelmed.'
        : 'This area is relatively calm.';
    }
  }
}
