import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  isAuthenticationError,
  type FeasibilityResult,
  type CapitalEstimate,
  type FundingPreference,
  type LicenseItem,
  type NearbyProfile,
  type SchemeCalculationResult,
} from '../../lib/api';
import { useLanguage } from '../../lib/LanguageContext';
import { digiLockerAdapter } from '../../lib/digilocker';
import { pushMyDpr } from '../../lib/my-dprs';
import { canGenerateDpr, clampRestoredStep, getAdvanceError } from '../../lib/assessment-workflow';
import { ENTERPRISE_OPTIONS } from './enterprise-catalog';

const DRAFT_KEY = 'udyogsaarthi-assessment-draft-v1';

interface AssessmentDraft {
  currentStep: number;
  highestStepReached: number;
  radius: number;
  selectedEnterprise: string;
  marginPercent: number;
  userCoords: { lat: number; lon: number } | null;
  locationText: string;
  geoResolved: { state: string; district: string; block: string; display_name?: string } | null;
  geoStatus: 'detected' | 'manual' | 'denied' | 'idle';
  searchLocationQuery: string;
  feasibilityResult: FeasibilityResult | null;
  schemeResult: SchemeCalculationResult | null;
  capitalEstimate: CapitalEstimate | null;
  nearbyProfiles: NearbyProfile[];
  licenses: LicenseItem[];
  applicantName: string;
  simulatedPan: string;
  incomeTier: 'low' | 'middle' | 'high';
  overrideScheme: string;
  fundingPreference: FundingPreference | '';
  digiLockerStatus: 'idle' | 'success' | 'error';
  digiLockerReference: string | null;
  digiLockerVerified: boolean;
  reviewConfirmed: boolean;
  dprId: string | null;
  dprStatus: 'idle' | 'ready' | 'error';
}

function loadDraft(): Partial<AssessmentDraft> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}'); } catch { return {}; }
}

function sanitizeHighestStep(draft: Partial<AssessmentDraft>): number {
  let highest = Math.min(6, Math.max(1, draft.highestStepReached ?? 1));
  const state = {
    userCoords: draft.userCoords ?? null,
    locationText: draft.locationText ?? '',
    selectedEnterprise: draft.selectedEnterprise ?? '',
    feasibilityResult: draft.feasibilityResult ?? null,
    schemeResult: draft.schemeResult ?? null,
    applicantName: draft.applicantName ?? '',
    fundingPreference: draft.fundingPreference ?? '',
  };
  for (let target = 2; target <= highest; target += 1) {
    if (getAdvanceError(target, state)) { highest = target - 1; break; }
  }
  return highest;
}

