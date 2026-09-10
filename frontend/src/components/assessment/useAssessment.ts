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
  const [uiError, setUiError] = useState<string | null>(null);

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
  const [dprId, setDprId] = useState<string | null>(null);
  const [dprStatus, setDprStatus] = useState<'idle' | 'queued' | 'ready' | 'error'>('idle');
  const [applicantName, setApplicantName] = useState('');

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

  const handleLocationUnavailable = useCallback(() => {
    setUserCoords(null);
    setGeoResolved(null);
    setLocationText('');
    setGeoStatus('denied');
    setLoadingState(null);
    setUiError('Location access is unavailable. Search for your village, town, block, or district.');
  }, []);

  // 1. Detect Exact GPS Location of User.
  // Called by the Locate button when the search input is blank; force=true
  // overwrites even a manual search, the silent mount call never clobbers
  // a location the user already searched.
  const detectExactLocation = useCallback(async (force = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      handleLocationUnavailable();
      return;
    }
    if (!force && geoStatusRef.current === 'manual') return;
    if (window.isSecureContext === false) {
      // getCurrentPosition always fails off HTTPS (except localhost) — skip straight to fallback.
      console.warn('Geolocation needs HTTPS or localhost.');
      handleLocationUnavailable();
      return;
    }

    setGeoStatus('detecting');
    setUiError(null);

    const onFix = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserCoords({ lat, lon });

      try {
        const resolved = await api.reverseGeocode(lat, lon);
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
        console.warn('Place-name lookup failed:', err);
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
      handleLocationUnavailable();
    };

    navigator.geolocation.getCurrentPosition(
      onFix,
      (err) => {
        if (err.code === err.TIMEOUT) {
          // High-accuracy fix too slow (indoor/device) — retry with network fix before giving up.
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
  }, [handleLocationUnavailable]);

  // 2. Search Any Location by Query
  const handleLocationSearch = async (queryText?: string) => {
    const query = (queryText || searchLocationQuery).trim();
    if (!query) return;

    setIsSearchingLocation(true);
    setUiError(null);
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
      setUiError(`We could not find “${query}”. Check the spelling or add the district and state.`);
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
      const res = await api.calculateScheme(marginAmt, enterprise.apiCategory);
      setSchemeResult(res);
    } catch (err) {
      console.warn('Scheme calculation unavailable:', err);
      setSchemeResult(null);
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
        if (!geoResolved?.state || !geoResolved?.district) return;
        const st = geoResolved.state;
        const dist = geoResolved.district;
        const res = await api.getComplianceLicenses(enterprise.apiCategory, st, dist);
        if (mounted && res.licenses && res.licenses.length > 0) {
          setLicenses(res.licenses);
        }
      } catch {
        if (mounted) setLicenses([]);
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
      setUiError('Search for your location before checking local demand.');
      return;
    }
    setLoadingState('Connecting to geospatial engine & live POI cluster...');
    setUiError(null);
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
      console.warn('Live feasibility endpoint unavailable:', err);
      setFeasibilityResult(null);
      setUiError('Local demand data is temporarily unavailable. Your inputs are saved; please try again.');
    } finally {
      setLoadingState(null);
      goToStep(3);
    }
  };


  // 6. Handle DPR PDF Generation & Download
  const handleDprDownload = async () => {
    if (!feasibilityResult || !schemeResult) {
      setDprStatus('error');
      setUiError('Complete local demand and funding before generating your report.');
      return;
    }
    setLoadingState('Compiling bank-ready DPR dossier...');
    setDprStatus('queued');
    setUiError(null);

    try {
      const res = await api.renderDpr({
          applicant_name: applicantName.trim() || 'Applicant',
          business_name: `${enterprise.name} Unit`,
          feasibility: feasibilityResult,
          scheme: schemeResult,
        });
      setDprId(res.dpr_id);
      if (res.status === 'pdf_failed') throw new Error('PDF worker rejected the report');
      let ready = false;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const record = await api.getDpr(res.dpr_id);
        if (['ready', 'generated', 'verified'].includes(record.status)) { ready = true; break; }
        if (record.status === 'pdf_failed') throw new Error('PDF generation failed');
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (!ready) throw new Error('PDF generation timed out');
      setDprStatus('ready');
      const blob = await api.downloadDprPdf(res.dpr_id);
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${res.dpr_id}.pdf`;
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
      setDprStatus('error');
      setUiError('We could not generate the report. Please try again; your assessment is still saved on this screen.');
    } finally {
      setLoadingState(null);
    }
  };

  const handleShareWhatsApp = () => {
    if (!dprId || dprStatus !== 'ready') return;
    const clusterName = geoResolved?.block || geoResolved?.district || locationText.split(',')[0] || 'Local';
    const score = feasibilityResult ? Math.round(100 - feasibilityResult.density_score) : null;
    const scoreText = score === null ? '' : ` Feasibility score: ${score}/100.`;
    const text = encodeURIComponent(`UdyogSaarthi DPR reference: ${dprId}.${scoreText} Business: ${enterprise.name}. Area: ${clusterName}.`);
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

  return { t, currentStep, stepAnimClass, stepContentRef, radius, setRadius, selectedEnterprise, setSelectedEnterprise, marginPercent, setMarginPercent, downloadSuccess, uiError, setUiError, userCoords, setUserCoords, locationText, setLocationText, geoResolved, geoStatus, searchLocationQuery, setSearchLocationQuery, isSearchingLocation, manualOverrideOpen, setManualOverrideOpen, loadingState, feasibilityResult, schemeResult, nearbyProfiles, nearbyLoading, licenses, dprId, dprStatus, applicantName, setApplicantName, enterprise, displayTpc, displayMargin, handleLocate, executeFeasibilityAI, handleDprDownload, handleShareWhatsApp, goToStep };
}

export type AssessmentState = ReturnType<typeof useAssessment>;
