import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { mappls } from 'mappls-web-maps';
import type { NearbyProfile } from '../lib/api';

interface RealMapProps {
  /** Resolved by the backend API (`/api/feasibility/reverse-geocode|geocode`, Mappls-primary). Null until GPS/search resolves. */
  lat: number | null;
  lon: number | null;
  radiusM: number;
  /** Live peers from `/api/directory/nearby` (PostGIS). */
  peers: NearbyProfile[];
  locationLabel: string;
}

const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_KEY as string | undefined;

interface MapInstance {
  remove(): void;
  on(event: string, callback: () => void): void;
  setCenter(position: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

// Singleton client + init promise: StrictMode double-mounts must not load the SDK twice.
const mapplsClient = new mappls();
let initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Mappls SDK load timed out')), 15000);
      try {
        mapplsClient.initialize(MAPPLS_KEY, { map: true }, () => {
          clearTimeout(timer);
          resolve();
        });
      } catch (err) {
        clearTimeout(timer);
        reject(err);
      }
    });
  }
  return initPromise;
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
  const mapRef = useRef<MapInstance | null>(null);
  const layersRef = useRef<unknown[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const hasFix = lat != null && lon != null;

  const clearOverlays = () => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.forEach((layer) => {
      try {
        // Official docs use `remove({map, layer})`; the npm typings expose `removeLayer`.
        const client = mapplsClient as unknown as {
          remove?: (options: { map: MapInstance; layer: unknown }) => void;
        };
        if (client.remove) client.remove({ map, layer });
        else mapplsClient.removeLayer({ map, layer });
      } catch {
        /* layer already gone — ignore */
      }
    });
    layersRef.current = [];
  };

  const drawOverlays = (map: MapInstance) => {
    if (lat == null || lon == null) return;
    clearOverlays();
    // Proposed site pin
    layersRef.current.push(
      mapplsClient.Marker({
        map,
        position: { lat, lng: lon },
        popupHtml: `<strong>Proposed site</strong><br/>${escapeHtml(locationLabel)}`,
      }),
    );
    // Survey radius (meters)
    layersRef.current.push(
      mapplsClient.Circle({
        map,
        center: { lat, lng: lon },
        radius: radiusM,
        strokeColor: '#2e5320',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#50643c',
        fillOpacity: 0.15,
      }),
    );
    // Peer enterprises from the live directory
    peers.slice(0, 8).forEach((p) => {
      layersRef.current.push(
        mapplsClient.Marker({
          map,
          position: { lat: p.lat, lng: p.lon },
          popupHtml: `<strong>${escapeHtml(p.name)}</strong><br/>${escapeHtml(p.category)} · ${(p.distance_m / 1000).toFixed(1)} km`,
        }),
      );
    });
  };

  // Initialize when a location becomes available, including after first mount.
  useEffect(() => {
    if (!MAPPLS_KEY || !hasFix) return;
    setStatus('loading');
    let cancelled = false;
    ensureInitialized()
      .then(() => {
        if (cancelled) return;
        if (mapRef.current) {
          try {
            mapRef.current.remove();
          } catch {
            /* ignore */
          }
        }
        const map = mapplsClient.Map({
          id: 'saarthi-map',
          properties: {
            center: [lat, lon],
            zoom: zoomForRadius(radiusM),
            zoomControl: true,
            fullscreenControl: true,
            geolocation: false,
            draggable: true,
            // Keep page scroll usable: zoom via controls / double-click, not wheel.
            scrollWheel: false,
          },
        });
        mapRef.current = map;
        map.on('load', () => {
          if (cancelled) return;
          setStatus('ready');
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });
    return () => {
      cancelled = true;
      clearOverlays();
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }
    };
  }, [hasFix]);

  // Re-center + redraw when the backend-resolved location, radius, or peers change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || !hasFix) return;
    try {
      map.setCenter({ lat, lng: lon });
      map.setZoom(zoomForRadius(radiusM));
    } catch {
      /* map not fully ready — overlays redraw on load */
    }
    drawOverlays(map);
  }, [lat, lon, radiusM, peers, locationLabel, status]);

  if (!MAPPLS_KEY) {
    return (
      <MapNotice
        title="Map preview unavailable"
        body="You can still select your location using the search field above."
      />
    );
  }
  if (!hasFix) {
    return (
      <MapNotice
        title="Awaiting location fix"
        body='Leave the search blank and hit Locate for device GPS, or search your location above — the map centers on the backend-resolved coordinates.'
      />
    );
  }

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-outline-variant/40">
      <div id="saarthi-map" className="w-full h-full" />
      {status === 'loading' && (
        <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-[1px] flex items-center justify-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">Loading live Mappls map…</p>
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
