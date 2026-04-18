// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { IdentityService } from '../../core/services/identity.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let identityMock: { currentAttendee: ReturnType<typeof signal> };
  let matchmakingMock: {
    matches: ReturnType<typeof signal>;
    isProcessing: ReturnType<typeof signal>;
    generateMatches: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    identityMock = {
      currentAttendee: signal({
        id: 'u1',
        name: 'Alex',
        interests: ['Angular'],
        role: 'attendee' as const,
        ssiIdentifier: 'did:firebase:u1',
      }),
    };
    matchmakingMock = {
      matches: signal([]),
      isProcessing: signal(false),
      generateMatches: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: IdentityService, useValue: identityMock },
        { provide: MatchmakingService, useValue: matchmakingMock },
      ],
    }).compileComponents();
  });

  it('renders the welcome card with the attendee name', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Alex');
  });

  it('triggers matchmaking on init when matches are empty', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(matchmakingMock.generateMatches).toHaveBeenCalledTimes(1);
  });

  it('does not auto-refresh when matches are already present', async () => {
    matchmakingMock.matches.set([
      { partnerName: 'X', relevanceScore: 0.9, reasoning: 'r', type: 'sponsor' },
    ]);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(matchmakingMock.generateMatches).not.toHaveBeenCalled();
  });

  it('refreshMatches() triggers regeneration', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    matchmakingMock.generateMatches.mockClear();
    fixture.componentInstance.refreshMatches();
    expect(matchmakingMock.generateMatches).toHaveBeenCalled();
  });

  it('shows the loading state when matchmaking is in flight', () => {
    fixture = TestBed.createComponent(DashboardComponent);
    matchmakingMock.isProcessing.set(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.loading-state')).not.toBeNull();
  });
});
