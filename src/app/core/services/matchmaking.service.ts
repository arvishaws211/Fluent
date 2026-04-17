import { Injectable, signal, computed } from '@angular/core';
import { IdentityService } from './identity.service';

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
  private matchesSignal = signal<MatchResult[]>([]);
  readonly matches = this.matchesSignal.asReadonly();
  
  private isProcessingSignal = signal<boolean>(false);
  readonly isProcessing = this.isProcessingSignal.asReadonly();

  constructor(private identityService: IdentityService) {}

  /**
   * Agentic Matchmaking using Vertex AI patterns.
   * This logic maps user interests to event entities (Sponsors, Sessions).
   */
  async generateMatches() {
    const attendee = this.identityService.currentAttendee();
    if (!attendee) return;

    this.isProcessingSignal.set(true);

    // Simulate Vertex AI Content Synthesis latency
    setTimeout(() => {
      const mockMatches: MatchResult[] = [
        {
          partnerName: 'Google Cloud Vertex AI',
          relevanceScore: 0.98,
          reasoning: 'Based on your interest in Agentic AI, this sponsor provides the infrastructure for your generative workflows.',
          type: 'sponsor'
        },
        {
          partnerName: 'Sustainability in Tech Forum',
          relevanceScore: 0.85,
          reasoning: 'Matches your sustainability interest. Focused on reducing the carbon footprint of data centers.',
          type: 'session'
        },
        {
          partnerName: 'Sarah Chen (Lead Architect)',
          relevanceScore: 0.92,
          reasoning: 'Shared interest in Spatial Computing and modular Angular architectures.',
          type: 'attendee'
        }
      ];

      this.matchesSignal.set(mockMatches);
      this.isProcessingSignal.set(false);
    }, 1500);
  }
}
