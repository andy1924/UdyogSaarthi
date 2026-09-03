/**
 * UdyogSaarthi home — final page assembly (Agent 5, Wave 2).
 *
 * Order: hero (#hero) → LangSwitcher (#langs) → .layout grid
 * [form col: WizardForm (C04–C08 incl. its own AuthCard + #dprBtn) + ApiBaseField
 *  | sticky .col-result: ScoreRing + VerdictCard + FinanceCard + ComplianceList
 *  + PeersList (or empty hint)] → VoiceDock + OfflineBar + Toasts.
 * Header (#siteHead, incl. #sizeBtn) renders from layout.tsx — never duplicated.
 * Hero/CTA/hints via `src/lib/i18n.ts`; shell carries `lang-<code>` for hi/ta/bn
 * line-height (see i18n.css). Result cards keep their own EN strings (deeper
 * i18n stubbed per design-system §11.6).
 *
 * Wiring (adapted to the real Agent 3/4 exports, verified 2026-09-03):
 * - WizardForm { onFeasibility(feas, scheme), onRequestDpr } lifts wizard result
 *   state; page state feeds FinanceCard { scheme }, ComplianceList
 *   { businessCategory, state, district }, PeersList { lat, lon, category },
 *   ScoreRing { score, verdict }, VerdictCard { verdict, category, block,
 *   opportunity } and DprDialog { feasibility, scheme, open, onClose }.
 * - No standalone AuthCard here: WizardForm already composes one (a second
 *   card would duplicate login state). No page-level #dprBtn either:
 *   WizardForm owns #dprBtn in its CTA bar; onRequestDpr opens the dialog.
 */

"use client";

import { useEffect, useState } from "react";
import ApiBaseField from "@/components/ApiBaseField";
import ComplianceList from "@/components/ComplianceList";
import DprDialog from "@/components/DprDialog";
import FinanceCard from "@/components/FinanceCard";
import LangSwitcher from "@/components/LangSwitcher";
import OfflineBar from "@/components/OfflineBar";
import PeersList from "@/components/PeersList";
import ScoreRing from "@/components/ScoreRing";
import Toasts from "@/components/Toasts";
import VerdictCard from "@/components/VerdictCard";
import VoiceDock from "@/components/VoiceDock";
import WizardForm from "@/components/WizardForm";
import { getLang, t, type Lang } from "@/lib/i18n";
import type { FeasibilityOut, SchemeCalculateOut } from "@/lib/api-client";

function swotOpportunity(feas: FeasibilityOut): string {
  const v = feas.swot["opportunity"];
  return typeof v === "string" ? v : "";
}

export default function Home() {
  const [lang, setLangState] = useState<Lang>("en");
  const [feasibility, setFeasibility] = useState<FeasibilityOut | null>(null);
  const [scheme, setScheme] = useState<SchemeCalculateOut | null>(null);
  const [dprOpen, setDprOpen] = useState(false);

  // Hydrate persisted language after mount (avoids SSR/CSR mismatch).
  useEffect(() => {
    setLangState(getLang());
  }, []);

  function handleFeasibility(feas: FeasibilityOut, sch: SchemeCalculateOut) {
    setFeasibility(feas);
    setScheme(sch);
  }

  const populated = feasibility !== null && scheme !== null;

  return (
    <main className={`shell lang-${lang}`}>
      <section id="hero" className="card" aria-label="Introduction">
        <h1>{t(lang, "hero.title")}</h1>
        <p className="muted">{t(lang, "hero.sub")}</p>
      </section>

      <LangSwitcher value={lang} onChange={setLangState} />

      <div className="layout">
        <div className="form-col">
          <WizardForm onFeasibility={handleFeasibility} onRequestDpr={() => setDprOpen(true)} />
          <ApiBaseField />
        </div>

        <div className="col-result">
          <section
            className="card"
            aria-label="Result"
            aria-live="polite"
            aria-busy="false"
          >
            {populated ? (
              <>
                <ScoreRing score={feasibility.density_score} verdict={feasibility.verdict} />
                <VerdictCard
                  verdict={feasibility.verdict}
                  category={feasibility.business_category}
                  block={feasibility.lgd.block}
                  opportunity={swotOpportunity(feasibility)}
                />
                <FinanceCard scheme={scheme} />
                <ComplianceList
                  businessCategory={feasibility.business_category}
                  state={feasibility.lgd.state}
                  district={feasibility.lgd.district}
                />
                <PeersList
                  lat={feasibility.lgd.lat}
                  lon={feasibility.lgd.lon}
                  category={feasibility.business_category}
                />
              </>
            ) : (
              <>
                <h2>
                  {t(lang, "steps.feasibility")} · {t(lang, "steps.finance")}
                </h2>
                <p className="muted">{t(lang, "wizard.hint")}</p>
                <p className="muted">{t(lang, "dpr.hint")}</p>
              </>
            )}
          </section>
          <OfflineBar />
        </div>
      </div>

      <DprDialog
        feasibility={feasibility}
        scheme={scheme}
        open={dprOpen}
        onClose={() => setDprOpen(false)}
      />
      <VoiceDock />
      <Toasts />
    </main>
  );
}
