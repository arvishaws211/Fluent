import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Performance optimization: enabling zoneless or efficient change detection
    provideZonelessChangeDetection(),
    provideRouter(routes)
  ]
};
