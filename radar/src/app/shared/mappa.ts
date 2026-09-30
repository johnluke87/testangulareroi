import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, output, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Opportunity } from '../core/models';

export interface MapView {
  latitude: number;
  longitude: number;
  radiusKm: number;
}

@Component({
  selector: 'app-mappa',
  template: `<div #host class="map-host"></div>`,
})
export class Mappa implements AfterViewInit, OnDestroy {
  host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  latitude = input.required<number>();
  longitude = input.required<number>();
  originLatitude = input<number | null>(null);
  originLongitude = input<number | null>(null);
  radiusKm = input(25);
  items = input<Opportunity[]>([]);
  locked = input(false);
  recenter = input(0);
  viewChange = output<MapView>();
  private map?: L.Map;
  private layer = L.layerGroup();
  private silent = false;
  private seenTick = -1;
  private wait = 0;

  constructor() {
    effect(() => {
      const tick = this.recenter();
      const lat = this.latitude();
      const lng = this.longitude();
      const km = this.radiusKm();
      if (!this.map || tick === this.seenTick) return;
      this.seenTick = tick;
      this.silent = true;
      this.map.setView([lat, lng], zoomForKm(km));
    });
    effect(() => {
      const items = this.items();
      const lat = this.originLatitude() ?? this.latitude();
      const lng = this.originLongitude() ?? this.longitude();
      const km = this.radiusKm();
      if (!this.map) return;
      this.draw(lat, lng, km, items);
    });
  }

  ngAfterViewInit(): void {
    const el = this.host().nativeElement;
    this.map = L.map(el, { scrollWheelZoom: true });
    this.silent = true;
    this.map.setView([this.latitude(), this.longitude()], zoomForKm(this.radiusKm()));
    this.seenTick = this.recenter();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(this.map);
    this.layer.addTo(this.map);
    this.draw(this.originLatitude() ?? this.latitude(), this.originLongitude() ?? this.longitude(), this.radiusKm(), this.items());
    this.map.on('moveend', () => this.emitView());
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private emitView(): void {
    if (!this.map || this.locked()) return;
    if (this.silent) {
      this.silent = false;
      return;
    }
    window.clearTimeout(this.wait);
    this.wait = window.setTimeout(() => {
      if (!this.map || this.locked()) return;
      const center = this.map.getCenter();
      const corner = this.map.getBounds().getNorthEast();
      const km = Math.min(50, Math.max(3, Math.round(center.distanceTo(corner) / 1000)));
      this.viewChange.emit({ latitude: center.lat, longitude: center.lng, radiusKm: km });
    }, 700);
  }

  private draw(lat: number, lng: number, km: number, items: Opportunity[]): void {
    this.layer.clearLayers();
    this.layer.addLayer(L.circle([lat, lng], {
      radius: km * 1000,
      color: '#111827',
      weight: 1.5,
      fillColor: '#111827',
      fillOpacity: 0.05,
    }));
    this.layer.addLayer(L.circleMarker([lat, lng], {
      radius: 8,
      color: '#111827',
      weight: 2,
      fillColor: '#f59e0b',
      fillOpacity: 1,
    }).bindTooltip('Partenza'));
    items.forEach((item) => {
      const marker = L.circleMarker([item.latitude, item.longitude], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: '#3730a3',
        fillOpacity: 1,
      });
      marker.bindTooltip(`${item.emoji} ${item.title}`);
      marker.bindPopup(`<strong>${item.title}</strong><br>${item.minutes} min in auto · ${item.price_label}<br><a href="/luogo/${item.id}">Apri</a>`);
      this.layer.addLayer(marker);
    });
  }
}

function zoomForKm(km: number): number {
  if (km <= 5) return 13;
  if (km <= 12) return 12;
  if (km <= 22) return 11;
  if (km <= 35) return 10;
  return 9;
}
