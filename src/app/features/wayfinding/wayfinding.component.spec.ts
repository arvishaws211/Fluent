import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { WayfindingComponent } from './wayfinding.component';
import { WayfindingService } from '../../core/services/wayfinding.service';
import { vi } from 'vitest';
import { signal } from '@angular/core';

// Mock Google Maps
const mockMap = {
  setOptions: vi.fn(),
  panTo: vi.fn(),
  setZoom: vi.fn()
};

const mockMarker = {
  addListener: vi.fn(),
  setMap: vi.fn()
};

const mockGoogle = {
  maps: {
    Map: vi.fn(() => mockMap),
    marker: {
      AdvancedMarkerElement: vi.fn(() => mockMarker),
      PinElement: vi.fn(() => ({ element: {} }))
    },
    visualization: { HeatmapLayer: vi.fn() }
  }
};

// Mock the Loader functional API
vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn((name: string) => {
    if (name === 'maps') {
      return Promise.resolve({ Map: mockGoogle.maps.Map });
    }
    if (name === 'marker') {
      return Promise.resolve({ 
        AdvancedMarkerElement: mockGoogle.maps.marker.AdvancedMarkerElement, 
        PinElement: mockGoogle.maps.marker.PinElement 
      });
    }
    return Promise.resolve({});
  })
}));

describe('WayfindingComponent', () => {
  let component: WayfindingComponent;
  let fixture: ComponentFixture<WayfindingComponent>;
  let wayfindingServiceMock: any;

  beforeEach(async () => {
    wayfindingServiceMock = {
      sensoryModeEnabled: signal(false),
      zones: signal([
        { id: 'zone1', center: { lat: 0, lng: 0 }, isQuietZone: true },
        { id: 'zone2', center: { lat: 1, lng: 1 }, isQuietZone: false }
      ]),
      toggleSensoryMode: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [WayfindingComponent],
      providers: [
        { provide: WayfindingService, useValue: wayfindingServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WayfindingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map on init', fakeAsync(() => {
    tick(); // Wait for map loader
    expect(mockGoogle.maps.Map).toHaveBeenCalled();
    expect(component.isLoading()).toBeFalsy();
  }));

  it('should toggle sensory mode', () => {
    component.toggleSensory();
    expect(wayfindingServiceMock.toggleSensoryMode).toHaveBeenCalled();
  });

  it('should add markers for zones', fakeAsync(() => {
    tick();
    expect(mockGoogle.maps.marker.AdvancedMarkerElement).toHaveBeenCalledTimes(2);
  }));

  it('should focus on a zone when requested', () => {
    const zone = { id: 'zone1', center: { lat: 0, lng: 0 } };
    component.focusZone(zone);
    
    expect(component.selectedRoom()).toBe('zone1');
    expect(mockMap.panTo).toHaveBeenCalledWith(zone.center);
    expect(mockMap.setZoom).toHaveBeenCalledWith(19);
  });

  it('should update marker visibility based on sensory mode', fakeAsync(() => {
    tick();
    // Simulate sensory mode ON
    wayfindingServiceMock.sensoryModeEnabled.set(true);
    fixture.detectChanges();
    
    // The effect should trigger updateMapForSensoryMode
    // In sensory mode, only quiet zones (index 0) should be visible
    // We expect the marker for zone2 (index 1) to have setMap(null) called
    expect(mockMarker.setMap).toHaveBeenCalledWith(null);
  }));

  it('should show loading state initially', () => {
    expect(component.isLoading()).toBeTruthy();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.map-loading')).toBeTruthy();
  });
});
