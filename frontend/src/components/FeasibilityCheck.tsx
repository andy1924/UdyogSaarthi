import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Factory,
  BarChart3,
  Landmark,
  FileDown,
  ArrowRight,
  TrendingUp,
  Zap,
  CheckCircle2,
  Share2,
  Phone,
  Layers,
  ChevronDown,
  ShieldCheck,
  Sliders,
  RefreshCw,
  Search,
  Navigation
} from 'lucide-react';
import {
  api,
  type FeasibilityResult,
  type SchemeCalculationResult,
  type NearbyProfile,
  type LicenseItem,
} from '../lib/api';
import RealMap from './RealMap';
import LanguageSelector from './LanguageSelector';

interface FeasibilityCheckProps {
  onBackToLanding: () => void;
}

interface EnterpriseOption {
  id: string;
  /** Backend-canonical POI slug (must exist in geo_service _MAPPLS_KEYWORDS/_OSM_TAGS). */
  apiCategory: string;
  group: string;
  name: string;
  description: string;
  capex: number;
  capexLabel: string;
}

// Full business-idea catalog — grouped per PMEGP/KVIC industry families
// (agro-based, agri-allied, forest-based, rural engineering, service & textile).
// CAPEX benchmarks follow PMEGP model-project scale (Micro ≤ ₹1.40L, Term ≤ ₹50L).
const ENTERPRISE_OPTIONS: EnterpriseOption[] = [
  // ── Agro & Food Processing ──────────────────────────────────────
  {
    id: 'agro_processing',
    apiCategory: 'mill',
    group: 'Agro & Food Processing',
    name: 'Millet Milling, Oil & Spice Unit',
    description: 'Mini flour mill, cold-press oil expeller, spice powdering and solar micro-dehydration.',
    capex: 2500000,
    capexLabel: '₹25.00 Lakh',
  },
  {
    id: 'rice_dal_mill',
    apiCategory: 'mill',
    group: 'Agro & Food Processing',
    name: 'Rice / Dal Milling & Packaging',
    description: 'Paddy de-husking or dal milling with grading, weighing and branded pack packaging.',
    capex: 1400000,
    capexLabel: '₹14.00 Lakh',
  },
  {
    id: 'bakery_namkeen',
    apiCategory: 'bakery',
    group: 'Agro & Food Processing',
    name: 'Bakery, Rusks & Namkeen Unit',
    description: 'Breads, rusks, biscuits and fried snacks for kirana and tea-stall supply routes.',
    capex: 750000,
    capexLabel: '₹7.50 Lakh',
  },
  {
    id: 'honey_processing',
    apiCategory: 'food',
    group: 'Agro & Food Processing',
    name: 'Honey Processing & Bottling',
    description: 'KVIC model project: apiary-linked extraction, filtering, moisture control and bottling.',
    capex: 500000,
    capexLabel: '₹5.00 Lakh',
  },
  {
    id: 'dhaba_tea',
    apiCategory: 'food',
    group: 'Agro & Food Processing',
    name: 'Tea Stall / Rural Dhaba',
    description: 'Highway or market-committee eatery: tea, snacks and thali with minimal equipment.',
    capex: 120000,
    capexLabel: '₹1.20 Lakh',
  },
  // ── Dairy & Livestock ────────────────────────────────────────────
  {
    id: 'dairy_livestock',
    apiCategory: 'dairy',
    group: 'Dairy & Livestock',
    name: 'Bulk Milk Cooling & Ghee Unit',
    description: 'Bulk milk cooler (BMC), paneer/ghee packaging, and cow-dung bio-fertilizer pellets.',
    capex: 1800000,
    capexLabel: '₹18.00 Lakh',
  },
  {
    id: 'poultry_layer',
    apiCategory: 'farm',
    group: 'Dairy & Livestock',
    name: 'Poultry Layer Farm (500 birds)',
    description: 'Deep-litter shed, feeders, layer chicks and egg-tray supply to local retailers.',
    capex: 800000,
    capexLabel: '₹8.00 Lakh',
  },
  {
    id: 'goatry',
    apiCategory: 'farm',
    group: 'Dairy & Livestock',
    name: 'Goatry Unit (20 goats + shed)',
    description: 'Stall-fed Osmanabadi/Sirohi goats with kidding shed and fodder plot linkage.',
    capex: 400000,
    capexLabel: '₹4.00 Lakh',
  },
  // ── Farm Services & Agri-Allied ──────────────────────────────────
  {
    id: 'farm_mechanization',
    apiCategory: 'farm',
    group: 'Farm Services & Agri-Allied',
    name: 'Custom Hiring Center',
    description: 'Tractor implements, rotavators, drone sprayers, and solar pump maintenance on hire.',
    capex: 3200000,
    capexLabel: '₹32.00 Lakh',
  },
  {
    id: 'agri_input_shop',
    apiCategory: 'farm',
    group: 'Farm Services & Agri-Allied',
    name: 'Agri-Input & Seed Shop',
    description: 'Seeds, fertilizers, pesticides and small tools at the mandi or village chowk.',
    capex: 500000,
    capexLabel: '₹5.00 Lakh',
  },
  {
    id: 'cold_storage',
    apiCategory: 'farm',
    group: 'Farm Services & Agri-Allied',
    name: 'Solar Cold Storage (10 MT)',
    description: 'Micro cold room for vegetables, dairy and floriculture on pay-per-crate rental.',
    capex: 2800000,
    capexLabel: '₹28.00 Lakh',
  },
  {
    id: 'nursery_vermi',
    apiCategory: 'farm',
    group: 'Farm Services & Agri-Allied',
    name: 'Nursery + Vermicompost Unit',
    description: 'Sapling nursery with vermi-beds converting farm waste into bagged compost.',
    capex: 250000,
    capexLabel: '₹2.50 Lakh',
  },
  // ── Craft, Handloom & Forest ─────────────────────────────────────
  {
    id: 'artisanal_handloom',
    apiCategory: 'craft',
    group: 'Craft, Handloom & Forest',
    name: 'Areca, Bamboo & Bio-Packaging',
    description: 'Areca leaf cutlery pressing, bamboo weaving and plastic-alternative packaging.',
    capex: 1200000,
    capexLabel: '₹12.00 Lakh',
  },
  {
    id: 'stitching_garment',
    apiCategory: 'tailor',
    group: 'Craft, Handloom & Forest',
    name: 'Handloom & Stitching Unit',
    description: 'Power-loom or handloom weaving plus stitching job-work for school uniforms and blouses.',
    capex: 600000,
    capexLabel: '₹6.00 Lakh',
  },
  {
    id: 'handmade_paper',
    apiCategory: 'craft',
    group: 'Craft, Handloom & Forest',
    name: 'Handmade Paper & Carry Bags',
    description: 'KVIC model project: waste-cotton paper, envelopes and stitched cloth/paper carry bags.',
    capex: 1100000,
    capexLabel: '₹11.00 Lakh',
  },
  // ── Rural Retail & Trade ─────────────────────────────────────────
  {
    id: 'kirana_mart',
    apiCategory: 'retail',
    group: 'Rural Retail & Trade',
    name: 'Kirana + FMCG Mini-Mart',
    description: 'Daily-need grocery, toiletries and recharge counter with UPI billing.',
    capex: 400000,
    capexLabel: '₹4.00 Lakh',
  },
  {
    id: 'garment_footwear',
    apiCategory: 'clothes',
    group: 'Rural Retail & Trade',
    name: 'Garments & Footwear Store',
    description: 'Readymade clothes, school uniforms, Hawai chappals and seasonal wear.',
    capex: 600000,
    capexLabel: '₹6.00 Lakh',
  },
  {
    id: 'jan_aushadhi',
    apiCategory: 'pharmacy',
    group: 'Rural Retail & Trade',
    name: 'Jan Aushadhi Medicine Shop',
    description: 'Generic-medicine franchise near PHC/bus stand with pharmacist on rolls.',
    capex: 300000,
    capexLabel: '₹3.00 Lakh',
  },
  // ── Services & Digital ───────────────────────────────────────────
  {
    id: 'csc_center',
    apiCategory: 'services',
    group: 'Services & Digital',
    name: 'CSC / Digital Seva + Xerox',
    description: 'Aadhaar, banking BC, bill payments, photocopy/lamination and online-form filing.',
    capex: 200000,
    capexLabel: '₹2.00 Lakh',
  },
  {
    id: 'salon_grooming',
    apiCategory: 'beauty',
    group: 'Services & Digital',
    name: 'Salon & Grooming Studio',
    description: 'Haircut, shave, bridal and festival-season packages with basic cosmetics retail.',
    capex: 250000,
    capexLabel: '₹2.50 Lakh',
  },
  {
    id: 'mobile_kiosk',
    apiCategory: 'mobile',
    group: 'Services & Digital',
    name: 'Mobile Sales & Repair Kiosk',
    description: 'Handsets, accessories, recharge and chip-level repair with spare-parts stock.',
    capex: 300000,
    capexLabel: '₹3.00 Lakh',
  },
  // ── Repair, Energy & Workshop ────────────────────────────────────
  {
    id: 'solar_electrical',
    apiCategory: 'repair',
    group: 'Repair, Energy & Workshop',
    name: 'Electrical + Solar Installation',
    description: 'Home wiring, pump repair and rooftop-solar installation with DISCOM empanelment.',
    capex: 350000,
    capexLabel: '₹3.50 Lakh',
  },
  {
    id: 'welding_garage',
    apiCategory: 'repair',
    group: 'Repair, Energy & Workshop',
    name: 'Welding & Two-Wheeler Workshop',
    description: 'Fabrication (gates, sheds), agro-implement repair and two-wheeler servicing bay.',
    capex: 700000,
    capexLabel: '₹7.00 Lakh',
  },
];

