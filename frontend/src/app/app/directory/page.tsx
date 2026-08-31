"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NearbyList } from "@/components/directory/NearbyList";
import { nearbyProfiles, type NearbyProfile } from "@/lib/directory/client";

const HILSA_LAT = 25.314;
const HILSA_LON = 85.279;

export default function DirectoryPage() {
  const [latStr, setLatStr] = React.useState<string>(String(HILSA_LAT));
  const [lonStr, setLonStr] = React.useState<string>(String(HILSA_LON));
  const [radiusM, setRadiusM] = React.useState<number>(5000);
  const [category, setCategory] = React.useState<string>("");
  const [results, setResults] = React.useState<NearbyProfile[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const doSearch = React.useCallback(async () => {
    const lat = Number.parseFloat(latStr);
    const lon = Number.parseFloat(lonStr);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError("Enter valid latitude and longitude.");
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError("Latitude −90…90, longitude −180…180.");
      return;
    }
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const data = await nearbyProfiles(lat, lon, radiusM, category || undefined);
      setResults(data);
    } catch {
      setError("Search failed — try again.");
    } finally {
      setLoading(false);
    }
  }, [latStr, lonStr, radiusM, category]);

  // Initial search on mount with Hilsa preset
  React.useEffect(() => {
    void doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useHilsa = () => {
    setLatStr(String(HILSA_LAT));
    setLonStr(String(HILSA_LON));
  };

  const distanceLabel = radiusM >= 1000 ? `${(radiusM / 1000).toFixed(radiusM % 1000 === 0 ? 0 : 1)} km` : `${radiusM} m`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
          Directory · Read-only
        </p>
        <h1 className="font-serif text-2xl font-semibold leading-tight text-[var(--color-ink)] sm:text-3xl">
          Who&apos;s nearby?
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
          Lookup neighbours in your block — distance by{" "}
          <span className="font-mono text-xs text-[var(--color-ink)]">ST_DWithin</span>. Not a marketplace, no
          transactions.
        </p>
        <p className="font-mono text-xs text-[var(--color-muted)]">
          Read-only lookup, not marketplace. Contract:{" "}
          <span className="text-[var(--color-ink)]">
            SELECT * FROM profiles WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(lon,lat),4326)::geography, 10000)
          </span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Search
            </p>
            <Badge variant="ledger">Hilsa: 25.314, 85.279</Badge>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Latitude"
              value={latStr}
              onChange={(e) => setLatStr(e.target.value)}
              inputMode="decimal"
              placeholder="25.314"
              hint="e.g. 25.314"
            />
            <Input
              label="Longitude"
              value={lonStr}
              onChange={(e) => setLonStr(e.target.value)}
              inputMode="decimal"
              placeholder="85.279"
              hint="e.g. 85.279"
            />
          </div>

          <div className="mt-4">
            <Slider
              label="Radius"
              min={1000}
              max={10000}
              step={500}
              value={radiusM}
              displayValue={distanceLabel}
              hint="1 km — 10 km (ST_DWithin distance)"
              onChange={(e) => setRadiusM(Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dir-cat" className="text-sm font-medium text-[var(--color-ink)]">
                Category (optional)
              </label>
              <select
                id="dir-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[44px] w-full rounded-[var(--radius-card)] border border-[var(--color-ledger)] bg-white px-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-vermilion)] focus:outline-none focus:ring-2 focus:ring-[var(--color-vermilion)]/20"
              >
                <option value="">All</option>
                <option value="dairy">Dairy</option>
                <option value="retail">Retail</option>
                <option value="handloom">Handloom</option>
              </select>
              <p className="text-xs text-[var(--color-muted)]">Filters the mock ST_DWithin result set.</p>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={useHilsa} variant="ghost" className="min-h-[44px] flex-1 sm:flex-none">
                Use Hilsa
              </Button>
              <Button onClick={() => void doSearch()} className="min-h-[44px] flex-1 sm:flex-none">
                Search
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-sm text-[var(--color-vermilion)]">
              {error}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Map slip placeholder */}
      <Card className="overflow-hidden">
        <CardBody>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Map — slip placeholder
            </p>
            <div className="flex min-h-[160px] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-ledger)] bg-[var(--color-ledger)]/20 px-4 py-8">
              <div className="text-center">
                <p className="font-mono text-xs text-[var(--color-muted)]">OSM tiles mock — 5 km circle</p>
                <p className="mt-1 font-mono text-xs text-[var(--color-muted)]">
                  Lat {Number.parseFloat(latStr) ? Number.parseFloat(latStr).toFixed(3) : "—"} · Lon{" "}
                  {Number.parseFloat(lonStr) ? Number.parseFloat(lonStr).toFixed(3) : "—"} · {distanceLabel}
                </p>
                <div
                  aria-hidden
                  className="mx-auto mt-3 h-px w-24 bg-[repeating-linear-gradient(90deg,var(--color-ledger)_0_6px,transparent_6px_12px)]"
                />
              </div>
            </div>
            <p className="font-mono text-xs text-[var(--color-muted)]">
              Map is a placeholder slip — directory is read-only; no booking or messaging.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            Nearby profiles {searched && !loading ? `· ${results.length}` : ""}
          </h2>
          {searched && !loading && results.length > 0 && (
            <span className="font-mono text-xs text-[var(--color-muted)]">within {distanceLabel}</span>
          )}
        </div>
        <NearbyList profiles={results} loading={loading} />
      </div>

      <Card>
        <CardBody>
          <p className="font-mono text-xs leading-relaxed text-[var(--color-muted)]">
            Read-only lookup, not marketplace — no orders, no payments, no chat. For feasibility context only.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/compliance"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-ledger)] bg-white px-5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper)]"
            >
              Check compliance →
            </Link>
            <Link
              href="/app/finance"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-ink)] px-5 text-sm font-medium text-[var(--color-wheat)]"
            >
              To finance →
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
