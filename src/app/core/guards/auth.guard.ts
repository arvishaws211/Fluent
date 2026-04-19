// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { IdentityService } from '../services/identity.service';

export const authGuard: CanActivateFn = (route, state) => {
  const identityService = inject(IdentityService);
  const router = inject(Router);

  // If a user has an identity in the IdentityService, they are authenticated
  if (identityService.currentAttendee()) {
    return true;
  }

  // Otherwise, redirect to login
  return router.parseUrl('/login');
};
