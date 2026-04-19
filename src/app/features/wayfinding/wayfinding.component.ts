// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TitleCasePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';
import { AiService } from '../../core/services/ai.service';
import { logger } from '../../core/utils/logger';
import { WayfindingService, type Zone } from '../../core/services/wayfinding.service';

@Component({
  selector: 'app-wayfinding',
  standalone: true,
  imports: [TitleCasePipe],
  template: `
    <div class="wayfinding-container animate-fade-in">
      <header class="map-header">
        <div class="header-text">
          <h2 class="gradient-text">Event navigation</h2>
          <p class="text-secondary">
            Real-time venue wayfinding powered by Google Maps Platform. Sensory mode uses IoT noise
            telemetry to highlight quieter routes.
          </p>
        </div>

        <div class="map-controls">
          <button
            type="button"
            class="btn sensory-btn"
            [class.active]="sensoryMode()"
            [attr.aria-pressed]="sensoryMode()"
            (click)="toggleSensory()"
          >
            Sensory mode: {{ sensoryMode() ? 'On' : 'Off' }}
          </button>
        </div>
      </header>

      <div class="map-layout">
        <main class="map-viewport glass-card" aria-labelledby="map-heading">
          <h3 id="map-heading" class="visually-hidden">Interactive venue map</h3>

          <div #mapContainer class="interactive-map" role="application" aria-label="Venue map">
            @if (isLoading()) {
              <div class="map-loading" aria-live="polite">
                <div class="spinner" aria-hidden="true"></div>
                <p>Initializing map…</p>
              </div>
            }

            @if (loadError()) {
              <div class="map-error" role="alert">
                <p>Map could not be loaded. {{ loadError() }}</p>
                <p class="text-muted small">
                  Check that <code>googleMapsApiKey</code> and <code>googleMapsMapId</code> are
                  configured for this build.
                </p>
              </div>
            }
          </div>

          @if (!isLoading() && !loadError()) {
            <div class="overlay-top-right">
              <ul class="legend glass animate-fade-in" role="list">
                <li class="legend-item">
                  <span class="dot quiet" aria-hidden="true"></span> Quiet zone
                </li>
                <li class="legend-item">
                  <span class="dot busy" aria-hidden="true"></span> High density
                </li>
              </ul>
            </div>
          }
        </main>

        <aside class="route-panel glass-card" aria-labelledby="dest-heading">
          <h3 id="dest-heading">Target destination</h3>

          <label for="route-search" class="visually-hidden">Search rooms or booths</label>
          <div class="search-box glass">
            <input
              id="route-search"
              type="text"
              placeholder="Search rooms, booths, or exits…"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
            />
          </div>

          <ul class="suggested-routes" role="list">
            @for (zone of filteredZones(); track zone.id) {
              <li>
                <button
                  type="button"
                  class="route-option glass"
                  [class.selected]="selectedRoom() === zone.id"
                  [attr.aria-pressed]="selectedRoom() === zone.id"
                  (click)="focusZone(zone)"
                >
                  <span class="route-meta">
                    <span class="title">{{ zone.id | titlecase }}</span>
                    <span class="est">{{ zone.isQuietZone ? 'Quiet' : 'Standard' }} area</span>
                  </span>
                  @if (sensoryMode() && zone.isQuietZone) {
                    <span class="tag">Recommended</span>
                  }
                </button>
              </li>
            }
            @if (!filteredZones().length) {
              <li class="text-muted">No zones match that search.</li>
            }
          </ul>

          @if (sensoryMode()) {
            <p class="sensory-info">
              Sensitive triggers are hidden. Showing quietest routes and low-density areas.
            </p>
          }

          @if (selectedZoneAdvice()) {
            <section class="ai-advice glass" aria-live="polite">
              <header class="ai-header">
                <span class="ai-title">AI sensory concierge</span>
              </header>
              <p class="advice-text">{{ selectedZoneAdvice() }}</p>
            </section>
          }
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .wayfinding-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .map-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .sensory-btn {
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
        padding: 12px 24px;
      }
      .sensory-btn.active {
        border-color: var(--accent);
        background: rgba(16, 185, 129, 0.1);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
      }
      .sensory-btn:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      .map-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 24px;
      }
      .map-viewport {
        height: 600px;
        padding: 0;
        overflow: hidden;
        display: flex;
        position: relative;
      }
      .interactive-map {
        flex: 1;
        position: relative;
        background: #0a0a0c;
      }

      .map-loading,
      .map-error {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        background: var(--bg-main);
        z-index: 10;
        padding: 24px;
        text-align: center;
      }
      .map-error code {
        color: var(--primary);
      }
      .small {
        font-size: 0.8rem;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--glass-border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .overlay-top-right {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 5;
      }
      .legend {
        padding: 12px;
        font-size: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 8px;
        list-style: none;
        margin: 0;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .dot.quiet {
        background: var(--accent);
      }
      .dot.busy {
        background: var(--danger);
      }

      .route-panel {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .search-box input {
        width: 100%;
        background: transparent;
        border: none;
        padding: 12px;
        color: var(--text-primary);
        outline: none;
      }

      .suggested-routes {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 0;
        margin: 0;
        list-style: none;
      }
      .route-option {
        width: 100%;
        padding: 16px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid transparent;
        transition: all 0.2s;
        background: var(--glass-bg);
        color: inherit;
        text-align: left;
      }
      .route-option:hover {
        border-color: var(--primary);
      }
      .route-option:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .route-option.selected {
        border-color: var(--accent);
        background: rgba(16, 185, 129, 0.05);
      }
      .route-meta {
        display: flex;
        flex-direction: column;
      }
      .route-meta .title {
        font-weight: 500;
        font-size: 0.95rem;
      }
      .route-meta .est {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .tag {
        font-size: 0.7rem;
        background: var(--accent);
        color: white;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-weight: 700;
      }

      .sensory-info {
        margin-top: auto;
        padding-top: 20px;
        border-top: 1px solid var(--glass-border);
        font-size: 0.8rem;
        color: var(--text-secondary);
      }

      .ai-advice {
        padding: 16px;
        margin-top: 16px;
        border: 1px dashed var(--primary);
        background: rgba(99, 102, 241, 0.05);
        border-radius: var(--radius-sm);
      }
      .ai-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .ai-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--primary);
      }
      .advice-text {
        font-size: 0.85rem;
        line-height: 1.4;
        color: var(--text-secondary);
        font-style: italic;
      }

      @media (max-width: 1000px) {
        .map-layout {
          grid-template-columns: 1fr;
        }
        .map-viewport {
          height: 420px;
        }
      }
    `,
  ],
})
export class WayfindingComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private wayfindingService = inject(WayfindingService);
  private aiService = inject(AiService);

  readonly sensoryMode = this.wayfindingService.sensoryModeEnabled;
  readonly zones = this.wayfindingService.zones;
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly selectedRoom = signal<string | null>(null);
  readonly selectedZoneAdvice = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly filteredZones = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.zones();
    return this.zones().filter((z) => z.id.toLowerCase().includes(q));
  });

  private map?: google.maps.Map;
  private markers: google.maps.marker.AdvancedMarkerElement[] = [];

  constructor() {
    effect(() => this.updateMapForSensoryMode(this.sensoryMode()));
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  private async initMap(): Promise<void> {
    if (!environment.googleMapsApiKey || environment.googleMapsApiKey.startsWith('__')) {
      // In tests, we still want to attempt initialization with mock keys
      if ((globalThis as any).IS_ANGULAR_TEST) {
        logger.info('wayfinding.initMap', 'using mock/placeholder key in test environment');
      } else {
        this.isLoading.set(false);
        this.loadError.set('Maps API key is not configured.');
        logger.warn('wayfinding.initMap', 'missing Google Maps API key');
        return;
      }
    }

    setOptions({ key: environment.googleMapsApiKey });

    try {
      const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } = (await importLibrary(
        'marker',
      )) as google.maps.MarkerLibrary;

      this.map = new Map(this.mapContainer.nativeElement, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 16,
        styles: this.getMapStyles(),
        disableDefaultUI: true,
        backgroundColor: '#0a0a0c',
        mapId: environment.googleMapsMapId || 'DEMO_MAP_ID',
      });

      this.addMarkers(AdvancedMarkerElement, PinElement);
      this.isLoading.set(false);
    } catch (err) {
      logger.error('wayfinding.initMap', err);
      this.isLoading.set(false);
      this.loadError.set('Network or configuration error.');
    }
  }

  private addMarkers(
    AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement,
    PinElement: typeof google.maps.marker.PinElement,
  ): void {
    if (!this.map) return;
    this.zones().forEach((zone) => {
      const pin = new PinElement({
        background: zone.isQuietZone ? '#10b981' : '#ef4444',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.2,
      });

      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: zone.center,
        title: zone.id,
        content: pin.element,
      });

      marker.addListener('gmp-click', () => this.focusZone(zone));
      this.markers.push(marker);
    });
  }

  async focusZone(zone: Zone): Promise<void> {
    this.selectedRoom.set(zone.id);
    this.selectedZoneAdvice.set('AI sensory concierge is synthesizing advice…');

    if (this.map) {
      this.map.panTo(zone.center);
      this.map.setZoom(19);
    }

    try {
      const advice = await this.aiService.getSensoryAdvice(zone.id, zone.noiseLevel);
      this.selectedZoneAdvice.set(advice);
    } catch (err) {
      logger.error('wayfinding.focusZone', err);
      this.selectedZoneAdvice.set(
        zone.isQuietZone
          ? `${zone.id} is currently a calm area — a good fit for a focused conversation.`
          : `${zone.id} is busy right now. Consider visiting a quieter zone if you need a break.`,
      );
    }
  }

  toggleSensory(): void {
    this.wayfindingService.toggleSensoryMode();
  }

  private updateMapForSensoryMode(enabled: boolean): void {
    const map = this.map;
    if (!map) return;

    this.markers.forEach((marker, index) => {
      const zone = this.zones()[index];
      if (!zone) return;
      marker.map = enabled && !zone.isQuietZone ? null : map;
    });

    map.setOptions({ styles: this.getMapStyles() });
  }

  private getMapStyles(): google.maps.MapTypeStyle[] {
    const baseStyles: google.maps.MapTypeStyle[] = [
      { elementType: 'geometry', stylers: [{ color: '#121214' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#121214' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'administrative', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi', stylers: [{ visibility: 'on' }, { color: '#27272a' }] },
      { featureType: 'road', stylers: [{ visibility: 'simplified' }, { color: '#1e1e21' }] },
      { featureType: 'water', stylers: [{ color: '#0a0a0c' }] },
    ];

    if (this.sensoryMode()) {
      baseStyles.push({ featureType: 'poi.business', stylers: [{ visibility: 'off' }] });
    }

    return baseStyles;
  }
}
