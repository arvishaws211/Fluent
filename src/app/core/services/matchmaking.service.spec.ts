import { TestBed } from '@angular/core/testing';
import { MatchmakingService } from './matchmaking.service';
import { IdentityService } from './identity.service';
import { signal, WritableSignal } from '@angular/core';

describe('MatchmakingService', () => {
  let service: MatchmakingService;
  let currentAttendeeSignal: WritableSignal<any>;

  beforeEach(() => {
    currentAttendeeSignal = signal({
      id: 'u1',
      name: 'User',
      interests: ['AI'],
      role: 'attendee',
      ssiIdentifier: 'did:123'
    });

    const mockIdentityService = {
      currentAttendee: currentAttendeeSignal
    };

    TestBed.configureTestingModule({
      providers: [
        MatchmakingService,
        { provide: IdentityService, useValue: mockIdentityService }
      ]
    });
    service = TestBed.inject(MatchmakingService);
  });

  it('should generate matches using Vertex AI synthesis logic', async () => {
    service.generateMatches();
    
    expect(service.isProcessing()).toBe(true);
    
    await new Promise(r => setTimeout(r, 1600)); // Simulate AI delay
    
    expect(service.isProcessing()).toBe(false);
    expect(service.matches().length).toBeGreaterThan(0);
    expect(service.matches()[0].partnerName).toBe('Google Cloud Vertex AI');
  });

  it('should not process if attendee is not identified', () => {
    currentAttendeeSignal.set(null);
    service.generateMatches();
    expect(service.isProcessing()).toBe(false);
  });
});
