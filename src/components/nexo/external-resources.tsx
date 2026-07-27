"use client";

interface ExternalResource {
  name: string;
  url: string;
  description: string;
  lang: string;
}

const RESOURCES: ExternalResource[] = [
  {
    name: "Emu-Land",
    url: "https://www.emu-land.net/",
    description:
      "Catálogo extenso de emuladores y ROMs retro. Sitio externo en ruso con opción de traducción. Úsalo solo como referencia para encontrar software y recursos.",
    lang: "RU / EN",
  },
  {
    name: "EmulatorJS",
    url: "https://emulatorjs.org/",
    description:
      "El motor de emulación que ejecuta NEXO ARCADE en tu navegador. Documentación, núcleos y proyecto de código abierto.",
    lang: "EN",
  },
  {
    name: "Homebrew Hub",
    url: "https://hh.beyondbubble.io/",
    description:
      "Colección de juegos homebrew (creados por fans y libres de distribución) para consolas retro. Vía legal para conseguir ROMs jugables.",
    lang: "EN",
  },
  {
    name: "Internet Archive",
    url: "https://archive.org/details/softwarelibrary",
    description:
      "Biblioteca de software clásico preservado, incluyendo juegos y herramientas retro que han sido liberados o donados al dominio público.",
    lang: "EN",
  },
];

export function ExternalResources() {
  return (
    <section
      id="recursos"
      className="relative py-20 md:py-28 scroll-mt-16 border-t border-nexo-border"
      aria-labelledby="resources-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <header className="max-w-3xl">
          <p className="nexo-eyebrow">RECURSOS EXTERNOS</p>
          <h2
            id="resources-title"
            className="nexo-display text-nexo-cream mt-4 text-[clamp(2rem,4.5vw,3.25rem)]"
          >
            Dónde encontrar
            <br />
            juegos legales.
          </h2>
          <p className="mt-5 text-nexo-muted text-base leading-relaxed max-w-2xl">
            Estos enlaces apuntan a sitios externos independientes. NEXO ARCADE
            no controla su contenido ni se responsabiliza de lo que allí se
            publique. Verifica siempre la licencia de cada archivo antes de
            descargarlo.
          </p>
        </header>

        {/* Aviso legal destacado */}
        <div className="mt-8 p-4 md:p-5 rounded-xl border border-nexo-green/30 bg-nexo-green/5 flex items-start gap-3">
          <svg
            aria-hidden="true"
            className="shrink-0 mt-0.5 text-nexo-green"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-sm text-nexo-cream/90 leading-relaxed">
            <strong className="text-nexo-cream">Aviso legal:</strong> NEXO
            ARCADE facilita la ejecución local de archivos que ya poseas
            legalmente. Descargar ROMs de juegos comerciales sin permiso del
            titular de los derechos puede infringir la legislación de tu país.
            Tú eres responsable del uso que hagas de los sitios enlazados.
          </p>
        </div>

        {/* Lista de recursos */}
        <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 list-none">
          {RESOURCES.map((res) => (
            <li key={res.url}>
              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="nexo-card block p-5 group"
                aria-label={`Visitar ${res.name} (se abre en nueva pestaña)`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-nexo-cream text-base tracking-tight">
                        {res.name}
                      </h3>
                      <span className="text-[0.65rem] font-mono text-nexo-muted px-1.5 py-0.5 rounded bg-nexo-bg/50 border border-nexo-border">
                        {res.lang}
                      </span>
                    </div>
                    <p className="mt-2 text-nexo-muted text-sm leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 mt-1 text-nexo-muted group-hover:text-nexo-green transition-colors"
                  >
                    <path
                      d="M4 12L12 4M6 4h6v6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="mt-3 text-[0.7rem] font-mono text-nexo-muted/60 truncate">
                  {res.url}
                </p>
              </a>
            </li>
          ))}
        </ul>

        {/* Nota inferior */}
        <p className="mt-8 text-xs text-nexo-muted max-w-2xl leading-relaxed">
          ¿Conoces otro recurso legal que deberíamos incluir? Puedes proponerlo
          abriendo un issue en el repositorio del proyecto. NEXO ARCADE no
          afilia ni promociona sitios que distribuyan contenido comercial
          protegido sin autorización.
        </p>
      </div>
    </section>
  );
}
