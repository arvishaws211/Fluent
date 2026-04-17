import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WayfindingService } from '../../core/services/wayfinding.service';

@Component({
  selector: 'app-wayfinding',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wayfinding-container animate-fade-in">
      <header class="map-header">
        <div class="header-text">
          <h2 class="gradient-text">Indoor Digital Twin</h2>
          <p class="text-secondary">Real-time venue navigation and crowd safety heatmaps.</p>
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
          <!-- Mock Map Container -->
          <div class="interactive-map glass" [class.sensory-glow]="sensoryMode()">
            <svg viewBox="0 0 800 500" class="venue-svg">
              <!-- Venue Background -->
              <rect x="50" y="50" width="700" height="400" rx="20" fill="rgba(255,255,255,0.02)" stroke="var(--glass-border)"/>
              
              <!-- Map Legend/Heatmap Zones -->
              <g *ngFor="let zone of zones()">
                <circle 
                  [attr.cx]="mapPos(zone.center).x" 
                  [attr.cy]="mapPos(zone.center).y" 
                  [attr.r]="zone.radius" 
                  [attr.class]="'zone-circle ' + (zone.isQuietZone ? 'quiet' : 'busy')"
                  [style.opacity]="sensoryMode() ? (zone.isQuietZone ? 0.3 : 0.05) : 0.15"
                />
                <text 
                  [attr.x]="mapPos(zone.center).x" 
                  [attr.y]="mapPos(zone.center).y" 
                  class="zone-label"
                  *ngIf="!sensoryMode() || zone.isQuietZone"
                >
                  {{ zone.id | titlecase }}
                </text>
              </g>

              <!-- Current User Pin -->
              <g class="user-pin">
                <circle cx="200" cy="300" r="8" fill="var(--primary)" class="pulse-pin"/>
                <text x="215" y="305" class="pin-label">You</text>
              </g>

              <!-- Optimized Route Path -->
              <path 
                *ngIf="sensoryMode()"
                d="M 200 300 Q 400 320 400 150" 
                fill="none" 
                stroke="var(--accent)" 
                stroke-width="3" 
                stroke-dasharray="10,5"
                class="route-path"
              />
            </svg>

            <!-- Map UI Overlays -->
            <div class="overlay-top-right">
              <div class="legend glass">
                <div class="legend-item"><span class="dot quiet"></span> Quiet Zone</div>
                <div class="legend-item"><span class="dot busy"></span> High Density</div>
              </div>
            </div>
          </div>
        </main>

        <aside class="route-panel glass-card">
          <h3>Target Destination</h3>
          <div class="search-box glass">
            <input type="text" placeholder="Search rooms, booths, or exits..." />
          </div>

          <div class="suggested-routes">
            <div class="route-option glass" [class.selected]="sensoryMode()">
              <div class="route-meta">
                <span class="title">Main Stage (East Entrance)</span>
                <span class="est">4 min walk</span>
              </div>
              <span class="tag" *ngIf="sensoryMode()">Quiet Route</span>
            </div>
            
            <div class="route-option glass">
              <div class="route-meta">
                <span class="title">Networking Lounge</span>
                <span class="est">2 min walk</span>
              </div>
            </div>
          </div>

          <div class="sensory-info" *ngIf="sensoryMode()">
            <p class="text-secondary small">
              <span class="icon">ℹ️</span> 
              Sensory Mode is active. Routes are optimized to avoid the Expo Hall (Loud) and Lounge A (Crowded).
            </p>
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

    .venue-svg {
      width: 100%;
      height: 100%;
    }

    .zone-circle {
      transition: all 0.5s ease;
    }

    .zone-circle.quiet { fill: var(--accent); }
    .zone-circle.busy { fill: var(--danger); }

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
  `]
})
export class WayfindingComponent {
  private wayfindingService = inject(WayfindingService);
  sensoryMode = this.wayfindingService.sensoryModeEnabled;
  zones = this.wayfindingService.zones;

  constructor() {}

  toggleSensory() {
    this.wayfindingService.toggleSensoryMode();
  }

  // Helper to map lat/lng to SVG space (simplified for mock)
  mapPos(pos: {lat: number, lng: number}) {
    // Basic linear mapping for the SVG 800x500 space
    const x = 400 + (pos.lng + 122.4194) * 5000;
    const y = 250 - (pos.lat - 37.7749) * 5000;
    return { x, y };
  }
}
