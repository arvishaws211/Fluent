// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AiService } from './ai.service';

const callMatchReasoning = vi.fn();
const callSensoryAdvice = vi.fn();
const callBatchMatchmaking = vi.fn();

vi.mock('@angular/fire/functions', () => ({
  Functions: class {},
  httpsCallable: vi.fn((_fns: unknown, name: string) => {
    if (name === 'aiMatchReasoning') return callMatchReasoning;
    if (name === 'aiSensoryAdvice') return callSensoryAdvice;
    if (name === 'aiBatchMatchmaking') return callBatchMatchmaking;
    return vi.fn();
  }),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    callMatchReasoning.mockReset();
    callSensoryAdvice.mockReset();
    callBatchMatchmaking.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AiService,
        { provide: Functions, useValue: {} },
      ],
    });
    service = TestBed.inject(AiService);
  });

  it('returns the Cloud Function reasoning string on success', async () => {
    callMatchReasoning.mockResolvedValue({ data: { reasoning: 'You both love Angular.' } });
    const result = await service.generateMatchReasoning('Alex', 'Sam', ['Angular']);
    expect(result).toBe('You both love Angular.');
    expect(callMatchReasoning).toHaveBeenCalledWith({
      userName: 'Alex',
      partnerName: 'Sam',
      commonInterests: ['Angular'],
    });
  });

  it('falls back gracefully on reasoning failure', async () => {
    callMatchReasoning.mockRejectedValue(new Error('boom'));
    const result = await service.generateMatchReasoning('Alex', 'Sam', ['Angular']);
    expect(result).toMatch(/Sam/);
    expect(result).toMatch(/Angular/);
  });

  it('passes through the batch result', async () => {
    callBatchMatchmaking.mockResolvedValue({
      data: {
        matches: [
          { partnerName: 'X', type: 'sponsor', relevanceScore: 0.9, reasoning: 'r' },
        ],
      },
    });
    const result = await service.generateBatchMatches({
      userName: 'Alex',
      partners: [{ name: 'X', interests: ['AI'], type: 'sponsor' }],
    });
    expect(result.length).toBe(1);
    expect(result[0].partnerName).toBe('X');
  });

  it('falls back to a per-partner stub on batch failure', async () => {
    callBatchMatchmaking.mockRejectedValue(new Error('cold'));
    const result = await service.generateBatchMatches({
      userName: 'Alex',
      partners: [{ name: 'X', interests: ['AI'], type: 'sponsor' }],
    });
    expect(result[0].partnerName).toBe('X');
    expect(result[0].reasoning).toMatch(/AI/);
  });

  it('returns the Cloud Function advice string on success', async () => {
    callSensoryAdvice.mockResolvedValue({ data: { advice: 'It is calm.' } });
    expect(await service.getSensoryAdvice('lobby', 20)).toBe('It is calm.');
  });

  it('returns a noise-aware fallback when the function fails', async () => {
    callSensoryAdvice.mockRejectedValue(new Error('cold'));
    const loud = await service.getSensoryAdvice('main_stage', 90);
    const quiet = await service.getSensoryAdvice('library', 10);
    expect(loud).toMatch(/lively|quiet retreat/i);
    expect(quiet).toMatch(/calm/i);
  });
});
