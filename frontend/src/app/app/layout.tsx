import type { ReactNode } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { AppRail } from "@/components/shell/AppRail";
import { VoiceBar } from "@/components/voice/VoiceBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-paper)]">
      <TopBar />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AppRail />
        {/* Main — bottom padding reserves space for VoiceBar + AppRail on mobile */}
        <main className="flex-1 px-4 pb-[148px] pt-6 sm:px-6 lg:px-8 lg:pb-[88px]">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <VoiceBar />
    </div>
  );
}