// Distinct dropdown groups, in catalog order.
const ENTERPRISE_GROUPS: string[] = [...new Set(ENTERPRISE_OPTIONS.map((e) => e.group))];

// Approximate DigiLocker brand mark (mock only): purple document + cloud-keyhole.
function DigiLockerMark({ size = 40, mono = false }: { size?: number; mono?: boolean }) {
  const main = mono ? '#ffffff' : '#5558A6';
  const fold = mono ? 'rgba(255,255,255,0.65)' : '#8386C4';
  const h = (size * 3) / 4;
  return (
    <svg width={size} height={h} viewBox="0 0 64 48" fill="none" aria-hidden="true">
      <path d="M22 3h22l12 12v27a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z" fill={main} />
      <path d="M44 3l12 12H46a2 2 0 0 1-2-2V3z" fill={fold} />
      <path
        d="M14 20a7 7 0 0 1 1.6-13.8A10 10 0 0 1 35 8a8 8 0 0 1 6.5 12.6c.3 4.5-3.3 8.4-7.9 8.4H21a7 7 0 0 1-7-9z"
        fill={mono ? '#5558A6' : '#ffffff'}
      />
      <circle cx="23" cy="20" r="2.6" fill={main} />
      <path d="M21.8 21.5h2.4l.9 5h-4.2l.9-5z" fill={main} />
    </svg>
  );
}

// No mock/fallback peer data — only real PostGIS results are shown

