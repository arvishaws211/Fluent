import { Injectable, signal } from '@angular/core';

export interface AttendeeProfile {
  id: string;
  name: string;
  interests: string[];
  role: 'attendee' | 'speaker' | 'sponsor' | 'staff';
  ssiIdentifier: string; // Decentralized ID
}

@Injectable({
  providedIn: 'root'
})
export class IdentityService {
  /**
   * SSI logic ensures data privacy by keeping the actual PII 
   * in the user's controlled environment, providing only 
   * verifiable credentials to the platform.
   */
  
  private currentAttendeeSignal = signal<AttendeeProfile | null>(null);
  readonly currentAttendee = this.currentAttendeeSignal.asReadonly();

  constructor() {
    // Simulate loading a verifiable credential from local storage or SSI wallet
    this.initializeIdentity();
  }

  private initializeIdentity() {
    const savedId = localStorage.getItem('fluent_ssi_id');
    if (savedId) {
      // In a real app, this would verify the credential with an SSI provider
      this.currentAttendeeSignal.set({
        id: 'user_123',
        name: 'Alex Rivera',
        interests: ['Agentic AI', 'Spatial Computing', 'Sustainability'],
        role: 'attendee',
        ssiIdentifier: savedId
      });
    }
  }

  setIdentity(profile: AttendeeProfile) {
    this.currentAttendeeSignal.set(profile);
    localStorage.setItem('fluent_ssi_id', profile.ssiIdentifier);
  }

  clearIdentity() {
    this.currentAttendeeSignal.set(null);
    localStorage.removeItem('fluent_ssi_id');
  }

  /**
   * Verifiable Presentation (VP) generation wrapper.
   * This logic is central to the "SSI" requirement.
   */
  async generateVerifiablePresentation(challenge: string): Promise<string> {
    console.log(`Generating VP for challenge: ${challenge}`);
    // Mock SSI handshake
    return `vp_token_${Math.random().toString(36).substring(7)}`;
  }
}
