"use client";

import { useEffect, useState } from "react";
import { useNexoStore } from "@/store/nexo-store";

const NAV_LINKS = [
  { href: "#juegos", label: "Juegos" },
  { href: "#emuladores", label: "Emuladores" },
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Cómo funciona" },
];

export function Navbar() {
  const openPicker = useNexoStore((s) => s.openPicker);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "bg-nexo-bg/85 backdrop-blur-md border-b border-nexo-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8 h-16 md:h-18 flex items-center justify-between">
        {/* Marca */}
        <a
          href="#top"
          onClick={(e) => handleNav(e, "#top")}
          className="flex items-center gap-2.5 group"
          aria-label="NEXO ARCADE — inicio"
        >
          <span
            aria-hidden="true"
            className="inline-block w-3.5 h-3.5 bg-nexo-green rotate-45 transition-transform duration-500 group-hover:rotate-[225deg]"
          />
          <span className="font-sans font-semibold text-nexo-cream text-base md:text-lg tracking-tight">
            NEXO ARCADE
          </span>
        </a>

        {/* Enlaces intermedios — ocultos en móvil */}
        <nav
          className="hidden md:flex items-center gap-9"
          aria-label="Navegación principal"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNav(e, link.href)}
              className="text-sm text-nexo-muted hover:text-nexo-cream transition-colors duration-200 relative group py-1"
            >
              {link.label}
              <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-nexo-green scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </a>
          ))}
        </nav>

        {/* CTA */}
        <button
          type="button"
          onClick={openPicker}
          className="nexo-btn-primary !py-2.5 !px-4 md:!px-5 !text-sm"
        >
          Abrir biblioteca
        </button>
      </div>
    </header>
  );
}