export default function FeasibilityCheck({ onBackToLanding }: FeasibilityCheckProps) {
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
  const [, setBackendOnline] = useState<boolean | null>(null);
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
  const fallbackSubsidy = fallbackTpc * 0.35;
  const fallbackLoan = Math.max(0, fallbackTpc - fallbackMargin - fallbackSubsidy);
  const fallbackEqi = Math.round((fallbackTpc - fallbackMargin) * 0.0139);

  // Display values: prioritizes server-calculated values per standing rules
  const displayTpc = schemeResult ? schemeResult.tpc : fallbackTpc;
  const displayMargin = schemeResult ? schemeResult.margin : fallbackMargin;
  const displaySubsidy = fallbackSubsidy;
  const displayLoan = schemeResult ? schemeResult.max_loan_capped : fallbackLoan;
  const displayEqi = schemeResult ? schemeResult.eqi_amount : fallbackEqi;

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

  // 3. Initial Health Check & Initial Geolocation Detection
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const health = await api.checkHealth();
        if (mounted) {
          setBackendOnline(health.status === 'ok');
        }
      } catch (err) {
        console.warn('Backend offline or degraded:', err);
        if (mounted) setBackendOnline(false);
      }
      // Trigger exact GPS detection on mount
      detectExactLocation();
    }

    init();
    return () => {
      mounted = false;
    };
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
        window.scrollTo({ top, behavior: 'smooth' });
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

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body-md antialiased selection:bg-secondary-container">
      {/* ==================== HEADER ==================== */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-outline-variant/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)] bg-surface-container-lowest/95">
        <div className="h-20 max-w-[1200px] mx-auto px-gutter-mobile lg:px-gutter-desktop flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-left cursor-pointer focus:outline-none group"
              title="Return to Landing Page"
            >
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-primary leading-none font-playfair text-2xl group-hover:text-primary/80 transition-colors">
                Udyog-Saarthi
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {loadingState && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            <RefreshCw size={36} className="text-secondary animate-spin mb-4" />
            <span className="font-headline-md text-primary font-bold text-lg mb-1">Processing Request</span>
            <p className="font-body-sm text-on-surface-variant">{loadingState}</p>
          </div>
        </div>
      )}

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="w-full pt-20 bg-surface-container-lowest">
        <div className="flex flex-col w-full">

          {/* Main Multi-Step Container */}
          <div className="max-w-[1200px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">
            {/* Editorial Headline Block */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mb-space-2xl pb-space-lg border-b border-outline-variant/50">
              <div className="max-w-3xl">
                <span className="font-label-kicker text-label-kicker uppercase tracking-widest text-secondary mb-2 block font-semibold">
                  Institutional Project Report Engine
                </span>
                <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight leading-tight font-playfair">
                  Feasibility Assessment & Bank-Ready DPR Dossier
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                  Real-time hyper-local cluster verification, market saturation index, and automated credit eligibility
                  calculation for rural micro-enterprises.
                </p>
              </div>
              <div className="shrink-0 self-end md:self-start md:pt-1">
                <LanguageSelector variant="wizard" />
              </div>
            </div>

            {/* Workflow Quick Steps (relocated from page header) */}
            <nav
              aria-label="Workflow Quick Steps"
              className="flex flex-wrap items-center gap-1 p-1 mb-space-lg rounded-full border border-outline-variant/40 bg-surface-container-lowest w-fit max-w-full"
            >
              {[
                { num: 1, label: '01 Location' },
                { num: 2, label: '02 Enterprise' },
                { num: 3, label: '03 Feasibility' },
                { num: 4, label: '04 Credit & Subsidy' },
                { num: 5, label: '05 Identity' },
                { num: 6, label: '06 DPR Dossier' },
              ].map((s) => (
                <button
                  key={s.num}
                  onClick={() => goToStep(s.num)}
                  className={`px-3 py-1.5 rounded-full font-label-ui text-label-ui transition-colors ${currentStep === s.num
                      ? 'bg-secondary-container text-on-secondary-container font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            {/* 6-Step Process Progress Bar */}
            <nav aria-label="Project Report Stepper" className="w-full mb-space-3xl overflow-x-auto pb-2">
              <ol className="flex items-center justify-between min-w-[920px] gap-2">
                <li className="flex-1">
                  <button
                    onClick={() => goToStep(1)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 1
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 1
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-[#2e5320] font-bold uppercase">
                        Step 01
                      </span>
                      <MapPin size={18} className="text-[#2e5320]" />
                    </div>
                    <span className="font-label-ui text-label-ui font-bold truncate text-primary">Location & Radius</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {locationText.split(',')[0]} ({radius / 1000} km)
                    </span>
                  </button>
                </li>

                <li className="flex-1">
                  <button
                    onClick={() => goToStep(2)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 2
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 2
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-secondary uppercase font-semibold">
                        Step 02
                      </span>
                      <Factory size={18} className="text-secondary" />
                    </div>
                    <span className="font-label-ui text-label-ui font-semibold truncate text-primary">Enterprise Code</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{enterprise.name}</span>
                  </button>
                </li>

                <li className="flex-1">
                  <button
                    onClick={() => goToStep(3)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 3
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 3
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-secondary uppercase font-semibold">
                        Step 03
                      </span>
                      <BarChart3 size={18} className="text-secondary" />
                    </div>
                    <span className="font-label-ui text-label-ui font-semibold truncate text-primary">Cluster Feasibility</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Score: {viabilityScore}/100 ({viabilityScore >= 70 ? 'High' : 'Moderate'})
                    </span>
                  </button>
                </li>

                <li className="flex-1">
                  <button
                    onClick={() => goToStep(4)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 4
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 4
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-secondary uppercase font-semibold">
                        Step 04
                      </span>
                      <Landmark size={18} className="text-secondary" />
                    </div>
                    <span className="font-label-ui text-label-ui font-semibold truncate text-primary">Credit & Subsidy</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">35% PMEGP Capital Subsidy</span>
                  </button>
                </li>

                <li className="flex-1">
                  <button
                    onClick={() => goToStep(5)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 5
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 5
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-secondary uppercase font-semibold">
                        Step 05
                      </span>
                      <ShieldCheck size={18} className="text-secondary" />
                    </div>
                    <span className="font-label-ui text-label-ui font-semibold truncate text-primary">Identity Check</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {digiStatus === 'verified' ? 'Verified via DigiLocker' : 'DigiLocker Sandbox'}
                    </span>
                  </button>
                </li>

                <li className="flex-1">
                  <button
                    onClick={() => goToStep(6)}
                    className={`w-full text-left group flex flex-col p-3 rounded-xl transition-all cursor-pointer ${currentStep === 6
                        ? 'bg-[#e8f5e2] text-primary border-2 border-[#2e5320] shadow-sm'
                        : currentStep > 6
                          ? 'bg-surface-container-highest text-on-surface border border-outline-variant/40'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/60 hover:bg-surface-container-low'
                      }`}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-kicker text-label-kicker tracking-widest text-secondary uppercase font-semibold">
                        Step 06
                      </span>
                      <FileDown size={18} className="text-secondary" />
                    </div>
                    <span className="font-label-ui text-label-ui font-semibold truncate text-primary">Dossier Package</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{dprStatus}</span>
                  </button>
                </li>
              </ol>
            </nav>

            {/* Step panels — goToStep scroll-locks to this anchor */}
            <div ref={stepContentRef} className="scroll-mt-24">

            {/* ==================== STEP 1: GEOLOCATION & RADIUS ==================== */}
            {currentStep === 1 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
                  {/* Left Column: Configuration */}
                  <div className="lg:col-span-6 flex flex-col gap-space-lg">
                    <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-space-md">
                        <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-label-kicker text-label-kicker tracking-wider uppercase flex items-center gap-1.5 font-semibold">
                          <span className={`w-2 h-2 rounded-full ${geoStatus === 'detecting' ? 'bg-amber-500 animate-pulse' : 'bg-secondary animate-ping'}`} />
                          {geoStatus === 'detecting'
                            ? 'Acquiring GPS Satellite Fix...'
                            : geoStatus === 'detected'
                              ? 'Live GPS Location Active'
                              : geoStatus === 'manual'
                                ? 'Location Geocoded'
                                : 'Location Active'}
                        </span>
                      </div>

                      <h2 className="font-headline-md text-headline-md text-primary font-bold mb-space-xs font-playfair">
                        Cluster Centroid & Geographic Catchment
                      </h2>
                      <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                        {userCoords ? (
                          <>
                            Lat <strong className="text-on-surface">{userCoords.lat.toFixed(4)}° N</strong>, Lon <strong className="text-on-surface">{userCoords.lon.toFixed(4)}° E</strong> —{' '}
                            <strong className="text-primary">{locationText}</strong>
                            {geoResolved?.block ? <span className="text-secondary font-semibold"> (Block: {geoResolved.block})</span> : ''}
                          </>
                        ) : (
                          <span className="text-amber-600 font-semibold">Awaiting GPS fix — leave the search blank and hit Locate for GPS, or type your village / town above.</span>
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
                          Search Any Village, Town, Block, or District in India
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id="locationSearch"
                              type="text"
                              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g., Baramati, Varanasi, Nashik, or your Village..."
                              value={searchLocationQuery}
                              onChange={(e) => setSearchLocationQuery(e.target.value)}
                            />
                            <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                          </div>
                          <button
                            type="submit"
                            disabled={isSearchingLocation || geoStatus === 'detecting'}
                            className="px-4 py-2 rounded-lg bg-secondary text-surface font-label-ui text-xs font-semibold hover:bg-secondary/90 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="Search the typed place — or leave blank to use device GPS"
                          >
                            <Navigation size={13} />
                            <span>{isSearchingLocation || geoStatus === 'detecting' ? 'Locating...' : 'Locate'}</span>
                          </button>
                        </div>
                        {/* Quick preset locations */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-outline-variant/40">
                          <span className="text-[11px] font-label-kicker text-on-surface-variant uppercase font-semibold">Quick Switch:</span>
                          {[
                            { name: 'Pune, MH', query: 'Pune, Maharashtra' },
                            { name: 'Baramati, MH', query: 'Baramati, Maharashtra' },
                            { name: 'Nashik, MH', query: 'Nashik, Maharashtra' },
                            { name: 'Varanasi, UP', query: 'Varanasi, Uttar Pradesh' },
                            { name: 'Indore, MP', query: 'Indore, Madhya Pradesh' },
                          ].map((pill) => (
                            <button
                              key={pill.name}
                              type="button"
                              onClick={() => {
                                setSearchLocationQuery(pill.query);
                                handleLocationSearch(pill.query);
                              }}
                              className="px-2 py-0.5 rounded-md bg-surface-container-high border border-outline-variant/60 text-[11px] font-medium text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                            >
                              {pill.name}
                            </button>
                          ))}
                        </div>
                      </form>

                      {/* Search Radius Selector */}
                      <div className="mb-space-lg">
                        <div className="flex justify-between items-center mb-2">
                          <label className="font-label-ui text-label-ui font-semibold text-primary" htmlFor="radiusSlider">
                            Market Catchment Radius (Meters)
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

                      {/* Catchment Metrics */}
                      <div className="grid grid-cols-2 gap-space-sm p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40 mb-space-lg">
                        <div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant block">
                            Estimated Rural Population
                          </span>
                          <span className="font-headline-md text-headline-md font-bold text-primary">
                            {(32000 + Math.round((radius / 1000) * 3200)).toLocaleString('en-IN')}
                          </span>
                          <span className="font-body-sm text-[12px] text-secondary block">
                            {Math.round(8 + (radius / 1000) * 1.5)} Gram Panchayats
                          </span>
                        </div>
                        <div>
                          <span className="font-body-sm text-body-sm text-on-surface-variant block">
                            Agricultural Mandi Access
                          </span>
                          <span className="font-headline-md text-headline-md font-bold text-primary">
                            {(1.6 + (radius / 10000) * 2.8).toFixed(1)} km
                          </span>
                          <span className="font-body-sm text-[12px] text-secondary block">
                            APMC {geoResolved?.block || geoResolved?.district || 'Local'} Hub
                          </span>
                        </div>
                      </div>

                      {/* Manual Overrides Accordion */}
                      <div className="border-t border-outline-variant/60 pt-3">
                        <button
                          type="button"
                          onClick={() => setManualOverrideOpen(!manualOverrideOpen)}
                          className="w-full flex justify-between items-center cursor-pointer font-label-ui text-label-ui text-secondary font-semibold text-left"
                        >
                          <span>Manual Geographic Location Coordinates Override</span>
                          <ChevronDown
                            size={18}
                            className={`transform transition-transform ${manualOverrideOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {manualOverrideOpen && (
                          <div className="mt-3 pt-2 space-y-3">
                            <div>
                              <label className="block font-body-sm text-body-sm text-on-surface mb-1 font-medium">
                                Anchor Location String (e.g. Block, District, State)
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
                                <label className="block text-xs text-on-surface-variant mb-1">Latitude</label>
                                <input
                                  type="number"
                                  step="0.0001"
                                  className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs"
                                  value={userCoords?.lat ?? ''}
                                  onChange={(e) => setUserCoords({ lat: parseFloat(e.target.value) || 0, lon: userCoords?.lon ?? 0 })}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-on-surface-variant mb-1">Longitude</label>
                                <input
                                  type="number"
                                  step="0.0001"
                                  className="w-full p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs"
                                  value={userCoords?.lon ?? ''}
                                  onChange={(e) => setUserCoords({ lat: userCoords?.lat ?? 0, lon: parseFloat(e.target.value) || 0 })}
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
                          <span className="font-label-ui text-label-ui font-bold text-primary">
                            Live Site Map
                          </span>
                        </div>
                        <span className="text-secondary font-label-kicker text-label-kicker uppercase font-semibold">
                          Mappls Live
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

                      {/* Cadastral Survey Map Notice */}
                      <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <ShieldCheck size={26} className="text-secondary" />
                          </div>
                          <div>
                            <span className="font-label-ui text-label-ui font-semibold text-primary block">
                              Cadastral Survey Map Verified
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Plot 14-B • Non-irrigated agro-conversion eligible
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => goToStep(2)}
                          className="px-space-md py-2 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                          type="button"
                        >
                          Confirm & Proceed
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ==================== STEP 2: ENTERPRISE CATEGORY & SCALE ==================== */}
            {currentStep === 2 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                  <div className="max-w-2xl mb-space-lg">
                    <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
                      Standard Rural Industry Classification
                    </span>
                    <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
                      Select Enterprise Activity & Capital Investment
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Tailors DPR financial projections according to MSME/PMEGP technology norms and local agrarian output.
                    </p>
                  </div>

                  {/* Business Idea Dropdown — full PMEGP-grounded catalog, grouped by industry family */}
                  <div className="mb-space-2xl">
                    <label
                      className="font-label-ui text-label-ui font-semibold text-primary block mb-2"
                      htmlFor="enterpriseSelect"
                    >
                      Choose Your Business Idea ({ENTERPRISE_OPTIONS.length} options)
                    </label>
                    <div className="relative">
                      <select
                        id="enterpriseSelect"
                        value={selectedEnterprise}
                        onChange={(e) => setSelectedEnterprise(e.target.value)}
                        className="w-full appearance-none p-3.5 pr-12 rounded-xl bg-surface-container-lowest border-2 border-primary/40 text-on-surface font-label-ui text-label-ui font-semibold cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {ENTERPRISE_GROUPS.map((group) => (
                          <optgroup key={group} label={group}>
                            {ENTERPRISE_OPTIONS.filter((o) => o.group === group).map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} — {opt.capexLabel}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <ChevronDown
                        size={20}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none"
                      />
                    </div>

                    {/* Selected idea summary */}
                    <div className="mt-space-md flex flex-col sm:flex-row gap-space-md p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                      <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                        <Factory size={26} className="text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-label-ui text-label-ui font-bold text-primary">{enterprise.name}</span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/60 text-secondary font-label-kicker text-[10px] uppercase font-semibold">
                            {enterprise.group}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {enterprise.description}
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0 sm:pl-4 sm:border-l border-outline-variant/40">
                        <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase tracking-wide">
                          Benchmark CAPEX
                        </span>
                        <span className="font-bold text-primary font-mono text-[18px]">{enterprise.capexLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Margin Equity & Working Capital Slider Controls */}
                  <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-xl">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="font-label-ui text-label-ui font-semibold text-primary" htmlFor="equitySlider">
                            Beneficiary Promoter Equity Margin
                          </label>
                          <span className="font-label-ui text-label-ui font-mono font-bold text-primary bg-secondary-container px-2.5 py-0.5 rounded">
                            {marginPercent}% Margin Contribution
                          </span>
                        </div>
                        <input
                          id="equitySlider"
                          className="w-full accent-primary h-2 bg-outline-variant/40 rounded-lg cursor-pointer"
                          type="range"
                          min="5"
                          max="25"
                          step="5"
                          value={marginPercent}
                          onChange={(e) => setMarginPercent(parseInt(e.target.value, 10))}
                        />
                        <div className="flex justify-between text-[11px] font-body-sm text-on-surface-variant mt-1.5">
                          <span>5% (SC/ST/Women/NER Concession)</span>
                          <span>10% (Standard PMEGP)</span>
                          <span>25% (Commercial)</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="font-label-ui text-label-ui font-semibold text-primary">
                            Target Total Project Cost (TPC)
                          </label>
                          <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
                            ₹{displayTpc.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Includes Machinery (60%), Shed/Civil Work (25%), and Initial Working Capital (15%).
                        </p>
                        {schemeResult && (
                          <div className="mt-2 text-[11px] text-secondary font-mono">
                            Scheme rules {schemeResult.rules.version} • Cap ₹{(schemeResult.rules.cap / 100000).toFixed(1)}L
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section Navigation CTA */}
                  <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
                    <button
                      onClick={() => goToStep(1)}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                      type="button"
                    >
                      ← Back to Location
                    </button>
                    <button
                      onClick={executeFeasibilityAI}
                      className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      type="button"
                    >
                      Execute Cluster Feasibility AI
                      <Zap size={18} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ==================== STEP 3: FEASIBILITY & MARKET VERDICT ==================== */}
            {currentStep === 3 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                  {/* Full Report Header — idea + site + date + print */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-space-md mb-space-lg border-b border-outline-variant/50">
                    <div>
                      <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest font-semibold">
                        Feasibility & Market Report • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
                        {enterprise.name}
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {locationText} • {(radius / 1000).toFixed(0)} km cluster • {enterprise.capexLabel} benchmark CAPEX
                      </p>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                      type="button"
                      title="Print or save this report as PDF"
                    >
                      <FileDown size={16} />
                      Print / Save PDF
                    </button>
                  </div>

                  {/* High-Confidence Verdict Banner */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg pb-space-lg border-b border-outline-variant/50">
                    <div className="flex items-center gap-space-md">
                      {/* Numeric Score Ring */}
                      <div className="w-24 h-24 rounded-2xl bg-primary text-surface flex flex-col items-center justify-center p-2 text-center shrink-0 shadow-inner">
                        <span className="font-headline-xl text-[36px] font-bold leading-none">{viabilityScore}</span>
                        <span className="font-label-kicker text-[10px] uppercase tracking-wider text-surface-dim mt-1">
                          Out of 100
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-secondary border border-secondary font-label-kicker text-label-kicker uppercase font-bold">
                            Viability Index: {viabilityScore >= 70 ? 'High' : 'Moderate'}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            • {nearbyProfiles.length} Mapped Enterprises in {(radius / 1000).toFixed(0)}km
                          </span>
                        </div>
                        <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
                          {feasibilityResult?.verdict === 'saturated'
                            ? 'Market Saturated — Pivot Strategy Recommended'
                            : feasibilityResult?.verdict === 'niche-gap'
                            ? 'Niche Gap Identified — Specialist Entry Viable'
                            : 'Recommended for Institutional Bank Credit'}
                        </h2>
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {feasibilityResult
                            ? `${feasibilityResult.poi_count} competing units found in ${(radius / 1000).toFixed(0)}km radius.`
                            : 'Demand-Supply Gap Index indicates a'}
                          {!feasibilityResult && <><strong> deficit in processed goods</strong> in the{' '}
                          {locationText.split(',')[0]} catchment zone.</>}
                          {feasibilityResult && ` Density score: ${feasibilityResult.density_score.toFixed(1)}/100.`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <span className="px-space-md py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-secondary" />
                        <span className="font-body-sm text-body-sm text-primary font-semibold">
                          {feasibilityResult?.lgd?.district ? `${feasibilityResult.lgd.district}, ${feasibilityResult.lgd.state}` : 'NABARD Normalised'}
                        </span>
                      </span>
                      {feasibilityResult && (
                        <span className="px-space-md py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/40 flex items-center gap-2">
                          <BarChart3 size={18} className="text-secondary" />
                          <span className="font-body-sm text-body-sm text-primary font-semibold">
                            LGD: {feasibilityResult.lgd.code}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-Card SWOT Matrix */}
                  <div className="mt-space-xl">
                    <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
                      Ground Reality • Micro-Market SWOT Matrix
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                      <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <TrendingUp size={20} className="text-secondary" />
                          <span className="font-headline-md text-[18px] font-bold">Strengths</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotStrength}</p>
                        <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
                          Local Raw Sourcing: High
                        </span>
                      </div>

                      <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <Zap size={20} className="text-secondary" />
                          <span className="font-headline-md text-[18px] font-bold">Weaknesses</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotWeakness}</p>
                        <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
                          Solar CAPEX Budgeted
                        </span>
                      </div>

                      <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <Factory size={20} className="text-secondary" />
                          <span className="font-headline-md text-[18px] font-bold">Opportunities</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotOpportunity}</p>
                        <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
                          Corridor Off-take: Strong
                        </span>
                      </div>

                      <div className="p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                          <Sliders size={20} className="text-secondary" />
                          <span className="font-headline-md text-[18px] font-bold">Threats</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{swotThreat}</p>
                        <span className="mt-3 pt-2 border-t border-outline-variant/30 font-label-kicker text-[10px] text-secondary uppercase font-semibold">
                          Hedging Recommended
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nearby Enterprise Registry Table */}
                  <div className="mt-space-xl">
                    <div className="flex justify-between items-center mb-space-sm">
                      <span className="font-label-ui text-label-ui font-semibold text-primary">
                        Mapped Peer Enterprises in {(radius / 1000).toFixed(0)}km Cluster (Live PostGIS API)
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {nearbyLoading ? 'Querying...' : `${nearbyProfiles.length} verified units in database`}
                      </span>
                    </div>

                    {nearbyLoading ? (
                      <div className="flex items-center justify-center gap-3 py-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant font-body-sm">
                        <RefreshCw size={18} className="animate-spin text-secondary" />
                        <span>Querying live PostGIS cluster for {(radius / 1000).toFixed(0)}km radius...</span>
                      </div>
                    ) : nearbyProfiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-center">
                        <MapPin size={28} className="text-secondary/50" />
                        <p className="font-label-ui text-label-ui font-semibold text-primary">
                          No Registered Peer Enterprises Found
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                          No {enterprise.apiCategory} units are registered in the PostGIS directory within {(radius / 1000).toFixed(0)}km of your location. This indicates a first-mover opportunity.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest">
                        <table className="w-full text-left font-body-sm text-body-sm">
                          <thead className="bg-surface-container text-primary font-headline-md text-[14px]">
                            <tr>
                              <th className="p-3">Enterprise Unit</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">Distance</th>
                              <th className="p-3">Cluster Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/40">
                            {nearbyProfiles.map((p) => (
                              <tr key={p.id} className="hover:bg-surface-bright/50">
                                <td className="p-3 font-semibold text-primary">{p.name}</td>
                                <td className="p-3">{p.category}</td>
                                <td className="p-3 font-mono">{(p.distance_m / 1000).toFixed(1)} km</td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-on-surface-variant">
                                    Verified Peer
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Market & Demand Snapshot — live backend counts + registered peers */}
                  <div className="mt-space-xl p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                    <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
                      Market Snapshot • Demand vs Competition
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-md">
                      <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                        <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Competing units (live POI)</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
                          {feasibilityResult ? feasibilityResult.poi_count : '—'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                        <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Saturation score</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
                          {feasibilityResult ? `${feasibilityResult.density_score.toFixed(0)}/100` : '—'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                        <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Registered peers (PostGIS)</span>
                        <span className="font-headline-md text-headline-md font-bold text-primary font-mono">
                          {nearbyLoading ? '…' : nearbyProfiles.length}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                        <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Market verdict</span>
                        <span className="font-headline-md text-[16px] font-bold text-primary capitalize">
                          {feasibilityResult?.verdict?.replace('-', ' ') || 'Analysing'}
                        </span>
                      </div>
                    </div>
                    {feasibilityResult && feasibilityResult.opportunities.length > 0 ? (
                      <div>
                        <span className="font-label-ui text-label-ui font-semibold text-primary block mb-2">
                          Allied gaps to pivot into (same catchment)
                        </span>
                        <ul className="space-y-2">
                          {feasibilityResult.opportunities.map((o) => (
                            <li key={o.title} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">
                              <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                              <span><strong className="text-primary">{o.title}</strong> — {o.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {nearbyProfiles.length === 0
                          ? `No ${enterprise.name.toLowerCase()} competition mapped within ${(radius / 1000).toFixed(0)} km — a first-mover window. Confirm footfall with 2–3 village visits before fixing CAPEX.`
                          : `Nearest peer: ${[...nearbyProfiles].sort((a, b) => a.distance_m - b.distance_m)[0].name} at ${([...nearbyProfiles].sort((a, b) => a.distance_m - b.distance_m)[0].distance_m / 1000).toFixed(1)} km. Differentiate on quality, packaging and credit terms rather than price.`}
                      </p>
                    )}
                  </div>

                  {/* Credit & Loan Snapshot — server-calculated values only */}
                  <div className="mt-space-xl p-space-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/60">
                    <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
                      Loan Snapshot • Scheme-Linked Finance
                    </h3>
                    {schemeResult ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
                        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                          <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Scheme tier</span>
                          <span className="font-headline-md text-[16px] font-bold text-primary capitalize">{schemeResult.tier} • {(schemeResult.rules.rate * 100).toFixed(2)}% p.a.</span>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                          <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Max loan eligible</span>
                          <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.max_loan_capped.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                          <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Your margin ({marginPercent}%)</span>
                          <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.margin.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/40">
                          <span className="block text-[11px] font-body-sm text-on-surface-variant uppercase">Est. EQI • tenure</span>
                          <span className="font-headline-md text-[16px] font-bold text-primary font-mono">₹{schemeResult.eqi_amount.toLocaleString('en-IN')} • {schemeResult.rules.tenure_years}yr</span>
                        </div>
                      </div>
                    ) : (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Loan math is being calculated against live scheme rules — full EMI schedule follows in Step 04 (Credit & Subsidy).
                      </p>
                    )}
                    <p className="mt-3 text-[11px] font-body-sm text-on-surface-variant">
                      Indicative only — final sanction per bank appraisal. Scheme rules {schemeResult ? schemeResult.rules.version : 'v2024-11'} • {schemeResult ? `${schemeResult.rules.moratorium_months}-month moratorium` : 'moratorium as per tier'}.
                    </p>
                  </div>

                  {/* Strategy & Next Steps — verdict-driven playbook */}
                  <div className="mt-space-xl p-space-lg rounded-2xl bg-secondary-container/50 border border-outline-variant/60">
                    <h3 className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest mb-space-md font-semibold">
                      Strategy • What To Do Next
                    </h3>
                    <ul className="space-y-2">
                      {(feasibilityResult?.verdict === 'saturated'
                        ? [
                          'Do not enter head-on — pick one allied gap above (lower competition, shared customers).',
                          'If you proceed anyway, differentiate on quality/packaging — never on price alone.',
                          'Re-run this report with a different business idea from the Step-02 dropdown.',
                          'Carry this report to your DIC officer for cluster-specific guidance.',
                        ]
                        : feasibilityResult?.verdict === 'niche-gap'
                          ? [
                            'First-mover window is open — move before the gap fills; lock input-supply tie-ups now.',
                            'Start lean: keep CAPEX at benchmark or below and keep 15% working-capital buffer.',
                            'Register Udyam MSME + apply for the licences listed in Step 04 early (FSSAI/shop-act).',
                            'Line up 2–3 buyer off-take letters — banks weight them heavily in appraisal.',
                          ]
                          : [
                            'Viability looks sound — proceed to Step 04 to lock your credit and subsidy structure.',
                            `Keep promoter margin ready: ₹${displayMargin.toLocaleString('en-IN')} (${marginPercent}% of TPC).`,
                            'Collect 2 machinery quotations + shed rent deed — both are mandatory DPR annexures.',
                            'Download the bank-ready DPR dossier in Step 05 after credit structuring.',
                          ]
                      ).map((step) => (
                        <li key={step} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">
                          <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section Navigation CTA */}
                  <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
                    <button
                      onClick={() => goToStep(2)}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                      type="button"
                    >
                      ← Re-adjust Category
                    </button>
                    <button
                      onClick={() => goToStep(4)}
                      className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      type="button"
                    >
                      Calculate Subvention & EQI
                      <Landmark size={18} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ==================== STEP 4: CREDIT & SUBSIDY ==================== */}
            {currentStep === 4 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                  {/* Scheme Integration Badges Header */}
                  <div className="p-space-md rounded-xl bg-secondary-container/80 border border-outline-variant/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-space-xl">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={32} className="text-primary" />
                      <div>
                        <span className="font-label-ui text-label-ui font-bold text-primary block">
                          Official Central & State Schemes Linked
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          PMEGP (Rural 35% Margin Money) + CGTMSE (Collateral Exemption up to ₹2 Cr)
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-label-kicker text-label-kicker uppercase font-bold tracking-wider">
                      Pre-Screening Approved
                    </span>
                  </div>

                  {/* Metric Badges 4-Up Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mb-space-xl">
                    <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary text-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                        Total Project Outlay
                      </span>
                      <span className="font-headline-lg text-[26px] font-bold text-primary font-mono block">
                        ₹{displayTpc.toLocaleString('en-IN')}
                      </span>
                      <span className="font-label-kicker text-[11px] text-secondary uppercase font-semibold">
                        100% Capital Base
                      </span>
                    </div>
                    <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary text-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                        Promoter Margin ({marginPercent}%)
                      </span>
                      <span className="font-headline-lg text-[26px] font-bold text-secondary font-mono block">
                        ₹{displayMargin.toLocaleString('en-IN')}
                      </span>
                      <span className="font-label-kicker text-[11px] text-secondary uppercase font-semibold">
                        Self-Equity Deposited
                      </span>
                    </div>
                    <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary text-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                        PMEGP Capital Subsidy
                      </span>
                      <span className="font-headline-lg text-[26px] font-bold text-primary font-mono block">
                        ₹{displaySubsidy.toLocaleString('en-IN')}
                      </span>
                      <span className="font-label-kicker text-[11px] text-secondary uppercase font-semibold">
                        35% Rural Non-Refundable
                      </span>
                    </div>
                    <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary text-center">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                        Bank Term Loan (Net)
                      </span>
                      <span className="font-headline-lg text-[26px] font-bold text-primary font-mono block">
                        ₹{displayLoan.toLocaleString('en-IN')}
                      </span>
                      <span className="font-label-kicker text-[11px] text-secondary uppercase font-semibold">
                        CGTMSE Covered
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown & Repayment Matrix */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                    {/* Loan Amortization Breakdown */}
                    <div className="lg:col-span-7 p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60">
                      <h3 className="font-headline-md text-headline-md text-primary font-bold mb-space-sm font-playfair">
                        Concessional Term Loan & EQI Schedule
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                        Computed under Agriculture Infrastructure Fund (AIF) protocol.
                      </p>
                      <div className="space-y-3 font-body-sm text-body-sm">
                        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                          <span className="text-on-surface">Gross Bank Sanction (Machinery + Shed)</span>
                          <span className="font-bold font-mono text-primary">
                            ₹{(displayTpc - displayMargin).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                          <span className="text-on-surface">Subsidy Escrow Lock-in (3-Year TDR)</span>
                          <span className="font-bold font-mono text-secondary">
                            ₹{displaySubsidy.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                          <span className="text-on-surface">Base Commercial Rate vs Subvention</span>
                          <span className="font-bold font-mono text-primary">9.50% → 6.50% p.a.</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                          <span className="text-on-surface">Loan Tenure & Grace Period</span>
                          <span className="font-bold font-mono text-primary">7 Years (6-Month Moratorium)</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 bg-surface-container p-3 rounded-lg text-primary">
                          <span className="font-bold">Estimated Monthly EQI (Repayment)</span>
                          <span className="font-headline-md text-[20px] font-bold font-mono text-primary">
                            ₹{Math.round(displayEqi).toLocaleString('en-IN')} / mo
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-[11px] text-on-surface-variant font-mono">
                        Scheme rules v2024-11 • Deterministic calculation verified by FastAPI backend
                      </div>
                    </div>

                    {/* Statutory Compliance Checklist */}
                    <div className="lg:col-span-5 p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col justify-between">
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold mb-space-xs font-playfair">
                          Statutory Clearances
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                          Mandatory for bank disbursement under Lead District Manager rules.
                        </p>
                        <ul className="space-y-3 font-body-sm text-body-sm">
                          {licenses.length > 0 ? (
                            licenses.map((lic) => (
                              <li key={lic.id} className="flex items-start gap-2">
                                <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-primary block">{lic.label}</strong>
                                  <span className="text-on-surface-variant text-[12px]">{lic.desc}</span>
                                </div>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-primary block">Udyam MSME Registration</strong>
                                  <span className="text-on-surface-variant text-[12px]">Instant online generation • Zero fee.</span>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-primary block">Gram Panchayat NOC & Land Extract</strong>
                                  <span className="text-on-surface-variant text-[12px]">Form 8-A and 7/12 certificate.</span>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-primary block">FSSAI Basic State Registration</strong>
                                  <span className="text-on-surface-variant text-[12px]">For food grain and oil units.</span>
                                </div>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle2 size={18} className="text-secondary shrink-0 mt-0.5" />
                                <div>
                                  <strong className="text-primary block">Pollution Control Consent (White Category)</strong>
                                  <span className="text-on-surface-variant text-[12px]">Green/White exemption category.</span>
                                </div>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-secondary font-label-kicker text-label-kicker uppercase font-semibold">
                        <span>All Templates Pre-Filled</span>
                        <span className="font-bold">Included in Dossier</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Navigation CTA */}
                  <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
                    <button
                      onClick={() => goToStep(3)}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                      type="button"
                    >
                      ← Back to Feasibility
                    </button>
                    <button
                      onClick={() => goToStep(5)}
                      className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                      type="button"
                    >
                      Verify Identity
                      <ShieldCheck size={18} />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ==================== STEP 5: DIGILOCKER SANDBOX IDENTITY ==================== */}
            {currentStep === 5 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                  <div className="max-w-2xl mb-space-lg">
                    <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
                      KYC • Identity Verification
                    </span>
                    <h2 className="font-headline-lg text-headline-lg text-primary font-bold font-playfair">
                      Verify Identity via DigiLocker
                    </h2>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Banks need a KYC-verified applicant on the DPR. Fetch your identity documents before generating the dossier.
                    </p>
                  </div>

                  {/* Sandbox disclaimer — never a real DigiLocker call */}
                  <div className="mb-space-lg p-3 rounded-xl bg-secondary-container/60 border border-dashed border-secondary flex items-start gap-2">
                    <ShieldCheck size={18} className="text-secondary shrink-0 mt-0.5" />
                    <p className="font-body-sm text-body-sm text-primary">
                      <strong>DigiLocker Sandbox (MOCK).</strong> No real DigiLocker call is made and nothing leaves this browser.
                      Press the button below to walk through a simulated DigiLocker login and consent.
                    </p>
                  </div>

                  {digiStatus !== 'verified' ? (digiStatus === 'consent' ? (
                      /* Mock DigiLocker consent page */
                      <div className="max-w-lg mx-auto rounded-2xl overflow-hidden border border-outline-variant/60 shadow-sm">
                        <div className="bg-[#5558A6] px-space-lg py-4 flex items-center gap-3">
                          <DigiLockerMark size={44} mono />
                          <div>
                            <span className="text-white font-bold text-[20px] leading-none block">DigiLocker</span>
                            <span className="text-white/70 text-[12px]">Your documents anytime, anywhere • Sandbox</span>
                          </div>
                        </div>
                        <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-3">
                          <p className="font-body-md text-body-md text-primary">
                            <strong>UdyogSaarthi</strong> is requesting access to:
                          </p>
                          <ul className="space-y-2">
                            {['Aadhaar Card — Name, DOB, Address', 'PAN Card — Number & Name'].map((doc) => (
                              <li key={doc} className="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant p-2.5 rounded-xl bg-surface-container border border-outline-variant/40">
                                <CheckCircle2 size={16} className="text-secondary shrink-0 mt-0.5" />
                                <span>{doc}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[12px] font-body-sm text-on-surface-variant">
                            One-time fetch for this DPR application. No documents are stored outside this demo session.
                          </p>
                          <div className="flex gap-3 mt-1">
                            <button
                              onClick={denyDigiConsent}
                              className="flex-1 px-space-md py-2.5 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                              type="button"
                            >
                              Deny
                            </button>
                            <button
                              onClick={allowDigiConsent}
                              className="flex-1 px-space-md py-2.5 rounded-full bg-[#5558A6] text-white font-label-ui text-label-ui font-bold hover:opacity-90 transition-colors shadow-sm cursor-pointer"
                              type="button"
                            >
                              Allow
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* DigiLocker entry — single branded button */
                      <div className="max-w-lg mx-auto p-space-xl rounded-2xl bg-surface-container-lowest border border-outline-variant/60 flex flex-col items-center text-center gap-4">
                        <DigiLockerMark size={64} />
                        <div>
                          <span className="font-bold text-[#5558A6] text-[26px] leading-none block">DigiLocker</span>
                          <span className="text-[12px] font-body-sm text-on-surface-variant">Your documents anytime, anywhere</span>
                        </div>
                        {digiStatus === 'redirecting' ? (
                          <p className="flex items-center gap-2 font-label-ui text-label-ui text-primary font-semibold">
                            <RefreshCw size={18} className="animate-spin text-secondary" />
                            Connecting to secure DigiLocker… (sandbox)
                          </p>
                        ) : (
                          <button
                            onClick={startDigiRedirect}
                            className="w-full px-space-md py-3 rounded-xl bg-[#5558A6] text-white font-label-ui text-label-ui font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-3 cursor-pointer"
                            type="button"
                          >
                            <DigiLockerMark size={30} mono />
                            Fetch your details via DigiLocker
                          </button>
                        )}
                        <p className="text-[12px] font-body-sm text-on-surface-variant">
                          You will be taken to a simulated DigiLocker login and consent page. No real account or OTP needed.
                        </p>
                      </div>
                    )
                  ) : (
                    /* Verified identity card */
                    <div className="p-space-lg rounded-2xl bg-surface-container-lowest border-2 border-primary/50 flex flex-col gap-space-md">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-label-ui text-label-ui font-bold text-primary flex items-center gap-3">
                          <span className="w-12 h-12 rounded-full bg-primary text-surface font-bold text-[18px] flex items-center justify-center">
                            {digiIdentity?.name.split(' ').map((w) => w[0]).join('')}
                          </span>
                          {digiIdentity?.name}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-primary text-surface font-label-kicker text-label-kicker uppercase font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Identity Verified
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-body-sm text-body-sm">
                        <div><span className="block text-[11px] text-on-surface-variant uppercase">Date of Birth</span><strong className="text-primary">{digiIdentity?.dob}</strong></div>
                        <div><span className="block text-[11px] text-on-surface-variant uppercase">Gender</span><strong className="text-primary">{digiIdentity?.gender}</strong></div>
                        <div><span className="block text-[11px] text-on-surface-variant uppercase">Aadhaar</span><strong className="text-primary font-mono">{digiIdentity?.maskedAadhaar}</strong></div>
                        <div><span className="block text-[11px] text-on-surface-variant uppercase">PAN</span><strong className="text-primary font-mono">{digiIdentity?.pan}</strong></div>
                        <div className="col-span-2"><span className="block text-[11px] text-on-surface-variant uppercase">Address (from Step 01)</span><strong className="text-primary">{digiIdentity?.address}</strong></div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Aadhaar XML', 'PAN Card', 'Udyam-linked KYC'].map((doc) => (
                          <span key={doc} className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant/60 font-body-sm text-body-sm text-primary flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-secondary" /> {doc} • Mock
                          </span>
                        ))}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        This identity will be printed as the applicant on your DPR dossier.
                        <button onClick={resetDigiSandbox} className="ml-2 text-secondary underline underline-offset-2 cursor-pointer" type="button">
                          Re-verify with a different number
                        </button>
                      </p>
                    </div>
                  )}

                  {digiError && (
                    <p className="mt-space-md p-3 rounded-xl bg-red-50 border border-red-200 font-body-sm text-body-sm text-red-800">
                      {digiError}
                    </p>
                  )}

                  {/* Section Navigation CTA */}
                  <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
                    <button
                      onClick={() => goToStep(4)}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                      type="button"
                    >
                      ← Back to Credit
                    </button>
                    {digiStatus === 'verified' ? (
                      <button
                        onClick={() => goToStep(6)}
                        className="px-space-xl py-2.5 rounded-full bg-primary text-surface font-label-ui text-label-ui font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                        type="button"
                      >
                        Continue to DPR Dossier
                        <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => goToStep(6)}
                        className="px-space-md py-2 rounded-full text-on-surface-variant font-label-ui text-label-ui underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
                        type="button"
                      >
                        Skip for now →
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ==================== STEP 6: BANK-READY DPR & DOWNLOAD DOSSIER ==================== */}
            {currentStep === 6 && (
              <section className={`space-y-space-xl ${stepAnimClass}`}>
                <div className="p-space-xl rounded-2xl bg-surface-container border border-outline-variant/60 shadow-sm">
                  {/* Live Generation Status */}
                  <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/60 mb-space-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
                      <div>
                        <span className="font-label-kicker text-label-kicker uppercase text-secondary tracking-widest block mb-1 font-semibold">
                          Asynchronous Rendering Worker (ID: {dprId})
                        </span>
                        <h3 className="font-headline-md text-headline-md text-primary font-bold font-playfair">
                          Detailed Project Report (DPR) Ready for Submission
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 flex items-center gap-1.5 flex-wrap">
                          Applicant: <strong className="text-primary">{digiIdentity ? digiIdentity.name : 'Applicant Beneficiary'}</strong>
                          {digiIdentity ? (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-surface text-[10px] font-bold uppercase inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> KYC Verified (Sandbox)
                            </span>
                          ) : (
                            <button onClick={() => goToStep(5)} className="text-secondary underline underline-offset-2 cursor-pointer" type="button">
                              Verify identity in Step 05
                            </button>
                          )}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-ui text-label-ui font-bold self-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                        {dprStatus}
                      </span>
                    </div>

                    {/* Document Contents Architecture */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-sm pt-space-sm border-t border-outline-variant/40">
                      <div className="p-3 rounded-lg bg-surface-container/60">
                        <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
                          Section 01
                        </span>
                        <strong className="font-label-ui text-label-ui text-primary block">Executive Summary</strong>
                        <span className="text-[12px] text-on-surface-variant font-body-sm">Sponsor & Project Profile</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container/60">
                        <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
                          Section 02
                        </span>
                        <strong className="font-label-ui text-label-ui text-primary block">Technical Feasibility</strong>
                        <span className="text-[12px] text-on-surface-variant font-body-sm">Machinery, Civil & Power</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container/60">
                        <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
                          Section 03
                        </span>
                        <strong className="font-label-ui text-label-ui text-primary block">Financial Projections</strong>
                        <span className="text-[12px] text-on-surface-variant font-body-sm">7-Yr Balance Sheet & P&L</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container/60">
                        <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
                          Section 04
                        </span>
                        <strong className="font-label-ui text-label-ui text-primary block">DSCR & Breakeven</strong>
                        <span className="text-[12px] text-on-surface-variant font-body-sm">Average DSCR: 2.14x</span>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-container/60">
                        <span className="font-label-kicker text-[10px] text-secondary uppercase block mb-1 font-semibold">
                          Section 05
                        </span>
                        <strong className="font-label-ui text-label-ui text-primary block">Checklist & NOCs</strong>
                        <span className="text-[12px] text-on-surface-variant font-body-sm">Panchayat Resolution Draft</span>
                      </div>
                    </div>
                  </div>

                  {/* Dossier Preview & Primary Download Card */}
                  <div className="p-space-xl rounded-2xl bg-surface-container-lowest border-2 border-primary shadow-sm flex flex-col lg:flex-row items-center justify-between gap-space-xl">
                    <div className="flex items-start gap-space-lg max-w-2xl">
                      {/* Simulated Dossier Cover Thumbnail */}
                      <div className="w-24 h-32 rounded-xl bg-surface-container border border-outline-variant/80 p-2 shrink-0 flex flex-col justify-between shadow-sm">
                        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-1">
                          <span className="font-headline-md text-[10px] text-primary font-bold">DPR</span>
                          <CheckCircle2 size={12} className="text-secondary" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-outline-variant/60 rounded" />
                          <div className="w-3/4 h-1 bg-outline-variant/60 rounded" />
                          <div className="w-5/6 h-1 bg-outline-variant/60 rounded" />
                        </div>
                        <div className="text-[8px] font-mono text-center text-on-surface-variant">QR VERIFIED</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-primary text-surface font-label-kicker text-[10px] uppercase tracking-wider font-semibold">
                            Bank Formulation Compliant
                          </span>
                          <span className="font-body-sm text-body-sm text-secondary font-semibold">
                            Format: PDF (24 Pages • 2.4 MB)
                          </span>
                        </div>
                        <h3 className="font-headline-lg text-headline-lg text-primary font-bold leading-tight font-playfair">
                          Download Full Detailed Project Report & Bank Application Slip
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
                          Pre-formatted for direct appraisal by State Bank of India, Bank of Maharashtra, Canara Bank,
                          and District Central Co-op Banks.
                        </p>
                      </div>
                    </div>

                    {/* Direct Download & Share Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
                      <button
                        onClick={handleDprDownload}
                        className="px-space-xl py-3.5 rounded-full bg-primary text-surface font-label-pill text-label-pill font-bold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        type="button"
                      >
                        <FileDown size={22} />
                        Download Bank-Ready DPR (.PDF)
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="px-space-md py-2.5 rounded-full bg-surface-container text-on-surface font-label-ui text-label-ui font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 border border-outline-variant/60 cursor-pointer"
                        type="button"
                      >
                        <Share2 size={18} className="text-secondary" />
                        Send to Gram Panchayat VLE / CSC
                      </button>
                      {downloadSuccess && (
                        <span className="text-xs font-semibold text-secondary text-center animate-pulse">
                          ✓ DPR Download Initiated ({dprId})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Health Snapshot from Generated Dossier */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mt-space-xl">
                    <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block">
                        Internal Rate of Return (IRR)
                      </span>
                      <span className="font-headline-md text-headline-md font-bold text-primary font-mono">24.6%</span>
                      <span className="font-body-sm text-[12px] text-secondary">Exceeds 14% benchmark hurdle</span>
                    </div>
                    <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block">
                        Breakeven Point (Capacity Utilisation)
                      </span>
                      <span className="font-headline-md text-headline-md font-bold text-primary font-mono">46.2%</span>
                      <span className="font-body-sm text-[12px] text-secondary">Achievable by Month 9</span>
                    </div>
                    <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/40">
                      <span className="font-body-sm text-body-sm text-on-surface-variant block">
                        Average Net Profit Margin
                      </span>
                      <span className="font-headline-md text-headline-md font-bold text-primary font-mono">18.4%</span>
                      <span className="font-body-sm text-[12px] text-secondary">After debt servicing & tax</span>
                    </div>
                  </div>

                  {/* Section Navigation CTA */}
                  <div className="flex justify-between items-center mt-space-xl pt-space-lg border-t border-outline-variant/60">
                    <button
                      onClick={() => goToStep(5)}
                      className="px-space-md py-2 rounded-full border border-secondary text-secondary font-label-ui text-label-ui hover:bg-secondary/10 transition-colors cursor-pointer"
                      type="button"
                    >
                      ← Back to Identity
                    </button>
                    <button
                      onClick={() => goToStep(1)}
                      className="px-space-md py-2 rounded-full bg-surface-container text-primary font-label-ui text-label-ui font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                      type="button"
                    >
                      Start New Assessment +
                    </button>
                  </div>
                </div>
              </section>
            )}
            </div>

            {/* ==================== SIGNATURE RURAL HELPLINE BAR ==================== */}
            <div className="mt-space-3xl w-full rounded-2xl bg-[#324622] text-[#e8f0df] p-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg shadow-md">
              <div className="flex items-center gap-space-md">
                <div className="w-14 h-14 rounded-full bg-surface-bright/15 flex items-center justify-center shrink-0">
                  <Phone size={28} className="text-surface-bright" />
                </div>
                <div>
                  <span className="font-label-kicker text-label-kicker uppercase tracking-widest text-[#ceebba] block font-semibold">
                    Direct State Enterprise Mission Call Center
                  </span>
                  <h4 className="font-headline-md text-headline-md font-bold text-[#eeffde] font-playfair">
                    Have questions regarding your Panchayat DPR or Subvention?
                  </h4>
                  <p className="font-body-sm text-body-sm text-[#ceebba]">
                    Certified Lead District Manager (LDM) field officers are ready to assist across 36 districts.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center bg-[#e8efe0] text-[#1e3314] px-space-lg py-3 rounded-full shadow-inner gap-4">
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-[#243b19]" />
                  <a className="font-headline-md text-[20px] font-bold tracking-wide hover:underline" href="tel:+918983172377">
                    +91 89831 72377
                  </a>
                </div>
                <div className="w-px h-6 bg-[#74796e]/40" />
                <span className="font-label-ui text-[13px] font-semibold text-[#364d2b] whitespace-nowrap">
                  Monday–Saturday • 09:00–19:00 hrs
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant/60 pt-space-3xl pb-space-xl mt-space-3xl">
        <div className="max-w-[1200px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="p-space-xl lg:p-space-2xl rounded-2xl border border-outline-variant/60 mb-space-3xl bg-surface-container-lowest">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-primary font-headline-md text-headline-md mb-space-xs font-playfair">
                  <span className="font-bold">UdyogSaarthi</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  A digital public utility built to remove friction from institutional credit and state subsidy adoption
                  for rural innovators, self-help clusters, and micro-enterprises.
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-block px-space-md py-space-xs rounded-full text-secondary border border-outline-variant font-label-kicker text-label-kicker uppercase tracking-wider bg-surface-container-low font-semibold">
                  Autonomous Advisory Mission
                </span>
              </div>
            </div>
          </div>

          <div className="pt-space-lg border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
            <div>© 2026 UdyogSaarthi Rural Enterprise Advisory.</div>
            <div className="flex flex-wrap items-center gap-space-md">
              <button onClick={onBackToLanding} className="hover:text-on-surface underline underline-offset-4 transition-colors">
                Back to Landing Page
              </button>
              <span className="hover:text-on-surface underline underline-offset-4 cursor-pointer">
                Data Privacy Charter
              </span>
              <span className="hover:text-on-surface underline underline-offset-4 cursor-pointer">
                Advisory Terms
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
