"use client";

import { useNexoStore } from "@/store/nexo-store";

export function Hero() {
  const openPicker = useNexoStore((s) => s.openPicker);

  const explore = () => {
    const el = document.querySelector("#juegos");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="top"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Glow de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-nexo-green/8 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        {/* Columna izquierda — texto */}
        <div className="nexo-stagger">
          <p className="nexo-eyebrow">CÓDIGO ABIERTO · SIN INSTALAR</p>

          <h1
            id="hero-title"
            className="nexo-display text-nexo-cream mt-6 text-[clamp(3rem,8vw,6.5rem)]"
          >
            Juega
            <br />
            sin{" "}
            <span className="text-nexo-green">instalar</span>
            <span className="text-nexo-green" aria-hidden="true">
              .
            </span>
          </h1>

          <p className="mt-7 text-nexo-muted text-base md:text-lg max-w-xl leading-relaxed">
            Juegos libres y clásicos retro, directamente en tu navegador. Tus
            archivos nunca salen de tu dispositivo.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={openPicker}
              className="nexo-btn-primary"
            >
              Cargar un juego
            </button>
            <button
              type="button"
              onClick={explore}
              className="nexo-btn-ghost"
            >
              Explorar catálogo
            </button>
          </div>

          {/* Indicadores técnicos */}
          <dl className="mt-12 grid grid-cols-3 gap-4 max-w-md">
            {[
              { value: "0", label: "Subidas" },
              { value: "7+", label: "Consolas" },
              { value: "100%", label: "Local" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border-l border-nexo-border pl-3"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-nexo-cream text-2xl md:text-3xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
                <dd className="nexo-eyebrow mt-1 !text-[0.62rem]">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Columna derecha — portal abstracto */}
        <div
          aria-hidden="true"
          className="relative h-[320px] sm:h-[420px] lg:h-[520px] order-first lg:order-last"
        >
          <PortalScene />
        </div>
      </div>
    </section>
  );
}

/**
 * Escena abstracta arquitectónica: portal/monolito oscuro
 * iluminado por un disco verde eléctrico. Construido solo con CSS.
 */
function PortalScene() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Rejilla de fondo */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-nexo-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-nexo-border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          animation: "nexo-grid-drift 12s linear infinite",
        }}
      />

      {/* Monolito / portal */}
      <div className="relative w-full max-w-[380px] aspect-[3/4] flex items-center justify-center">
        {/* Cuerpo del monolito */}
        <div
          className="absolute inset-x-8 inset-y-4 rounded-[2px] border border-nexo-border bg-gradient-to-b from-nexo-surface to-nexo-bg"
          style={{
            boxShadow:
              "0 0 80px -20px rgba(184, 255, 61, 0.25), inset 0 0 40px rgba(0,0,0,0.6)",
          }}
        />

        {/* Disco verde */}
        <div className="relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full bg-nexo-green flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 60px 12px rgba(184, 255, 61, 0.45)",
              animation: "nexo-pulse-green 4s ease-in-out infinite",
            }}
          />
          <div className="absolute inset-3 rounded-full bg-nexo-bg/40 backdrop-blur-sm" />
          <div className="relative w-2 h-2 rounded-full bg-nexo-bg" />
        </div>

        {/* Línea horizontal de referencia */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-nexo-green/40 to-transparent" />

        {/* Marco decorativo */}
        <div className="absolute -inset-2 border border-nexo-border/50 rounded-[6px]" />

        {/* Esquinas técnicas */}
        {[
          "top-0 left-0",
          "top-0 right-0",
          "bottom-0 left-0",
          "bottom-0 right-0",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={`absolute ${pos} w-3 h-3 border-nexo-green/70`}
            style={{
              borderTopWidth: pos.includes("top") ? "1px" : 0,
              borderBottomWidth: pos.includes("bottom") ? "1px" : 0,
              borderLeftWidth: pos.includes("left") ? "1px" : 0,
              borderRightWidth: pos.includes("right") ? "1px" : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
