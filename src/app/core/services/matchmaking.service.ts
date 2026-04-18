import { Injectable, inject, signal } from '@angular/core';
import { IdentityService } from './identity.service';
import { AiService } from './ai.service';

export interface MatchResult {
  partnerName: string;
  relevanceScore: number;
  reasoning: string;
  type: 'sponsor' | 'attendee' | 'session';
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  private identityService = inject(IdentityService);
  private aiService = inject(AiService);
  
  private matchesSignal = signal<MatchResult[]>([]);
  readonly matches = this.matchesSignal.asReadonly();
  
  private isProcessingSignal = signal<boolean>(false);
  readonly isProcessing = this.isProcessingSignal.asReadonly();

  async generateMatches() {
    const attendee = this.identityService.currentAttendee();
    if (!attendee) return;

    this.isProcessingSignal.set(true);

    try {
      const partners = [
        { name: 'Google Cloud Vertex AI', type: 'sponsor' as const, interests: ['GenAI', 'Infrastructure'] },
        { name: 'Sustainability in Tech Forum', type: 'session' as const, interests: ['Sustainability', 'ESG'] },
        { name: 'Sarah Chen (Lead Architect)', type: 'attendee' as const, interests: ['Angular', 'Spatial Computing'] }
      ];

      const matches: MatchResult[] = await Promise.all(partners.map(async p => ({
        partnerName: p.name,
        relevanceScore: 0.8 + Math.random() * 0.2,
        type: p.type,
        reasoning: await this.aiService.generateMatchReasoning(attendee.name, p.name, p.interests)
      })));

      this.matchesSignal.set(matches);
    } finally {
      this.isProcessingSignal.set(false);
    }
  }
}
