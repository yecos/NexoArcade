"use client";

import { useNexoStore } from "@/store/nexo-store";

const CARDS = [
  {
    id: "openarena",
    eyebrow: "ARENA FPS · OPEN SOURCE",
    title: "OpenArena",
    description:
      "Arena shooter libre inspirado en el género clásico de los 90. Comunidad activa y código abierto desde hace más de una década.",
    href: "https://openarena.ws/",
    actionLabel: "Visitar el proyecto",
    accent: "#FF8A3D",
    scene: "warm",
  },
  {
    id: "freedoom",
    eyebrow: "RETRO FPS · LIBRE",
    title: "Freedoom",
    description:
      "Recursos libres compatibles con motores Doom. La integración jugable requiere un motor web separado que aún no está embebido aquí.",
    href: "https://freedoom.github.io/",
    actionLabel: "Visitar el proyecto",
    accent: "#B8FF3D",
    scene: "fortress",
  },
  {
    id: "retro-library",
    eyebrow: "TUS ROMS · LOCAL",
    title: "Retro Library",
    description:
      "Carga tus propias copias legales de ROMs retro. La detección de consola es automática y todo se procesa en tu navegador.",
    href: null,
    actionLabel: "Abrir biblioteca",
    accent: "#7AD7FF",
    scene: "retro",
  },
] as const;

export function Selection() {
  const openPicker = useNexoStore((s) => s.openPicker);

  return (
    <section
      id="juegos"
      className="relative py-20 md:py-28 scroll-mt-16"
      aria-labelledby="selection-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <header className="max-w-3xl">
          <p className="nexo-eyebrow">SELECCIÓN NEXO</p>
          <h2
            id="selection-title"
            className="nexo-display text-nexo-cream mt-4 text-[clamp(2.25rem,5vw,3.75rem)]"
          >
            Entra a otro mundo.
          </h2>
        </header>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5 nexo-stagger">
          {CARDS.map((card) => {
            const isExternal = card.href !== null;
            const Wrapper = isExternal ? "a" : "button";
            const wrapperProps = isExternal
              ? {
                  href: card.href,
                  target: "_blank" as const,
                  rel: "noreferrer" as const,
                }
              : {
                  type: "button" as const,
                  onClick: openPicker,
                };

            return (
              <Wrapper
                key={card.id}
                {...wrapperProps}
                className="nexo-card text-left flex flex-col h-full overflow-hidden group"
                aria-label={`${card.actionLabel}: ${card.title}`}
              >
                {/* Arte abstracto */}
                <CardArt scene={card.scene} accent={card.accent} />

                <div className="p-6 flex flex-col flex-1">
                  <p
                    className="nexo-eyebrow !text-[0.62rem]"
                    style={{ color: card.accent }}
                  >
                    {card.eyebrow}
                  </p>
                  <h3 className="nexo-display text-nexo-cream mt-3 text-2xl">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-nexo-muted text-sm leading-relaxed flex-1">
                    {card.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-nexo-cream text-sm font-medium group-hover:text-nexo-green transition-colors">
                    <span>{card.actionLabel}</span>
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>

        {/* Nota legal */}
        <p className="mt-10 text-xs text-nexo-muted max-w-2xl leading-relaxed">
          OpenArena y Freedoom son proyectos independientes. NEXO ARCADE no está
          afiliado a ellos ni a sus creadores. Los enlaces apuntan a sus sitios
          oficiales para que valides la información desde la fuente original.
        </p>
      </div>
    </section>
  );
}

function CardArt({
  scene,
  accent,
}: {
  scene: "warm" | "fortress" | "retro";
  accent: string;
}) {
  return (
    <div
      className="relative h-44 md:h-48 overflow-hidden border-b border-nexo-border"
      style={{
        background:
          scene === "warm"
            ? "radial-gradient(circle at 70% 30%, #3a2418 0%, #1c1a14 60%, #171814 100%)"
            : scene === "fortress"
              ? "linear-gradient(180deg, #1a1b16 0%, #14150f 100%)"
              : "linear-gradient(135deg, #1d2520 0%, #15191a 100%)",
      }}
    >
      {/* Silueta arquitectónica */}
      {scene === "warm" && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
        >
          <g opacity="0.9">
            <polygon points="40,180 40,90 90,60 140,90 140,180" fill="#0a0a07" />
            <polygon
              points="140,180 140,70 200,40 260,70 260,180"
              fill="#13110a"
            />
            <polygon
              points="260,180 260,100 300,80 320,90 320,180"
              fill="#0a0a07"
            />
            <circle cx="220" cy="55" r="14" fill={accent} opacity="0.9" />
            <circle
              cx="220"
              cy="55"
              r="22"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              opacity="0.4"
            />
          </g>
        </svg>
      )}

      {scene === "fortress" && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
        >
          <g>
            <rect x="60" y="40" width="200" height="140" fill="#0e0f0a" />
            <rect x="60" y="36" width="14" height="8" fill="#0e0f0a" />
            <rect x="98" y="36" width="14" height="8" fill="#0e0f0a" />
            <rect x="136" y="36" width="14" height="8" fill="#0e0f0a" />
            <rect x="174" y="36" width="14" height="8" fill="#0e0f0a" />
            <rect x="212" y="36" width="14" height="8" fill="#0e0f0a" />
            <rect x="246" y="36" width="14" height="8" fill="#0e0f0a" />
            {/* Puerta verde */}
            <path
              d="M140 180 L140 110 Q160 90 180 110 L180 180 Z"
              fill={accent}
              opacity="0.95"
            />
            <path
              d="M140 180 L140 110 Q160 90 180 110 L180 180 Z"
              fill="none"
              stroke={accent}
              strokeWidth="0.5"
              opacity="0.6"
            />
            {/* Glow */}
            <ellipse
              cx="160"
              cy="135"
              rx="40"
              ry="50"
              fill={accent}
              opacity="0.12"
            />
          </g>
        </svg>
      )}

      {scene === "retro" && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
        >
          <g>
            {/* Sol/montaña retrofuturista */}
            <circle cx="160" cy="80" r="40" fill={accent} opacity="0.85" />
            <circle
              cx="160"
              cy="80"
              r="40"
              fill="none"
              stroke={accent}
              strokeWidth="0.5"
              opacity="0.5"
            />
            {/* Líneas del sol */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="120"
                x2="200"
                y1={70 + i * 7}
                y2={70 + i * 7}
                stroke="#171814"
                strokeWidth="2"
              />
            ))}
            {/* Montañas */}
            <polygon points="0,180 60,110 110,180" fill="#0c0d09" />
            <polygon points="80,180 160,90 240,180" fill="#0a0b08" />
            <polygon points="200,180 260,130 320,180" fill="#0c0d09" />
            {/* Rejilla */}
            <g opacity="0.4" stroke={accent} strokeWidth="0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={140 + i * 10}
                  x2="320"
                  y2={140 + i * 10}
                />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const x = 160 + (i - 3.5) * 40;
                return (
                  <line
                    key={`v${i}`}
                    x1={x}
                    y1={140}
                    x2={160 + (i - 3.5) * 80}
                    y2={180}
                  />
                );
              })}
            </g>
          </g>
        </svg>
      )}

      {/* Marco sutil */}
      <div className="absolute inset-0 border border-nexo-border/50 pointer-events-none" />
    </div>
  );
}
