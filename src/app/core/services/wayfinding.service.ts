import { Injectable, signal, computed } from '@angular/core';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SensoryZone {
  id: string;
  center: LatLng;
  radius: number;
  noiseLevel: number; // 0-100
  crowdDensity: number; // 0-100
  isQuietZone: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WayfindingService {
  /**
   * Performance optimization: Signals ensure the UI only re-renders 
   * when the specific sensory or location data changes.
   */
  readonly sensoryModeEnabled = signal<boolean>(false);
  
  private zonesSignal = signal<SensoryZone[]>([]);
  readonly zones = this.zonesSignal.asReadonly();

  // Computed signal to filter only quiet zones when sensory mode is on
  readonly quietRouteZones = computed(() => {
    const isEnabled = this.sensoryModeEnabled();
    const allZones = this.zonesSignal();
    return isEnabled ? allZones.filter(z => z.isQuietZone || z.noiseLevel < 30) : allZones;
  });

  constructor() {
    this.loadMockSensoryData();
  }

  toggleSensoryMode() {
    this.sensoryModeEnabled.update(val => !val);
  }

  private loadMockSensoryData() {
    // In production, this would fetch from a Real-time IoT Digital Twin API
    const mockZones: SensoryZone[] = [
      { id: 'hall_a', center: { lat: 37.7749, lng: -122.4194 }, radius: 50, noiseLevel: 85, crowdDensity: 90, isQuietZone: false },
      { id: 'lounge_b', center: { lat: 37.7755, lng: -122.4185 }, radius: 30, noiseLevel: 20, crowdDensity: 15, isQuietZone: true },
      { id: 'garden_c', center: { lat: 37.7760, lng: -122.4200 }, radius: 40, noiseLevel: 15, crowdDensity: 10, isQuietZone: true },
      { id: 'expo_d', center: { lat: 37.7740, lng: -122.4170 }, radius: 60, noiseLevel: 95, crowdDensity: 80, isQuietZone: false }
    ];
    this.zonesSignal.set(mockZones);
  }

  async getOptimizedRoute(start: LatLng, end: LatLng): Promise<LatLng[]> {
    // Mock routing logic that avoids high-noise areas if sensoryModeEnabled
    console.log(`Calculating ${this.sensoryModeEnabled() ? 'Quiet' : 'Standard'} route...`);
    return [start, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, end];
  }
}
