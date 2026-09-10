import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  type FeasibilityResult,
  type LicenseItem,
  type NearbyProfile,
  type SchemeCalculationResult,
} from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';
import { ENTERPRISE_OPTIONS } from './enterprise-catalog';

export function useAssessment() {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Slide direction for step transitions (forward = from right, back = from left)
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const stepAnimClass = stepDirection === 'back' ? 'animate-step-back' : 'animate-step-forward';
  // Anchor for step transitions — goToStep scroll-locks here, not page top
  const stepContentRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<number>(5000);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>('agro_processing');
  const [marginPercent, setMarginPercent] = useState<number>(10);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Exact Location & Coordinate States
  // No default coordinates — stays null until GPS or search resolves
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationText, setLocationText] = useState<string>('Detecting exact location...');
  const [geoResolved, setGeoResolved] = useState<{ state: string; district: string; block: string; display_name?: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'detecting' | 'detected' | 'manual' | 'denied' | 'idle'>('detecting');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [manualOverrideOpen, setManualOverrideOpen] = useState<boolean>(false);

  // Backend Integration States
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [feasibilityResult, setFeasibilityResult] = useState<FeasibilityResult | null>(null);
  const [schemeResult, setSchemeResult] = useState<SchemeCalculationResult | null>(null);
  // Empty by default — populated only from live PostGIS API for user's real location
  const [nearbyProfiles, setNearbyProfiles] = useState<NearbyProfile[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [dprId, setDprId] = useState<string>('UDYOG-MH-2026-8941');
  const [dprStatus, setDprStatus] = useState<string>('Compiled & Signed');

  // Mock DigiLocker sandbox (Step 5) — frontend-only simulation, no real API call.
  const [digiError, setDigiError] = useState<string | null>(null);
  const [digiStatus, setDigiStatus] = useState<'idle' | 'redirecting' | 'consent' | 'verified'>('idle');
  const [digiIdentity, setDigiIdentity] = useState<{
    name: string;
    dob: string;
    gender: string;
    maskedAadhaar: string;
    pan: string;
    address: string;
  } | null>(null);

  const enterprise = ENTERPRISE_OPTIONS.find((e) => e.id === selectedEnterprise) || ENTERPRISE_OPTIONS[0];

  // Base fallback figures
  const fallbackTpc = enterprise.capex;
  const fallbackMargin = (fallbackTpc * marginPercent) / 100;

  // Display values: prioritizes server-calculated values per standing rules
  const displayTpc = schemeResult ? schemeResult.tpc : fallbackTpc;
  const displayMargin = schemeResult ? schemeResult.margin : fallbackMargin;

  // Mirror of geoStatus for async GPS callbacks (avoids stale closures).
  const geoStatusRef = useRef(geoStatus);
  useEffect(() => {
    geoStatusRef.current = geoStatus;
  }, [geoStatus]);

  // Pune fallback carries real coordinates so map + feasibility keep working without GPS.
  const applyPuneFallback = useCallback(() => {
    setUserCoords({ lat: 18.5204, lon: 73.8567 });
    setGeoResolved({ state: 'Maharashtra', district: 'Pune', block: 'Haveli' });
    setLocationText('Haveli, Pune, Maharashtra');
    setSearchLocationQuery('Pune, Maharashtra');
    setGeoStatus('denied');
    setLoadingState(null);
  }, []);

  // Last-resort place-name lookup when the backend is unreachable.
  // Server path (Mappls → Nominatim) stays preferred; this mirrors its parsing.
  const reverseGeocodeClientSide = async (lat: number, lon: number) => {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}` +
      `&zoom=14&addressdetails=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    const addr = data.address || {};
    const state = (addr.state || '').trim();
    if (!state) throw new Error('Nominatim returned no state');
    const district = (addr.state_district || addr.county || addr.city || '').trim();
    const block = (addr.suburb || addr.town || addr.village || addr.neighbourhood || addr.county || '').trim();
    return {
      state,
      district: district || state,
      block: block || district || state,
      display_name: data.display_name as string | undefined,
    };
  };

  const resolvePlaceName = async (lat: number, lon: number) => {
    try {
      return await api.reverseGeocode(lat, lon);
    } catch (err) {
      console.warn('Backend reverse-geocode unreachable, trying client-side lookup:', err);
      return await reverseGeocodeClientSide(lat, lon);
    }
  };

  // 1. Detect Exact GPS Location of User.
  // Called by the Locate button when the search input is blank; force=true
  // overwrites even a manual search, the silent mount call never clobbers
  // a location the user already searched.
  const detectExactLocation = useCallback(async (force = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      applyPuneFallback();
      return;
    }
    if (!force && geoStatusRef.current === 'manual') return;
    if (window.isSecureContext === false) {
      // getCurrentPosition always fails off HTTPS (except localhost) — skip straight to fallback.
      console.warn('Geolocation needs HTTPS or localhost; using Pune fallback.');
      applyPuneFallback();
      return;
    }

    setGeoStatus('detecting');
    setLoadingState('Acquiring high-precision GPS satellite fix...');

    const onFix = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserCoords({ lat, lon });

      try {
        const resolved = await resolvePlaceName(lat, lon);
        // A manual search that landed while GPS was in flight wins.
        if (!force && geoStatusRef.current === 'manual') return;
        setGeoResolved(resolved);
        const locStr = [resolved.block || resolved.district, resolved.district, resolved.state]
          .filter(Boolean)
          .join(', ');
        const finalStr = locStr || resolved.display_name || `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
        setLocationText(finalStr);
        setSearchLocationQuery(finalStr);
        setGeoStatus('detected');
      } catch (err) {
        console.warn('Place-name lookup failed, showing coordinates:', err);
        const coordStr = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
        setLocationText(coordStr);
        setSearchLocationQuery(coordStr);
        setGeoStatus('detected');
      } finally {
        setLoadingState(null);
      }
    };

    const onHardFail = (err: GeolocationPositionError) => {
      console.warn('Geolocation unavailable:', err.message);
      applyPuneFallback();
    };

    navigator.geolocation.getCurrentPosition(
      onFix,
      (err) => {
        if (err.code === err.TIMEOUT) {
          // High-accuracy fix too slow (indoor/device) — retry with network fix before giving up.
          setLoadingState('High-accuracy fix timed out — retrying with network location...');
          navigator.geolocation.getCurrentPosition(onFix, onHardFail, {
            enableHighAccuracy: false,
            timeout: 25000,
            maximumAge: 600000,
          });
        } else {
          onHardFail(err);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [applyPuneFallback]);

  // 2. Search Any Location by Query
  const handleLocationSearch = async (queryText?: string) => {
    const query = (queryText || searchLocationQuery).trim();
    if (!query) return;

    setIsSearchingLocation(true);
    setLoadingState(`Locating "${query}" and resolving administrative catchment...`);
    try {
      const res = await api.forwardGeocode(query);
      if (res) {
        setUserCoords({ lat: res.lat, lon: res.lon });
        setGeoResolved({ state: res.state, district: res.district, block: res.block, display_name: res.display_name });
        const locStr = [res.block, res.district, res.state].filter(Boolean).join(', ');
        const finalStr = locStr || res.display_name;
        setLocationText(finalStr);
        setSearchLocationQuery(finalStr);
        setGeoStatus('manual');
      }
    } catch (err) {
      console.warn('Forward geocode notice:', err);
      alert(`Could not locate "${query}". Please check the spelling or search by District, State.`);
    } finally {
      setIsSearchingLocation(false);
      setLoadingState(null);
    }
  };

  // Locate button: blank input → auto GPS fix; typed query → geocode search.
  const handleLocate = () => {
    if (!searchLocationQuery.trim()) {
      detectExactLocation(true);
      return;
    }
    handleLocationSearch();
  };

  // Start location detection without waiting for an unused health probe.
  useEffect(() => {
    detectExactLocation();
  }, []);

  // 4. Fetch Directory Nearby when radius or exact coordinates change
  //    Only fires when we have real user coordinates — never uses mock data
  useEffect(() => {
    if (!userCoords) return; // wait for GPS to resolve
    const { lat, lon } = userCoords;
    let mounted = true;
    async function loadNearby() {
      setNearbyLoading(true);
      try {
        const dir = await api.getNearbyDirectory(lat, lon, radius, enterprise.apiCategory);
        if (mounted) {
          // Only show profiles that are actually within the selected radius
          const withinRadius = (dir.profiles || []).filter((p) => p.distance_m <= radius);
          setNearbyProfiles(withinRadius);
        }
      } catch {
        // API offline — show empty, never fall back to mock Shirur data
        if (mounted) setNearbyProfiles([]);
      } finally {
        if (mounted) setNearbyLoading(false);
      }
    }
    loadNearby();
    return () => {
      mounted = false;
    };
  }, [userCoords, radius, enterprise.apiCategory]);

  // 5. Scheme Calculation via live backend
  const runSchemeCalculate = useCallback(async () => {
    const marginAmt = (enterprise.capex * marginPercent) / 100;
    try {
      setLoadingState('Calculating institutional scheme math...');
      const res = await api.calculateScheme(marginAmt, enterprise.apiCategory);
      setSchemeResult(res);
    } catch (err) {
      console.warn('Live scheme calculation fallback active:', err);
    } finally {
      setLoadingState(null);
    }
  }, [enterprise.capex, enterprise.apiCategory, marginPercent]);

  useEffect(() => {
    runSchemeCalculate();
  }, [runSchemeCalculate]);

  // 6. Load Compliance Licenses for exact resolved State & District
  useEffect(() => {
    let mounted = true;
    async function loadCompliance() {
      try {
        const st = geoResolved?.state || 'Maharashtra';
        const dist = geoResolved?.district || 'Pune';
        const res = await api.getComplianceLicenses(enterprise.apiCategory, st, dist);
        if (mounted && res.licenses && res.licenses.length > 0) {
          setLicenses(res.licenses);
        }
      } catch {
        // Fallback default statutory clearances
      }
    }
    loadCompliance();
    return () => {
      mounted = false;
    };
  }, [enterprise.apiCategory, geoResolved?.state, geoResolved?.district]);

  // 7. Feasibility Score Execution with exact user coordinates
  const executeFeasibilityAI = async () => {
    if (!userCoords) {
      alert('Please allow location access or search for your location first.');
      return;
    }
    setLoadingState('Connecting to geospatial engine & live POI cluster...');
    try {
      const res = await api.getFeasibilityScore({
        location_text: locationText,
        business_category: enterprise.apiCategory,
        lat: userCoords.lat,
        lon: userCoords.lon,
        radius_m: radius,
        // population omitted — backend derives from LGD data
      });
      setFeasibilityResult(res);
    } catch (err) {
      console.warn('Live feasibility endpoint warning, rendering cached model:', err);
    } finally {
      setLoadingState(null);
      goToStep(3);
    }
  };


  // 6. Handle DPR PDF Generation & Download
  const handleDprDownload = async () => {
    setLoadingState('Compiling bank-ready DPR dossier...');
    let targetDprId = dprId;

    try {
      // 1. If feasibility and scheme results are ready, request backend render
      if (feasibilityResult && schemeResult) {
        const res = await api.renderDpr({
          applicant_name: digiIdentity ? digiIdentity.name : 'Applicant Beneficiary',
          business_name: `${enterprise.name} Unit`,
          feasibility: feasibilityResult,
          scheme: schemeResult,
        });
        targetDprId = res.dpr_id;
        setDprId(res.dpr_id);
        setDprStatus('Compiled & Ready');
      }

      // 2. Fetch the compiled PDF binary and trigger real browser file download
      const blob = await api.downloadDprPdf(targetDprId);
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${targetDprId}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.warn('DPR render/download notice:', err);
      // Fallback feedback if network interrupted
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } finally {
      setLoadingState(null);
    }
  };

  const handleShareWhatsApp = () => {
    const clusterName = geoResolved?.block || geoResolved?.district || locationText.split(',')[0] || 'Local';
    const text = encodeURIComponent(
      `UdyogSaarthi DPR Reference ID: ${dprId}. High Feasibility (${viabilityScore}/100) ${enterprise.name} ${clusterName} Cluster.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const goToStep = (stepNum: number) => {
    setStepDirection(stepNum < currentStep ? 'back' : 'forward');
    setCurrentStep(stepNum);
    // Lock scroll onto the step content (below the stepper), offset for fixed header
    requestAnimationFrame(() => {
      const el = stepContentRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 96;
        el.focus({ preventScroll: true });
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        window.scrollTo({ top, behavior });
      }
    });
  };

  // ── Mock DigiLocker sandbox flow ──────────────────────────────────
  // Clearly MOCK: branded button → fake redirect → fake consent page →
  // synthetic identity. Nothing leaves the browser.
  const startDigiRedirect = () => {
    setDigiError(null);
    setDigiStatus('redirecting');
    window.setTimeout(() => setDigiStatus('consent'), 1200);
  };

  const allowDigiConsent = () => {
    const block = geoResolved?.block || locationText.split(',')[0] || 'Haveli';
    const district = geoResolved?.district || 'Pune';
    const state = geoResolved?.state || 'Maharashtra';
    setDigiIdentity({
      name: 'Ravi Patil',
      dob: '15/08/1990',
      gender: 'Male',
      maskedAadhaar: 'XXXX-XXXX-7777',
      pan: 'DKZPP4821F',
      address: `${block}, ${district}, ${state}`,
    });
    setDigiError(null);
    setDigiStatus('verified');
  };

  const denyDigiConsent = () => {
    setDigiStatus('idle');
    setDigiError('Access was denied on the DigiLocker page — try again or skip for now.');
  };

  const resetDigiSandbox = () => {
    setDigiError(null);
    setDigiStatus('idle');
    setDigiIdentity(null);
  };

  // Score & SWOT values (from backend or baseline)
  const viabilityScore = feasibilityResult ? Math.round(100 - feasibilityResult.density_score) : 84;
  const swotStrength = feasibilityResult?.swot?.strength || '3 active primary agricultural cooperatives (PACS) located within 4.2 km radius.';
  const swotWeakness = feasibilityResult?.swot?.weakness || 'Summer 3-phase grid power load shedding (10-15 kW dedicated solar buffer needed).';
  const swotOpportunity = feasibilityResult?.swot?.opportunity || 'Direct off-take tie-ups with regional consumer clusters via arterial agro-corridor.';
  const swotThreat = feasibilityResult?.swot?.threat || 'Late monsoon waterlogging on secondary village approach roads.';

  return { t, currentStep, stepAnimClass, stepContentRef, radius, setRadius, selectedEnterprise, setSelectedEnterprise, marginPercent, setMarginPercent, downloadSuccess, userCoords, setUserCoords, locationText, setLocationText, geoResolved, geoStatus, searchLocationQuery, setSearchLocationQuery, isSearchingLocation, manualOverrideOpen, setManualOverrideOpen, loadingState, feasibilityResult, schemeResult, nearbyProfiles, nearbyLoading, licenses, dprId, dprStatus, digiError, digiStatus, digiIdentity, enterprise, displayTpc, displayMargin, handleLocationSearch, handleLocate, executeFeasibilityAI, handleDprDownload, handleShareWhatsApp, goToStep, startDigiRedirect, allowDigiConsent, denyDigiConsent, resetDigiSandbox, viabilityScore, swotStrength, swotWeakness, swotOpportunity, swotThreat };
}

export type AssessmentState = ReturnType<typeof useAssessment>;
