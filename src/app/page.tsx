"use client";

import { Navbar } from "@/components/nexo/navbar";
import { Hero } from "@/components/nexo/hero";
import { Selection } from "@/components/nexo/selection";
import { Emulators } from "@/components/nexo/emulators";
import { ExternalResources } from "@/components/nexo/external-resources";
import { GamepadSection } from "@/components/nexo/gamepad-section";
import { HowItWorks } from "@/components/nexo/how-it-works";
import { Footer } from "@/components/nexo/footer";
import { FilePicker } from "@/components/nexo/file-picker";
import { EmulatorModal } from "@/components/nexo/emulator-modal";
import { ErrorBanner } from "@/components/nexo/error-banner";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <FilePicker />
      <Navbar />
      <Hero />
      <Selection />
      <Emulators />
      <GamepadSection />
      <ExternalResources />
      <HowItWorks />
      <Footer />

      {/* Overlay global */}
      <EmulatorModal />
      <ErrorBanner />
    </main>
  );
}


