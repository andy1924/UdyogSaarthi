import Dexie, { type Table } from "dexie";

// Records mirror Phase 1 offline queue shapes.
// Keep fields loose; typed narrowly where LGD block is partition key.
export interface FeasibilityRecord {
  id: string;
  lgdBlock: string;
  lgdDistrict?: string;
  lgdState?: string;
  lat?: number;
  lon?: number;
  businessType?: string;
  score?: number;
  createdAt: number;
  synced?: boolean;
}

export interface FinanceRecord {
  id: string;
  marginAmount: number;
  scheme?: "micro" | "term";
  tpc?: number;
  createdAt: number;
  synced?: boolean;
}

export interface DprRequestRecord {
  id: string;
  feasibilityId?: string;
  financeId?: string;
  status: "queued" | "generated" | "failed";
  createdAt: number;
}

export interface DirectoryRecord {
  id: string;
  name: string;
  category?: string;
  block?: string;
  lat?: number;
  lon?: number;
  synced?: boolean;
}

export class SaarthiDB extends Dexie {
  feasibility!: Table<FeasibilityRecord, string>;
  finance!: Table<FinanceRecord, string>;
  dprRequests!: Table<DprRequestRecord, string>;
  directory!: Table<DirectoryRecord, string>;

  constructor() {
    super("SaarthiDB");
    // v1 per spec — keep index strings stable for offline queries
    this.version(1).stores({
      feasibility: "id,lgdBlock",
      finance: "id",
      dprRequests: "id",
      directory: "id",
    });
  }
}

export const db = new SaarthiDB();
