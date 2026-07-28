"use client";

import { useNexoStore } from "@/store/nexo-store";
import {
  NEXO_FILTERS,
  filterSystems,
  type NexoFilter,
  type NexoSystem,
} from "@/lib/nexo/emulator-config";

export function Emulators() {
  const activeFilter = useNexoStore((s) => s.activeFilter);
  const setFilter = useNexoStore((s) => s.setFilter);
  const openPicker = useNexoStore((s) => s.openPicker);
  const systems = filterSystems(activeFilter);

  return (
    <section
      id="emuladores"
      className="relative py-20 md:py-28 scroll-mt-16 border-t border-nexo-border"
      aria-labelledby="emulators-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-16">
          {/* Texto */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="nexo-eyebrow">EMULADORES</p>
            <h2
              id="emulators-title"
              className="nexo-display text-nexo-cream mt-4 text-[clamp(2rem,4.5vw,3.25rem)]"
            >
              Tu archivo.
              <br />
              Tu partida.
            </h2>
            <p className="mt-5 text-nexo-muted text-base leading-relaxed max-w-md">
              El emulador se ejecuta en esta pestaña. NEXO no almacena ni
              distribuye juegos comerciales.
            </p>

            <div className="mt-7 inline-flex items-center gap-2 px-3 py-2 rounded-md border border-nexo-border bg-nexo-surface/50">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-nexo-green"
                style={{
                  animation: "nexo-pulse-green 2s ease-in-out infinite",
                }}
              />
              <span className="text-xs text-nexo-muted tracking-wide">
                Procesamiento 100% local
              </span>
            </div>
          </div>

          {/* Filtros + grid */}
          <div>
            {/* Filtros — píldoras con scroll horizontal en móvil */}
            <div
              role="tablist"
              aria-label="Filtrar sistemas por fabricante"
              className="flex gap-2 overflow-x-auto nexo-scroll-x pb-2 -mx-1 px-1"
            >
              {NEXO_FILTERS.map((filter) => {
                const active = activeFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    role="tab"
                    aria-selected={active}
                    data-active={active}
                    onClick={() => setFilter(filter.id as NexoFilter)}
                    className="nexo-pill shrink-0 whitespace-nowrap"
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Grid de sistemas */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {systems.map((sys) => (
                <SystemCard key={sys.core} system={sys} onClick={openPicker} />
              ))}
            </div>

            {/* Nota de compatibilidad */}
            <p className="mt-6 text-xs text-nexo-muted leading-relaxed max-w-2xl">
              Algunos formatos de PlayStation requieren varios archivos (por
              ejemplo, <code className="text-nexo-cream">.cue</code> con su{" "}
              <code className="text-nexo-cream">.bin</code>). Para una primera
              versión, se recomienda usar{" "}
              <code className="text-nexo-cream">.chd</code> o{" "}
              <code className="text-nexo-cream">.iso</code>. Las BIOS no se
              incluyen; si un núcleo las requiere, deberás aportar tu copia
              legal y mantenerla localmente.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SystemCard({
  system,
  onClick,
}: {
  system: NexoSystem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="nexo-card text-left p-5 flex items-start gap-4 w-full"
      aria-label={`Cargar una ROM de ${system.name}`}
    >
      {/* Icono circular de color */}
      <span
        aria-hidden="true"
        className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative"
        style={{
          backgroundColor: `${system.accent}20`,
          border: `1px solid ${system.accent}80`,
        }}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: system.accent,
            boxShadow: `0 0 12px ${system.accent}`,
          }}
        />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold text-nexo-cream text-base tracking-tight">
            {system.name}
          </h3>
        </div>
        <p className="nexo-eyebrow !text-[0.62rem] mt-1">
          CORE · {system.shortName}
        </p>
        <p className="mt-2 text-nexo-muted text-xs leading-relaxed">
          {system.description}
        </p>

        {/* Extensiones */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {system.extensions.map((ext) => (
            <span
              key={ext}
              className="text-[0.7rem] font-mono text-nexo-muted px-1.5 py-0.5 rounded bg-nexo-bg/50 border border-nexo-border"
            >
              .{ext}
            </span>
          ))}
        </div>
      </div>

      {/* Flecha */}
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 mt-1 text-nexo-muted"
      >
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