export function useAssessment() {
  const { t } = useLanguage();
  const [initialDraft] = useState(loadDraft);
  const initialHighest = sanitizeHighestStep(initialDraft);
  const [currentStep, setCurrentStep] = useState<number>(clampRestoredStep(initialDraft.currentStep ?? 1, initialHighest));
  const [highestStepReached, setHighestStepReached] = useState(initialHighest);
  // Slide direction for step transitions (forward = from right, back = from left)
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const stepAnimClass = stepDirection === 'back' ? 'animate-step-back' : 'animate-step-forward';
  // Anchor for step transitions — goToStep scroll-locks here, not page top
  const stepContentRef = useRef<HTMLDivElement>(null);
  const [radius, setRadiusState] = useState<number>(initialDraft.radius ?? 5000);
  const [selectedEnterprise, setSelectedEnterpriseState] = useState<string>(initialDraft.selectedEnterprise ?? '');
  const [marginPercent, setMarginPercentState] = useState<number>(initialDraft.marginPercent ?? 10);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [uiError, setUiError] = useState<string | null>(null);

  // Exact Location & Coordinate States
  // No default coordinates — stays null until GPS or search resolves
  const [userCoords, setUserCoordsState] = useState<{ lat: number; lon: number } | null>(initialDraft.userCoords ?? null);
  const [locationText, setLocationTextState] = useState<string>(initialDraft.locationText ?? '');
  const [geoResolved, setGeoResolved] = useState<{ state: string; district: string; block: string; display_name?: string } | null>(initialDraft.geoResolved ?? null);
  const [geoStatus, setGeoStatus] = useState<'detecting' | 'detected' | 'manual' | 'denied' | 'idle'>(initialDraft.geoStatus ?? (initialDraft.userCoords ? 'manual' : 'detecting'));
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>(initialDraft.searchLocationQuery ?? '');
  // True once the user edits the search field. A value filled in by GPS is not
  // "input", so the locate button should fall back to a fresh GPS fix.
  const [searchQueryTouched, setSearchQueryTouched] = useState<boolean>(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);

  // Backend Integration States
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [feasibilityResult, setFeasibilityResult] = useState<FeasibilityResult | null>(initialDraft.feasibilityResult ?? null);
  const [schemeResult, setSchemeResult] = useState<SchemeCalculationResult | null>(initialDraft.schemeResult ?? null);
  const [capitalEstimate, setCapitalEstimate] = useState<CapitalEstimate | null>(initialDraft.capitalEstimate ?? null);
  // Empty by default — populated only from live PostGIS API for user's real location
  const [nearbyProfiles, setNearbyProfiles] = useState<NearbyProfile[]>(initialDraft.nearbyProfiles ?? []);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [licenses, setLicenses] = useState<LicenseItem[]>(initialDraft.licenses ?? []);
  const [dprId, setDprId] = useState<string | null>(initialDraft.dprId ?? null);
  const [dprStatus, setDprStatus] = useState<'idle' | 'queued' | 'ready' | 'error'>(initialDraft.dprStatus ?? 'idle');
  const [applicantName, setApplicantNameState] = useState(initialDraft.applicantName ?? '');
  const [simulatedPan, setSimulatedPanState] = useState(initialDraft.simulatedPan ?? '');
  const [incomeTier, setIncomeTierState] = useState<'low' | 'middle' | 'high'>(initialDraft.incomeTier ?? 'middle');
  const [overrideScheme, setOverrideSchemeState] = useState(initialDraft.overrideScheme ?? '');
  const [fundingPreference, setFundingPreferenceState] = useState<FundingPreference | ''>(initialDraft.fundingPreference ?? '');
  const [digiLockerStatus, setDigiLockerStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>(initialDraft.digiLockerStatus ?? 'idle');
  const [digiLockerReference, setDigiLockerReference] = useState<string | null>(initialDraft.digiLockerReference ?? null);
  const [digiLockerVerified, setDigiLockerVerified] = useState(initialDraft.digiLockerVerified ?? false);
  const [reviewConfirmed, setReviewConfirmed] = useState(initialHighest >= 6 && Boolean(initialDraft.reviewConfirmed));

  const enterprise = ENTERPRISE_OPTIONS.find((e) => e.id === selectedEnterprise) || ENTERPRISE_OPTIONS[0];

  // Local construction, fit-out and logistics vary materially by state. Keep
  // the catalogue benchmark as the source of truth, then apply a transparent
  // location index once the selected location has been resolved.
  const locationAdjustedCapex = capitalEstimate?.total ?? enterprise.capex;
  const locationCostFactor = capitalEstimate ? capitalEstimate.total / enterprise.capex : 1;

  const invalidateFrom = useCallback((step: number) => {
    setHighestStepReached((value) => Math.min(value, step));
    setReviewConfirmed(false);
    setDprId(null);
    setDprStatus('idle');
  }, []);

  const setRadius = (value: number) => {
    setRadiusState(value);
    setFeasibilityResult(null);
    invalidateFrom(1);
  };
  const setSelectedEnterprise = (value: string) => {
    setSelectedEnterpriseState(value);
    setFeasibilityResult(null);
    setSchemeResult(null);
    invalidateFrom(2);
  };
  const setMarginPercent = (value: number) => {
    setMarginPercentState(value);
    setSchemeResult(null);
    invalidateFrom(2);
  };
  const setUserCoords = (value: { lat: number; lon: number } | null) => {
    setUserCoordsState(value);
    setFeasibilityResult(null);
    invalidateFrom(1);
  };
  const setLocationText = (value: string) => {
    setLocationTextState(value);
    setFeasibilityResult(null);
    invalidateFrom(1);
  };
  const setApplicantName = (value: string) => {
    setApplicantNameState(value);
    invalidateFrom(5);
  };
  const setFundingPreference = (value: FundingPreference | '') => {
    setFundingPreferenceState(value);
    invalidateFrom(4);
  };

  const connectDigiLocker = async () => {
    setDigiLockerStatus('connecting');
    try {
      const result = await digiLockerAdapter.connect();
      setDigiLockerReference(result.reference);
      setDigiLockerVerified(result.verified);
      setDigiLockerStatus('success');
    } catch {
      setDigiLockerReference(null);
      setDigiLockerVerified(false);
      setDigiLockerStatus('error');
    }
  };

  // Base fallback figures
  const fallbackTpc = locationAdjustedCapex;
  const fallbackMargin = (fallbackTpc * marginPercent) / 100;

  // Display values: prioritizes server-calculated values per standing rules
  const displayTpc = schemeResult ? schemeResult.tpc : fallbackTpc;
  const displayMargin = schemeResult ? schemeResult.margin : fallbackMargin;

  useEffect(() => {
    const draft: AssessmentDraft = {
      currentStep, highestStepReached, radius, selectedEnterprise, marginPercent,
      userCoords, locationText, geoResolved,
      geoStatus: geoStatus === 'detecting' ? 'idle' : geoStatus,
      searchLocationQuery, feasibilityResult, schemeResult, capitalEstimate, nearbyProfiles, licenses,
      applicantName, simulatedPan, incomeTier, overrideScheme, fundingPreference,
      digiLockerStatus: digiLockerStatus === 'connecting' ? 'idle' : digiLockerStatus,
      digiLockerReference,
      digiLockerVerified,
      reviewConfirmed,
      dprId,
      dprStatus: dprStatus === 'queued' ? 'idle' : dprStatus,
    };
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* Continue without draft persistence. */ }
  }, [currentStep, highestStepReached, radius, selectedEnterprise, marginPercent, userCoords, locationText, geoResolved, geoStatus, searchLocationQuery, feasibilityResult, schemeResult, capitalEstimate, nearbyProfiles, licenses, applicantName, simulatedPan, incomeTier, overrideScheme, fundingPreference, digiLockerStatus, digiLockerReference, digiLockerVerified, reviewConfirmed, dprId, dprStatus]);

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
    if (!force && (geoStatusRef.current === 'manual' || geoStatusRef.current === 'detected')) return;
    if (window.isSecureContext === false) {
      // getCurrentPosition always fails off HTTPS (except localhost) — skip straight to fallback.
      console.warn('Geolocation needs HTTPS or localhost.');
      handleLocationUnavailable();
      return;
    }

    setGeoStatus('detecting');
    setUiError(null);
    if (force) setLoadingState('Finding your location…');

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
        setSearchQueryTouched(false);
        setGeoStatus('detected');
      } catch (err) {
        console.warn('Place-name lookup failed:', err);
        const coordStr = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;
        setLocationText(coordStr);
        setSearchLocationQuery(coordStr);
        setSearchQueryTouched(false);
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
    setLoadingState(`Finding “${query}” and confirming the area…`);
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

  // Locate button: user-typed query → geocode search; otherwise → fresh GPS fix.
  const handleLocate = () => {
    if (!searchQueryTouched || !searchLocationQuery.trim()) {
      detectExactLocation(true);
      return;
    }
    handleLocationSearch();
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQueryTouched(true);
    setSearchLocationQuery(value);
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
          if (withinRadius.length || !enterprise.apiCategory) setNearbyProfiles(withinRadius);
          else {
            // A category mismatch in the registry should not look like an
            // empty market. Retry without the category filter and label the
            // returned records honestly as nearby registered businesses.
            api.getNearbyDirectory(lat, lon, radius)
              .then((all) => mounted && setNearbyProfiles((all.profiles || []).filter((p) => p.distance_m <= radius)))
              .catch(() => mounted && setNearbyProfiles([]));
          }
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
  useEffect(() => {
    let mounted = true;
    if (!selectedEnterprise || !geoResolved?.state || !locationText) {
      setCapitalEstimate(null);
      return () => { mounted = false; };
    }
    api.getCapitalEstimate({
      business: enterprise.name,
      location: locationText,
      state: geoResolved.state,
      base_capex: enterprise.capex,
    }).then((result) => { if (mounted) setCapitalEstimate(result); })
      .catch(() => { if (mounted) setCapitalEstimate(null); });
    return () => { mounted = false; };
  }, [selectedEnterprise, enterprise.name, enterprise.capex, geoResolved?.state, locationText]);

  const runSchemeCalculate = useCallback(async () => {
    if (!selectedEnterprise) { setSchemeResult(null); return; }
    const marginAmt = (locationAdjustedCapex * marginPercent) / 100;
    try {
      const res = await api.calculateScheme(marginAmt, enterprise.apiCategory);
      setSchemeResult(res);
    } catch (err) {
      console.warn('Scheme calculation unavailable:', err);
      setSchemeResult(null);
    }
  }, [selectedEnterprise, locationAdjustedCapex, enterprise.apiCategory, marginPercent]);

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
    if (!selectedEnterprise) {
      setUiError('Choose a business idea before checking local demand.');
      return;
    }
    if (!userCoords) {
      setUiError('Search for your location before checking local demand.');
      return;
    }
    setLoadingState('Checking local demand around your selected area…');
    setUiError(null);
    try {
      const [res, directory] = await Promise.all([
        api.getFeasibilityScore({
        location_text: locationText,
        business_category: enterprise.apiCategory,
        lat: userCoords.lat,
        lon: userCoords.lon,
        radius_m: radius,
        // population omitted — backend derives from LGD data
        }),
        api.getNearbyDirectory(userCoords.lat, userCoords.lon, radius, enterprise.apiCategory)
          .catch(() => null),
      ]);
      setFeasibilityResult(res);
      if (directory) {
        setNearbyProfiles((directory.profiles || []).filter((profile) => profile.distance_m <= radius));
      }
      setHighestStepReached((value) => Math.max(value, 3));
      transitionToStep(3);
    } catch (err) {
      console.warn('Live feasibility endpoint unavailable:', err);
      setFeasibilityResult(null);
      setUiError(isAuthenticationError(err)
        ? 'Your session expired. Sign in again, then retry the local demand check. Your inputs are saved.'
        : 'Local demand data is temporarily unavailable. Your inputs are saved; please try again.');
    } finally {
      setLoadingState(null);
    }
  };


  // 6. Handle DPR PDF Generation & Download
  const handleDprDownload = async () => {
    const requirements = { userCoords, locationText, selectedEnterprise, feasibilityResult, schemeResult, applicantName, fundingPreference };
    if (!feasibilityResult || !schemeResult || !canGenerateDpr(requirements, highestStepReached, reviewConfirmed)) {
      setDprStatus('error');
      setUiError('Review every step and confirm that the information is correct before generating your report.');
      return;
    }
    const downloadPdf = async (id: string) => {
      const blob = await api.downloadDprPdf(id);
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = `${id}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);
      setDownloadSuccess(true);
      window.setTimeout(() => setDownloadSuccess(false), 4000);
    };

    if (dprStatus === 'ready' && dprId) {
      setLoadingState('Preparing your DPR download...');
      try { await downloadPdf(dprId); }
      catch { setUiError('The saved report could not be downloaded. Generate a new DPR to continue.'); setDprStatus('error'); }
      finally { setLoadingState(null); }
      return;
    }
    if (dprStatus === 'error' && dprId) {
      setLoadingState('Retrying PDF conversion…');
      setUiError(null);
      try {
        await downloadPdf(dprId);
        setDprStatus('ready');
      } catch {
        setUiError('PDF conversion is still unavailable. Your complete report remains saved on this screen; try the export again shortly.');
      } finally {
        setLoadingState(null);
      }
      return;
    }
    setLoadingState('Converting your reviewed plan to PDF…');
    setDprStatus('queued');
    setUiError(null);

    try {
      const res = await api.renderDpr({
          applicant_name: applicantName.trim() || 'Applicant',
          business_name: `${enterprise.name} Unit`,
          feasibility: feasibilityResult,
          scheme: schemeResult,
          funding_preference: fundingPreference as FundingPreference,
          identity_simulation: { pan: simulatedPan, income_tier: incomeTier, override_scheme: overrideScheme },
          verified: digiLockerVerified ? 'aa-verified' : 'self-reported',
        });
      setDprId(res.dpr_id);
      try { pushMyDpr({ id: res.dpr_id, businessName: `${enterprise.name} Unit`, createdAt: new Date().toISOString() }); } catch { /* Registry is best-effort. */ }
      let ready = false;
      if (res.status === 'queued') for (let attempt = 0; attempt < 10; attempt += 1) {
        const record = await api.getDpr(res.dpr_id);
        if (['ready', 'generated', 'verified'].includes(record.status)) { ready = true; break; }
        if (record.status === 'pdf_failed') break;
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }
      // The download endpoint has an on-demand renderer. It is the resilient
      // fallback when the queue is unavailable or slower than the short poll.
      if (!ready) setLoadingState('Finishing your PDF securely…');
      setDprStatus('ready');
      await downloadPdf(res.dpr_id);
    } catch (err) {
      console.warn('DPR render/download notice:', err);
      setDprStatus('error');
      setUiError('We could not convert the report to PDF. Your complete report remains saved on this screen; try the export again.');
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

  const transitionToStep = (stepNum: number) => {
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

  const goToStep = (stepNum: number) => {
    if (stepNum > highestStepReached) {
      setUiError('Complete the current step before moving ahead.');
      return;
    }
    setUiError(null);
    transitionToStep(stepNum);
  };

  const advanceToStep = (stepNum: number) => {
    const error = getAdvanceError(stepNum, { userCoords, locationText, selectedEnterprise, feasibilityResult, schemeResult, applicantName, fundingPreference });
    if (error) { setUiError(error); return false; }
    setUiError(null);
    setHighestStepReached((value) => Math.max(value, stepNum));
    transitionToStep(stepNum);
    return true;
  };

  return { t, currentStep, highestStepReached, stepAnimClass, stepContentRef, radius, setRadius, selectedEnterprise, setSelectedEnterprise, marginPercent, setMarginPercent, fundingPreference, setFundingPreference, downloadSuccess, uiError, setUiError, userCoords, locationText, geoResolved, geoStatus, searchLocationQuery, setSearchLocationQuery, handleSearchQueryChange, isSearchingLocation, loadingState, feasibilityResult, schemeResult, capitalEstimate, locationCostFactor, nearbyProfiles, nearbyLoading, licenses, dprId, dprStatus, applicantName, setApplicantName, simulatedPan, setSimulatedPan: setSimulatedPanState, incomeTier, setIncomeTier: setIncomeTierState, overrideScheme, setOverrideScheme: setOverrideSchemeState, digiLockerStatus, digiLockerReference, digiLockerVerified, connectDigiLocker, reviewConfirmed, setReviewConfirmed, enterprise, displayTpc, displayMargin, handleLocate, executeFeasibilityAI, handleDprDownload, handleShareWhatsApp, goToStep, advanceToStep };
}

export type AssessmentState = ReturnType<typeof useAssessment>;
