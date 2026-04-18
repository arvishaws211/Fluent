import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WayfindingComponent } from './wayfinding.component';
import { WayfindingService } from '../../core/services/wayfinding.service';
import { AiService } from '../../core/services/ai.service';

const mockMap = {
  setOptions: vi.fn(),
  panTo: vi.fn(),
  setZoom: vi.fn(),
};

const mockMarker: { addListener: ReturnType<typeof vi.fn>; map: unknown } = {
  addListener: vi.fn(),
  map: null,
};

const mockGoogle = {
  maps: {
    Map: vi.fn().mockImplementation(function() {
      return mockMap;
    }),
    marker: {
      AdvancedMarkerElement: vi.fn().mockImplementation(function() {
        return mockMarker;
      }),
      PinElement: vi.fn().mockImplementation(function() {
        return { element: {} };
      }),
    },
  },
};

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn((name: string) => {
    if (name === 'maps') return Promise.resolve({ Map: mockGoogle.maps.Map });
    if (name === 'marker') {
      return Promise.resolve({
        AdvancedMarkerElement: mockGoogle.maps.marker.AdvancedMarkerElement,
        PinElement: mockGoogle.maps.marker.PinElement,
      });
    }
    return Promise.resolve({});
  }),
}));


import { environment } from '../../../environments/environment';

describe('WayfindingComponent', () => {
  let component: WayfindingComponent;
  let fixture: ComponentFixture<WayfindingComponent>;
  let wayfindingMock: {
    sensoryModeEnabled: ReturnType<typeof signal<boolean>>;
    zones: ReturnType<typeof signal<unknown[]>>;
    toggleSensoryMode: ReturnType<typeof vi.fn>;
  };
  let aiMock: { getSensoryAdvice: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Override environment for test
    environment.googleMapsApiKey = 'mock-key';
    
    Object.values(mockMap).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockClear?.());
    mockMarker.addListener.mockClear();
    mockMarker.map = null;
    mockGoogle.maps.Map.mockClear();
    mockGoogle.maps.marker.AdvancedMarkerElement.mockClear();

    wayfindingMock = {
      sensoryModeEnabled: signal(false),
      zones: signal([
        { id: 'zone1', center: { lat: 0, lng: 0 }, isQuietZone: true, noiseLevel: 10 },
        { id: 'zone2', center: { lat: 1, lng: 1 }, isQuietZone: false, noiseLevel: 80 },
      ]),
      toggleSensoryMode: vi.fn(),
    };
    aiMock = { getSensoryAdvice: vi.fn().mockResolvedValue('Quiet area.') };

    await TestBed.configureTestingModule({
      imports: [WayfindingComponent],
      providers: [
        { provide: WayfindingService, useValue: wayfindingMock },
        { provide: AiService, useValue: aiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WayfindingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Wait for the async initMap to finish
    let attempts = 0;
    while (component.isLoading() && attempts < 100) {
      await new Promise(r => setTimeout(r, 10));
      fixture.detectChanges();
      attempts++;
    }
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the Map and marks loading complete', async () => {
    await fixture.whenStable();
    expect(mockGoogle.maps.Map).toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
  });

  it('toggleSensory delegates to the wayfinding service', () => {
    component.toggleSensory();
    expect(wayfindingMock.toggleSensoryMode).toHaveBeenCalled();
  });

  it('adds an advanced marker per zone after the map loads', async () => {
    await fixture.whenStable();
    expect(mockGoogle.maps.marker.AdvancedMarkerElement).toHaveBeenCalledTimes(2);
  });

  it('focusZone pans the map and asks the AI for sensory advice', async () => {
    await fixture.whenStable();
    const zone = { id: 'zone1', center: { lat: 0, lng: 0 }, noiseLevel: 10, radius: 50, crowdDensity: 0.2, isQuietZone: true };
    await component.focusZone(zone);
    await fixture.whenStable();

    expect(component.selectedRoom()).toBe('zone1');
    expect(mockMap.panTo).toHaveBeenCalledWith(zone.center);
    expect(mockMap.setZoom).toHaveBeenCalledWith(19);
    expect(aiMock.getSensoryAdvice).toHaveBeenCalledWith('zone1', 10);
  });

  it('hides non-quiet markers when sensory mode is enabled', async () => {
    await fixture.whenStable();
    wayfindingMock.sensoryModeEnabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    // The non-quiet marker (zone2) should have its map property cleared.
    expect(mockMarker.map).toBeNull();
  });
});
