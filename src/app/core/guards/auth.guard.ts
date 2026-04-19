// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { IdentityService } from '../services/identity.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const identityService = inject(IdentityService);
  const router = inject(Router);

  if (identityService.currentAttendee()) {
    return true;
  }

  return router.parseUrl('/login');
};
