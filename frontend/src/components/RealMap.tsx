import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { NearbyProfile } from '../lib/api';

interface RealMapProps {
  /** Resolved by the backend API (`/api/feasibility/reverse-geocode|geocode`). Null until GPS/search resolves. */
  lat: number | null;
  lon: number | null;
  radiusM: number;
  /** Live peers from `/api/directory/nearby` (PostGIS). */
  peers: NearbyProfile[];
  locationLabel: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function zoomForRadius(radiusM: number): number {
  if (radiusM <= 1500) return 14;
  if (radiusM <= 3500) return 13;
  if (radiusM <= 7000) return 12;
  return 11;
}

function MapNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative w-full h-[320px] rounded-xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden flex flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center">
        <MapPin size={22} className="text-primary" />
      </span>
      <p className="font-label-ui text-label-ui font-bold text-primary">{title}</p>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[320px]">{body}</p>
    </div>
  );
}

export default function RealMap({ lat, lon, radiusM, peers, locationLabel }: RealMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlaysRef = useRef<L.LayerGroup | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const hasFix = lat != null && lon != null;

  // Keyless render: OSM tiles centered on the backend-resolved fix.
  // Geocoding stays server-side (backend MAPPLS_REST_KEY); no map key here.
  useEffect(() => {
    if (lat == null || lon == null) return;
    const el = containerRef.current;
    if (!el) return;
    setStatus('loading');
    try {
      let map = mapRef.current;
      if (!map || map.getContainer() !== el) {
        try {
          map?.remove();
        } catch {
          /* previous map already gone — ignore */
        }
        map = L.map(el, { scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);
        overlaysRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
      }
      map.setView([lat, lon], zoomForRadius(radiusM));
      const overlays = overlaysRef.current;
      if (overlays) {
        overlays.clearLayers();
        // Proposed site pin
        L.circleMarker([lat, lon], {
          radius: 9,
          color: '#2e5320',
          weight: 2,
          fillColor: '#2e5320',
          fillOpacity: 0.9,
        })
          .bindPopup('<strong>Proposed site</strong><br/>' + escapeHtml(locationLabel))
          .addTo(overlays);
        // Survey radius (meters)
        L.circle([lat, lon], {
          radius: radiusM,
          color: '#2e5320',
          weight: 2,
          opacity: 0.9,
          fillColor: '#50643c',
          fillOpacity: 0.15,
        }).addTo(overlays);
        // Peer enterprises from the live directory
        peers.slice(0, 8).forEach((p) => {
          L.circleMarker([p.lat, p.lon], {
            radius: 6,
            color: '#ffffff',
            weight: 2,
            fillColor: '#b7791f',
            fillOpacity: 0.95,
          })
            .bindPopup(
              '<strong>' + escapeHtml(p.name) + '</strong><br/>' + escapeHtml(p.category) + ' · ' + (p.distance_m / 1000).toFixed(1) + ' km',
            )
            .addTo(overlays);
        });
      }
      try {
        map.invalidateSize();
      } catch {
        /* size already valid — ignore */
      }
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [lat, lon, radiusM, peers, locationLabel]);

  useEffect(() => {
    return () => {
      try {
        mapRef.current?.remove();
      } catch {
        /* ignore */
      }
      mapRef.current = null;
      overlaysRef.current = null;
    };
  }, []);

  if (!hasFix) {
    return (
      <MapNotice
        title="Awaiting location fix"
        body="Leave the search blank and hit Locate for device GPS, or search your location above — the map centers on the backend-resolved coordinates."
      />
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-outline-variant/40">
      <div ref={containerRef} className="w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-[1px] flex items-center justify-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Loading map…</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 bg-surface-container-lowest flex flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="font-label-ui text-label-ui font-bold text-error">Map failed to load</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-[320px]">
            The map could not connect. Your selected location is kept; try again later.
          </p>
        </div>
      )}
    </div>
  );
}