// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { computed, inject, Injectable, signal } from '@angular/core';
import { AiService } from './ai.service';
import { IdentityService } from './identity.service';
import { logger } from '../utils/logger';

export type MatchType = 'sponsor' | 'attendee' | 'session';

export interface MatchResult {
  partnerName: string;
  relevanceScore: number;
  reasoning: string;
  type: MatchType;
}

interface Partner {
  name: string;
  type: MatchType;
  interests: string[];
}

/**
 * Demo partner pool. In production this comes from the `partners` Firestore
 * collection populated by the event organizer. Kept inline here so the
 * project compiles and the demo works before that collection is seeded.
 */
const DEMO_PARTNERS: readonly Partner[] = Object.freeze([
  {
    name: 'Google Cloud Vertex AI',
    type: 'sponsor',
    interests: ['GenAI', 'Infrastructure', 'Cloud'],
  },
  { name: 'Sustainability in Tech Forum', type: 'session', interests: ['Sustainability', 'ESG'] },
  {
    name: 'Sarah Chen (Lead Architect)',
    type: 'attendee',
    interests: ['Angular', 'Spatial Computing'],
  },
  { name: 'AR Wayfinding Workshop', type: 'session', interests: ['XR', 'Accessibility'] },
  { name: 'Firebase Hackathon Booth', type: 'sponsor', interests: ['Firebase', 'Realtime'] },
]);

@Injectable({ providedIn: 'root' })
export class MatchmakingService {
  private identity = inject(IdentityService);
  private ai = inject(AiService);

  private matchesSignal = signal<MatchResult[]>([]);
  readonly matches = this.matchesSignal.asReadonly();

  private processingSignal = signal<boolean>(false);
  readonly isProcessing = this.processingSignal.asReadonly();

  private errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  readonly topMatches = computed(() =>
    [...this.matches()].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3),
  );

  /**
   * Server-batched matchmaking. Reduces network hops from O(partners) to 1
   * and lets the Cloud Function parallelize Gemini calls server-side.
   */
  async generateMatches(): Promise<void> {
    const attendee = this.identity.currentAttendee();
    if (!attendee) return;

    this.processingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const partners = this.scorePartners(attendee.interests ?? []);
      const result = await this.ai.generateBatchMatches({
        userName: attendee.name,
        partners,
      });
      this.matchesSignal.set(result);
    } catch (err) {
      logger.error('matchmaking.generate', err);
      this.errorSignal.set('Could not generate matches right now. Try again shortly.');
    } finally {
      this.processingSignal.set(false);
    }
  }

  /**
   * Pre-rank partners by interest overlap before sending to the LLM. This
   * keeps the per-call token count predictable and prevents the LLM from
   * having to evaluate obviously irrelevant partners.
   */
  private scorePartners(userInterests: readonly string[]): Partner[] {
    const lower = new Set(userInterests.map((i) => i.toLowerCase()));
    return [...DEMO_PARTNERS]
      .map((p) => ({
        ...p,
        overlap: p.interests.filter((i) => lower.has(i.toLowerCase())).length,
      }))
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5)
      .map(({ overlap: _omit, ...p }) => p);
  }
}
