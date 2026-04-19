// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { TestBed } from '@angular/core/testing';
import { WayfindingService } from './wayfinding.service';

describe('WayfindingService', () => {
  let service: WayfindingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WayfindingService]
    });
    service = TestBed.inject(WayfindingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with mock sensory data', () => {
    const zones = service.zones();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0]).toHaveProperty('noiseLevel');
  });

  it('should toggle sensory mode', () => {
    expect(service.sensoryModeEnabled()).toBeFalsy();
    service.toggleSensoryMode();
    expect(service.sensoryModeEnabled()).toBeTruthy();
    service.toggleSensoryMode();
    expect(service.sensoryModeEnabled()).toBeFalsy();
  });

  it('should filter quiet routes when sensory mode is enabled', () => {
    // Standard mode: should show all zones
    service.sensoryModeEnabled.set(false);
    const initialZones = service.quietRouteZones();
    
    // Sensory mode: should only show quiet zones
    service.sensoryModeEnabled.set(true);
    const quietZones = service.quietRouteZones();
    
    expect(quietZones.length).toBeLessThanOrEqual(initialZones.length);
    quietZones.forEach(zone => {
      expect(zone.isQuietZone || zone.noiseLevel < 30).toBeTruthy();
    });
  });

  it('should generate a route mock', async () => {
    const start = { lat: 0, lng: 0 };
    const end = { lat: 10, lng: 10 };
    const route = await service.getOptimizedRoute(start, end);
    
    expect(route.length).toBe(3);
    expect(route[0]).toEqual(start);
    expect(route[2]).toEqual(end);
  });
});
