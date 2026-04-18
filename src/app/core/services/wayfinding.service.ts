// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { Injectable, computed, signal } from '@angular/core';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SensoryZone {
  id: string;
  center: LatLng;
  radius: number;
  noiseLevel: number;
  crowdDensity: number;
  isQuietZone: boolean;
}

/** Backwards-compatible alias used by feature components. */
export type Zone = SensoryZone;

@Injectable({ providedIn: 'root' })
export class WayfindingService {
  readonly sensoryModeEnabled = signal<boolean>(false);

  private zonesSignal = signal<SensoryZone[]>([]);
  readonly zones = this.zonesSignal.asReadonly();

  readonly quietRouteZones = computed(() => {
    const isEnabled = this.sensoryModeEnabled();
    const allZones = this.zonesSignal();
    return isEnabled ? allZones.filter((z) => z.isQuietZone || z.noiseLevel < 30) : allZones;
  });

  constructor() {
    this.loadMockSensoryData();
  }

  toggleSensoryMode(): void {
    this.sensoryModeEnabled.update((val) => !val);
  }

  private loadMockSensoryData(): void {
    const mockZones: SensoryZone[] = [
      { id: 'main_stadium',       center: { lat: 37.7749, lng: -122.4194 }, radius: 150, noiseLevel: 98, crowdDensity: 95, isQuietZone: false },
      { id: 'aquatics_center',    center: { lat: 37.7758, lng: -122.4175 }, radius:  80, noiseLevel: 70, crowdDensity: 60, isQuietZone: false },
      { id: 'athletes_village',   center: { lat: 37.7765, lng: -122.4205 }, radius: 100, noiseLevel: 15, crowdDensity: 20, isQuietZone: true  },
      { id: 'media_pavilion',     center: { lat: 37.7740, lng: -122.4180 }, radius:  60, noiseLevel: 40, crowdDensity: 30, isQuietZone: false },
      { id: 'sensory_retreat',    center: { lat: 37.7770, lng: -122.4190 }, radius:  40, noiseLevel:  5, crowdDensity: 10, isQuietZone: true  },
      { id: 'expo_hall_north',    center: { lat: 37.7735, lng: -122.4210 }, radius: 120, noiseLevel: 85, crowdDensity: 80, isQuietZone: false },
      { id: 'main_medical_hub',   center: { lat: 37.7752, lng: -122.4220 }, radius:  50, noiseLevel: 25, crowdDensity: 15, isQuietZone: true  },
      { id: 'fan_festival_zone',  center: { lat: 37.7725, lng: -122.4195 }, radius: 200, noiseLevel: 92, crowdDensity: 88, isQuietZone: false },
      { id: 'networking_garden',  center: { lat: 37.7760, lng: -122.4155 }, radius:  70, noiseLevel: 20, crowdDensity: 15, isQuietZone: true  },
      { id: 'transport_hub',      center: { lat: 37.7715, lng: -122.4185 }, radius: 100, noiseLevel: 75, crowdDensity: 90, isQuietZone: false },
    ];
    this.zonesSignal.set(mockZones);
  }

  async getOptimizedRoute(start: LatLng, end: LatLng): Promise<LatLng[]> {
    return [start, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, end];
  }
}
