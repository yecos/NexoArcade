"use client";

import { GamepadPanel } from "@/components/nexo/gamepad-panel";

const COMPATIBLE_CONTROLLERS = [
  { brand: "Xbox", models: "One, Series X|S, Elite", color: "#9BCB3D" },
  { brand: "PlayStation", models: "DualShock 4, DualSense", color: "#7AD7FF" },
  { brand: "8BitDo", models: "Pro 2, SN30, Ultimate", color: "#FF8A3D" },
  { brand: "Nintendo", models: "Switch Pro, Joy-Con", color: "#E371FF" },
  { brand: "Genéricos", models: "XInput / DInput", color: "#A7AA9A" },
];

export function GamepadSection() {
  return (
    <section
      id="mandos"
      className="relative py-20 md:py-28 scroll-mt-16 border-t border-nexo-border"
      aria-labelledby="gamepad-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          {/* Texto */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="nexo-eyebrow">MANDOS</p>
            <h2
              id="gamepad-title"
              className="nexo-display text-nexo-cream mt-4 text-[clamp(2rem,4.5vw,3.25rem)]"
            >
              Conecta.
              <br />
              Juega.
            </h2>
            <p className="mt-5 text-nexo-muted text-base leading-relaxed max-w-md">
              NEXO ARCADE detecta automáticamente cualquier mando compatible
              con la Gamepad API del navegador. Sin drivers, sin
              configuración — conecta y pulsa un botón.
            </p>

            {/* Lista de compatibilidad */}
            <div className="mt-7 space-y-2">
              {COMPATIBLE_CONTROLLERS.map((c) => (
                <div
                  key={c.brand}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-nexo-border bg-nexo-surface/40"
                >
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm text-nexo-cream font-medium">
                    {c.brand}
                  </span>
                  <span className="text-xs text-nexo-muted ml-auto">
                    {c.models}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-md border border-nexo-border bg-nexo-bg/40">
              <p className="text-xs text-nexo-muted leading-relaxed">
                <strong className="text-nexo-cream">Tip:</strong> en algunos
                navegadores necesitas pulsar un botón del mando tras
                conectarlo para que la detección se active. Es una medida de
                seguridad de la Gamepad API.
              </p>
            </div>
          </div>

          {/* Panel de diagnóstico en vivo */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="nexo-eyebrow">DIAGNÓSTICO EN VIVO</p>
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-nexo-muted">
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-nexo-green"
                  style={{
                    animation: "nexo-pulse-green 2s ease-in-out infinite",
                  }}
                />
                Actualización en tiempo real
              </span>
            </div>

            <GamepadPanel variant="full" intervalMs={60} />

            {/* CTA para probar con un juego */}
            <div className="mt-6 p-4 rounded-xl border border-nexo-border bg-nexo-surface/30">
              <p className="text-sm text-nexo-cream font-medium mb-1">
                ¿Tu mando responde?
              </p>
              <p className="text-xs text-nexo-muted leading-relaxed">
                Carga una ROM y juega. El mapeo de botones lo gestiona
                EmulatorJS a través de su menú de opciones (icono de mando
                dentro del reproductor).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
