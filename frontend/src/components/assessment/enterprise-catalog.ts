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
export const ENTERPRISE_OPTIONS: EnterpriseOption[] = [
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
export const ENTERPRISE_GROUPS: string[] = [...new Set(ENTERPRISE_OPTIONS.map((e) => e.group))];

