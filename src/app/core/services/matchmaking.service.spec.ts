// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { signal, type WritableSignal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MatchmakingService } from './matchmaking.service';
import { IdentityService } from './identity.service';
import { AiService } from './ai.service';
import type { AttendeeProfile } from './identity.service';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let attendee$: WritableSignal<AttendeeProfile | null>;
  let aiMock: { generateBatchMatches: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    attendee$ = signal<AttendeeProfile | null>({
      id: 'u1',
      name: 'Alex',
      interests: ['Angular', 'GenAI'],
      role: 'attendee',
      ssiIdentifier: 'did:firebase:u1',
    });

    aiMock = {
      generateBatchMatches: vi.fn().mockResolvedValue([
        {
          partnerName: 'Google Cloud Vertex AI',
          type: 'sponsor',
          relevanceScore: 0.95,
          reasoning: 'AI synergy',
        },
        {
          partnerName: 'Sarah Chen (Lead Architect)',
          type: 'attendee',
          relevanceScore: 0.85,
          reasoning: 'Angular shared interest',
        },
      ]),
    };

    TestBed.configureTestingModule({
      providers: [
        MatchmakingService,
        { provide: IdentityService, useValue: { currentAttendee: attendee$ } },
        { provide: AiService, useValue: aiMock },
      ],
    });
    service = TestBed.inject(MatchmakingService);
  });

  it('generates matches via the batch Cloud Function', async () => {
    expect(service.matches().length).toBe(0);
    expect(service.isProcessing()).toBe(false);

    const promise = service.generateMatches();
    expect(service.isProcessing()).toBe(true);
    await promise;

    expect(service.isProcessing()).toBe(false);
    expect(service.error()).toBeNull();
    expect(aiMock.generateBatchMatches).toHaveBeenCalledTimes(1);
    const arg = aiMock.generateBatchMatches.mock.calls[0][0];
    expect(arg.userName).toBe('Alex');
    expect(arg.partners.length).toBeGreaterThan(0);
    expect(service.matches().length).toBe(2);
    expect(service.topMatches()[0].partnerName).toBe('Google Cloud Vertex AI');
  });

  it('skips when no attendee is signed in', async () => {
    attendee$.set(null);
    await service.generateMatches();
    expect(aiMock.generateBatchMatches).not.toHaveBeenCalled();
    expect(service.matches().length).toBe(0);
  });

  it('surfaces a friendly error when the function rejects', async () => {
    aiMock.generateBatchMatches.mockRejectedValueOnce(new Error('boom'));
    await service.generateMatches();
    expect(service.error()).toMatch(/Could not generate matches/i);
    expect(service.isProcessing()).toBe(false);
  });

  it('pre-ranks partners by interest overlap before sending to the LLM', async () => {
    await service.generateMatches();
    const arg = aiMock.generateBatchMatches.mock.calls[0][0];
    const top = arg.partners[0];
    expect(top.interests.some((i: string) => ['Angular', 'GenAI'].includes(i))).toBe(true);
  });
});
