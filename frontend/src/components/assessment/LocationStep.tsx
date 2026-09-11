import {
  ArrowRight,
  ChevronDown,
  Layers,
  Navigation,
  Search
} from 'lucide-react';
import RealMap from '../RealMap';
import { Text } from '../../lib/LanguageContext';
import type { AssessmentState } from './useAssessment';

type Props = Pick<AssessmentState, "stepAnimClass" | "radius" | "setRadius" | "userCoords" | "setUserCoords" | "locationText" | "setLocationText" | "geoResolved" | "geoStatus" | "searchLocationQuery" | "setSearchLocationQuery" | "isSearchingLocation" | "manualOverrideOpen" | "setManualOverrideOpen" | "nearbyProfiles" | "handleLocate" | "advanceToStep">;

export default function LocationStep({ stepAnimClass, radius, setRadius, userCoords, setUserCoords, locationText, setLocationText, geoResolved, geoStatus, searchLocationQuery, setSearchLocationQuery, isSearchingLocation, manualOverrideOpen, setManualOverrideOpen, nearbyProfiles, handleLocate, advanceToStep }: Props) {
  return (<section className={`space-y-space-xl ${stepAnimClass}`}>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-6 flex flex-col gap-space-lg">
        <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-space-md">
            <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-kicker text-label-kicker tracking-wider uppercase flex items-center gap-1.5 font-semibold">
              <span className={`w-2 h-2 rounded-full ${geoStatus === 'detecting' ? 'bg-amber-500 animate-pulse' : 'bg-secondary animate-ping'}`} />
              {geoStatus === 'detecting'
                ? <Text>Finding your location…</Text>
                : geoStatus === 'detected'
                  ? <Text>Location found</Text>
                  : geoStatus === 'manual'
                    ? <Text>Search location selected</Text>
                    : <Text>Location needed</Text>}
            </span>
          </div>

          <h2 className="font-headline-md text-headline-md text-primary font-bold mb-space-xs font-playfair">
            <Text>Where will you start your business?</Text>
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
            {userCoords ? (
              <>
                Lat <strong className="text-on-surface">{userCoords.lat.toFixed(4)}° N</strong>, Lon <strong className="text-on-surface">{userCoords.lon.toFixed(4)}° E</strong> —{' '}
                <strong className="text-primary">{locationText}</strong>
                {geoResolved?.block ? <span className="text-secondary font-semibold"> (Block: {geoResolved.block})</span> : ''}
              </>
            ) : (
              <span className="text-amber-700 font-semibold"><Text>Search for your village or town, or use your current location.</Text></span>
            )}
          </p>

          {/* Location Search Bar with Instant Suggestions */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLocate();
            }}
            className="mb-space-lg p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm"
          >
            <label className="block font-label-ui text-label-ui font-semibold text-primary mb-1.5" htmlFor="locationSearch">
              <Text>Search for a village, town, block, or district</Text>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="locationSearch"
                  type="text"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Baramati, Pune, Maharashtra"
                  value={searchLocationQuery}
                  onChange={(e) => setSearchLocationQuery(e.target.value)}
                />
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              </div>
              <button
                type="submit"
                disabled={isSearchingLocation}
                className="px-4 py-2 rounded-lg bg-secondary text-surface font-label-ui text-xs font-semibold hover:bg-secondary/90 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Search the typed place — or leave blank to use device GPS"
              >
                <Navigation size={13} />
                <span><Text>{isSearchingLocation ? 'Finding…' : 'Find location'}</Text></span>
              </button>
            </div>
          </form>

          {/* Search Radius Selector */}
          <div className="mb-space-lg">
            <div className="flex justify-between items-center mb-2">
              <label className="font-label-ui text-label-ui font-semibold text-primary" htmlFor="radiusSlider">
                <Text>Local market radius</Text>
              </label>
              <span className="font-label-ui text-label-ui font-mono font-bold text-secondary bg-surface-container-lowest px-2.5 py-0.5 rounded-lg border border-outline-variant/50">
                {radius.toLocaleString('en-IN')} meters
              </span>
            </div>
            <input
              id="radiusSlider"
              className="w-full accent-primary h-2 bg-outline-variant/40 rounded-lg cursor-pointer"
              type="range"
              min="1000"
              max="10000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            />
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[1000, 3000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRadius(val)}
                  className={`py-1.5 px-2 rounded-lg text-center font-label-ui text-[13px] transition-colors cursor-pointer ${radius === val
                    ? 'bg-primary text-surface font-bold shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface border border-outline-variant/40 hover:bg-surface-bright'
                    }`}
                >
                  {val >= 1000 ? `${val.toLocaleString('en-IN')}m` : `${val}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Overrides Accordion */}
          <div className="border-t border-outline-variant/60 pt-3">
            <button
              type="button"
              onClick={() => setManualOverrideOpen(!manualOverrideOpen)}
              className="w-full flex justify-between items-center cursor-pointer font-label-ui text-label-ui text-secondary font-semibold text-left"
            >
              <span><Text>Enter coordinates manually</Text></span>
              <ChevronDown
                size={18}
                className={`transform transition-transform ${manualOverrideOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {manualOverrideOpen && (
              <div className="mt-3 pt-2 space-y-3">
                <div>
                  <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-medium">
                    <Text>Location label</Text>
                  </label>
                  <input
                    className="w-full p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md"
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="manualLat" className="block text-xs text-on-surface-variant mb-1">Latitude</label>
                    <input
                      type="number"
                      id="manualLat"
                      step="0.0001"
                      className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs"
                      value={userCoords?.lat ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw === "") { setUserCoords(null) }
                        const lat = parseFloat(raw)
                        if (Number.isNaN(lat)) { return }
                        setUserCoords({ lat, lon: userCoords?.lon ?? 0 })
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="manualLon" className="block text-xs text-on-surface-variant mb-1">Longitude</label>
                    <input
                      type="number"
                      id="manualLon"
                      step="0.0001"
                      className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs"
                      value={userCoords?.lon ?? ''}
                      onChange={(e) => {
                        const rawLon = e.target.value
                        if (rawLon === "") { setUserCoords(null) }
                        const lon = parseFloat(rawLon)
                        if (Number.isNaN(lon)) { return }
                        setUserCoords({ lat: userCoords?.lat ?? 0, lon })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live Mappls Map */}
      <div className="lg:col-span-6 flex flex-col gap-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-space-sm px-2">
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              <span className="font-label-ui text-label-ui font-bold text-primary"><Text>Selected area</Text></span>
            </div>
            <span className="text-secondary font-label-kicker text-label-kicker uppercase font-semibold">
              <Text>Live map</Text>
            </span>
          </div>

          {/* Live Mappls map — centered on backend-resolved coordinates */}
          <RealMap
            lat={userCoords?.lat ?? null}
            lon={userCoords?.lon ?? null}
            radiusM={radius}
            peers={nearbyProfiles}
            locationLabel={locationText}
          />

          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-on-surface-variant"><Text>Confirm the selected area before choosing your business idea.</Text></p>
            <button
              onClick={() => advanceToStep(2)}
              disabled={!userCoords}
              className="px-space-md py-3 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              type="button"
            >
              <Text>Next: Business idea</Text>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>);
}
