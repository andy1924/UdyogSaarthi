export type LicenseId = "udyam" | "fssai" | "trade" | "gst";

export interface License {
  id: LicenseId;
  label: string;
  desc: string;
}

export type ChecklistStatus = "done" | "pending";

const LICENSES: Record<LicenseId, License> = {
  udyam: {
    id: "udyam",
    label: "Udyam Registration",
    desc: "MSME registration via Udyam portal — one-time, free.",
  },
  fssai: {
    id: "fssai",
    label: "FSSAI Licence",
    desc: "Food Safety and Standards licence for dairy / food handling.",
  },
  trade: {
    id: "trade",
    label: "Trade Licence",
    desc: "Municipal / Panchayat trade permission for your premises.",
  },
  gst: {
    id: "gst",
    label: "GST Registration",
    desc: "GSTIN required once turnover crosses threshold — retail focus.",
  },
};

/**
 * Return licences required for a business category.
 * dairy → [udyam, fssai, trade]
 * retail → [udyam, trade, gst]
 * default → [udyam, trade]
 */
export function licensesFor(category: string): License[] {
  const c = category.trim().toLowerCase();
  if (c === "dairy") return [LICENSES.udyam, LICENSES.fssai, LICENSES.trade];
  if (c === "retail") return [LICENSES.udyam, LICENSES.trade, LICENSES.gst];
  return [LICENSES.udyam, LICENSES.trade];
}
