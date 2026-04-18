import { Component, inject, signal, computed, OnInit, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayfindingService } from '../../core/services/wayfinding.service';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';
import { AiService } from '../../core/services/ai.service';

declare var google: any;

@Component({
  selector: 'app-wayfinding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wayfinding-container animate-fade-in">
      <header class="map-header">
        <div class="header-text">
          <h2 class="gradient-text">Event Navigation</h2>
          <p class="text-secondary">Real-time venue wayfinding powered by Google Maps.</p>
        </div>
        
        <div class="map-controls">
          <button 
            class="btn sensory-btn" 
            [class.active]="sensoryMode()" 
            (click)="toggleSensory()"
            aria-label="Toggle Sensory Mode for quiet routes"
          >
            <span class="icon">🧘</span>
            Sensory Mode: {{ sensoryMode() ? 'ON' : 'OFF' }}
          </button>
        </div>
      </header>

      <div class="map-layout">
        <main class="map-viewport glass-card">
          <div #mapContainer class="interactive-map">
             <div class="map-loading" *ngIf="isLoading()">
                <div class="spinner"></div>
                <p>Initializing Map...</p>
             </div>
          </div>

          <!-- Floated Overlays -->
          <div class="overlay-top-right">
            <div class="legend glass animate-fade-in" *ngIf="!isLoading()">
              <div class="legend-item"><span class="dot quiet"></span> Quiet Zone</div>
              <div class="legend-item"><span class="dot busy"></span> High Density</div>
            </div>
          </div>
        </main>

        <aside class="route-panel glass-card">
          <h3>Target Destination</h3>
          <div class="search-box glass">
            <input #searchInput type="text" placeholder="Search rooms, booths, or exits..." />
          </div>

          <div class="suggested-routes">
            <div 
              *ngFor="let zone of zones()" 
              class="route-option glass" 
              [class.selected]="selectedRoom() === zone.id"
              (click)="focusZone(zone)"
            >
              <div class="route-meta">
                <span class="title">{{ zone.id | titlecase }}</span>
                <span class="est">{{ zone.isQuietZone ? 'Quiet' : 'Standard' }} Area</span>
              </div>
              <span class="tag" *ngIf="sensoryMode() && zone.isQuietZone">Recommended</span>
            </div>
          </div>

          <div class="sensory-info" *ngIf="sensoryMode()">
            <p class="text-secondary small">
              <span class="icon">ℹ️</span> 
              Sensitive triggers are hidden. Showing quietest routes and low-density areas.
            </p>
          </div>

          <!-- AI Sensory Concierge -->
          <div class="ai-advice glass mt-4" *ngIf="selectedZoneAdvice()">
            <div class="ai-header">
                <span class="ai-icon">✨</span>
                <span class="ai-title">AI Assistant</span>
            </div>
            <p class="advice-text">{{ selectedZoneAdvice() }}</p>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .wayfinding-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sensory-btn {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      padding: 12px 24px;
      transition: all 0.3s;
    }

    .sensory-btn .icon { font-size: 1.2rem; }

    .sensory-btn.active {
      border-color: var(--accent);
      background: rgba(16, 185, 129, 0.1);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
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
    }

    .interactive-map {
      flex: 1;
      position: relative;
      background: #0a0a0c;
    }

    .map-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: var(--bg-main);
      z-index: 10;
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
      to { transform: rotate(360deg); }
    }

    .zone-label {
      fill: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;
    }

    .user-pin text {
      fill: var(--text-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .pulse-pin {
      animation: pulse-pin 2s infinite;
    }

    @keyframes pulse-pin {
      0% { r: 6; opacity: 1; }
      50% { r: 12; opacity: 0.5; }
      100% { r: 6; opacity: 1; }
    }

    .route-path {
      stroke-dasharray: 10;
      animation: dash 20s linear infinite;
    }

    @keyframes dash {
      to { stroke-dashoffset: -1000; }
    }

    .overlay-top-right {
      position: absolute;
      top: 20px;
      right: 20px;
    }

    .legend {
      padding: 12px;
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .legend-item { display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.quiet { background: var(--accent); }
    .dot.busy { background: var(--danger); }

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
    }

    .route-option {
      padding: 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .route-option:hover { border-color: var(--primary); }
    .route-option.selected { border-color: var(--accent); background: rgba(16, 185, 129, 0.05); }

    .route-meta { display: flex; flex-direction: column; }
    .route-meta .title { font-weight: 500; font-size: 0.95rem; }
    .route-meta .est { font-size: 0.8rem; color: var(--text-muted); }

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
    }

    .small { font-size: 0.8rem; }

    @media (max-width: 1000px) {
      .map-layout { grid-template-columns: 1fr; }
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
    .ai-icon { font-size: 1.2rem; }
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
    .mt-4 { margin-top: 1rem; }
  `]
})
export class WayfindingComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  
  private wayfindingService = inject(WayfindingService);
  private aiService = inject(AiService);
  
  sensoryMode = this.wayfindingService.sensoryModeEnabled;
  zones = this.wayfindingService.zones;
  isLoading = signal(true);
  selectedRoom = signal<string | null>(null);
  selectedZoneAdvice = signal<string | null>(null);

  private map?: any;
  private markers: any[] = [];
  private heatmap?: any;

  constructor() {
    // Re-draw map elements when sensory mode changes
    effect(() => {
      this.updateMapForSensoryMode(this.sensoryMode());
    });
  }

  async ngAfterViewInit() {
    await this.initMap();
  }

  private async initMap() {
    setOptions({
      key: environment.googleMapsApiKey,
    });

    try {
      const { Map } = await importLibrary('maps') as any;
      const { AdvancedMarkerElement, PinElement } = await importLibrary('marker') as any;
      
      this.map = new Map(this.mapContainer.nativeElement, {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 16,
        styles: this.getMapStyles(),
        disableDefaultUI: true,
        backgroundColor: '#0a0a0c',
        mapId: 'DEMO_MAP_ID' // Required for Advanced Markers
      });

      this.addMarkers(AdvancedMarkerElement, PinElement);
      this.isLoading.set(false);
    } catch (err) {
      console.error('Google Maps Load Error:', err);
      this.isLoading.set(false);
    }
  }

  private addMarkers(AdvancedMarkerElement: any, PinElement: any) {
    this.zones().forEach(zone => {
      const pin = new PinElement({
        background: zone.isQuietZone ? '#10b981' : '#ef4444',
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
        scale: 1.2
      });

      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: zone.center,
        title: zone.id,
        content: pin
      });
      
      marker.addListener('gmp-click', () => this.focusZone(zone));
      this.markers.push(marker);
    });
  }

  async focusZone(zone: any) {
    this.selectedRoom.set(zone.id);
    this.selectedZoneAdvice.set('AI agent is synthesizing sensory data...');
    
    const map = this.map;
    if (map) {
      map.panTo(zone.center);
      map.setZoom(19);
    }

    const advice = await this.aiService.getSensoryAdvice(zone.id, zone.noiseLevel);
    this.selectedZoneAdvice.set(advice);
  }

  toggleSensory() {
    this.wayfindingService.toggleSensoryMode();
  }

  private updateMapForSensoryMode(enabled: boolean) {
    const map = this.map;
    if (!map) return;

    this.markers.forEach((marker, index) => {
      const zone = this.zones()[index];
      if (enabled && !zone.isQuietZone) {
        marker.setMap(null);
      } else {
        marker.setMap(map);
      }
    });

    map.setOptions({ styles: this.getMapStyles() });
  }

  private getMapStyles(): any[] {
    const baseStyles: any[] = [
      { elementType: 'geometry', stylers: [{ color: '#121214' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#121214' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'administrative', stylers: [{ visibility: 'off' }] },
      { featureType: 'poi', stylers: [{ visibility: 'on' }, { color: '#27272a' }] },
      { featureType: 'road', stylers: [{ visibility: 'simplified' }, { color: '#1e1e21' }] },
      { featureType: 'water', stylers: [{ color: '#0a0a0c' }] }
    ];

    if (this.sensoryMode()) {
       baseStyles.push({ featureType: 'poi.business', stylers: [{ visibility: 'off' }] });
    }

    return baseStyles;
  }
}
