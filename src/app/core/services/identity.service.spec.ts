import { TestBed } from '@angular/core/testing';
import { IdentityService, AttendeeProfile } from './identity.service';

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IdentityService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null identity if nothing in localStorage', () => {
    expect(service.currentAttendee()).toBeNull();
  });

  it('should set identity and store it in localStorage', () => {
    const mockProfile: AttendeeProfile = {
      id: 'test_123',
      name: 'Test User',
      interests: ['AI'],
      role: 'attendee',
      ssiIdentifier: 'did:fluent:123'
    };
    
    service.setIdentity(mockProfile);
    
    expect(service.currentAttendee()).toEqual(mockProfile);
    expect(localStorage.getItem('fluent_ssi_id')).toBe('did:fluent:123');
  });

  it('should clear identity and remove from localStorage', () => {
    localStorage.setItem('fluent_ssi_id', 'did:fluent:456');
    service.clearIdentity();
    
    expect(service.currentAttendee()).toBeNull();
    expect(localStorage.getItem('fluent_ssi_id')).toBeNull();
  });

  it('should generate a verifiable presentation token', async () => {
    const token = await service.generateVerifiablePresentation('challenge_123');
    expect(token).toContain('vp_token_');
  });
});
