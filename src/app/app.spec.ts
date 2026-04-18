// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AppComponent } from './app';
import { IdentityService } from './core/services/identity.service';
import { AuthService } from './core/services/auth.service';

describe('AppComponent', () => {
  let identityMock: {
    currentAttendee: ReturnType<typeof signal>;
    isStaff: ReturnType<typeof signal>;
  };
  let authMock: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    identityMock = {
      currentAttendee: signal(null),
      isStaff: signal(false),
    };
    authMock = { logout: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: IdentityService, useValue: identityMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('creates the app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the Fluent brand wordmark', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Fluent');
  });

  it('shows sign-in / register CTA when not authenticated', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Sign In');
    expect(html.textContent).toContain('Get Started');
    expect(html.querySelector('.user-badge')).toBeNull();
  });

  it('shows the user badge and staff link when an authenticated staff user is present', () => {
    identityMock.currentAttendee.set({
      id: 'u1',
      name: 'Staffer',
      interests: [],
      role: 'staff',
      ssiIdentifier: 'did:firebase:u1',
    });
    identityMock.isStaff.set(true);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.user-badge')).not.toBeNull();
    expect(html.textContent).toContain('Staffer');
    expect(html.textContent).toContain('Staff Dashboard');
  });

  it('logout delegates to AuthService.logout', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.componentInstance.logout();
    expect(authMock.logout).toHaveBeenCalled();
  });

  it('exposes a skip-to-content link for keyboard users', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const skip = (fixture.nativeElement as HTMLElement).querySelector('.skip-link');
    expect(skip?.getAttribute('href')).toBe('#main-content');
  });
});
