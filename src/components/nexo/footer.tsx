export function Footer() {
  return (
    <footer
      className="border-t border-nexo-border mt-auto"
      aria-labelledby="footer-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="inline-block w-3.5 h-3.5 bg-nexo-green rotate-45"
              />
              <span className="font-semibold text-nexo-cream tracking-tight">
                NEXO ARCADE
              </span>
            </div>
            <p
              id="footer-title"
              className="mt-4 text-nexo-cream text-lg md:text-xl max-w-md leading-snug"
            >
              Una pequeña puerta a mundos abiertos.
            </p>
          </div>

          {/* Enlaces */}
          <nav aria-label="Enlaces del pie de página">
            <p className="nexo-eyebrow !text-[0.62rem]">SECCIONES</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "#juegos", label: "Juegos" },
                { href: "#emuladores", label: "Emuladores" },
                { href: "#recursos", label: "Recursos" },
                { href: "#como-funciona", label: "Cómo funciona" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-nexo-muted hover:text-nexo-cream transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Proyectos */}
          <nav aria-label="Proyectos de código abierto">
            <p className="nexo-eyebrow !text-[0.62rem]">PROYECTOS</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://openarena.ws/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-nexo-muted hover:text-nexo-cream transition-colors inline-flex items-center gap-1.5"
                >
                  OpenArena
                  <span aria-hidden="true" className="text-[0.7em]">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://freedoom.github.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-nexo-muted hover:text-nexo-cream transition-colors inline-flex items-center gap-1.5"
                >
                  Freedoom
                  <span aria-hidden="true" className="text-[0.7em]">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://emulatorjs.org/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-nexo-muted hover:text-nexo-cream transition-colors inline-flex items-center gap-1.5"
                >
                  EmulatorJS
                  <span aria-hidden="true" className="text-[0.7em]">
                    ↗
                  </span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="nexo-divider mt-12" />

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-nexo-muted">
            © 2026 NEXO STUDIO. Todos los derechos reservados.
          </p>
          <p className="text-xs text-nexo-muted max-w-xl leading-relaxed">
            NEXO ARCADE no está afiliado a Nintendo, Sony, id Software,
            OpenArena ni Freedoom. Las marcas pertenecen a sus respectivos
            propietarios.
          </p>
        </div>
      </div>
    </footer>
  );
}
