"use client";

import { useNexoStore } from "@/store/nexo-store";

const STEPS = [
  {
    num: "01",
    title: "Elige tu archivo",
    body: "Selecciona una ROM que poseas legalmente desde tu dispositivo. Nada se sube a un servidor.",
  },
  {
    num: "02",
    title: "Detectamos la consola",
    body: "El formato nos permite preparar el núcleo correcto automáticamente, sin que tengas que configurar nada.",
  },
  {
    num: "03",
    title: "Empieza a jugar",
    body: "Controles, guardado y pantalla completa, dentro del navegador. Cierra cuando quieras y se libera todo.",
  },
];

export function HowItWorks() {
  const openPicker = useNexoStore((s) => s.openPicker);

  return (
    <section
      id="como-funciona"
      className="relative py-20 md:py-28 scroll-mt-16 border-t border-nexo-border"
      aria-labelledby="how-title"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <header className="max-w-3xl">
          <p className="nexo-eyebrow">CÓMO FUNCIONA</p>
          <h2
            id="how-title"
            className="nexo-display text-nexo-cream mt-4 text-[clamp(2rem,4.5vw,3.5rem)]"
          >
            Sin cuentas. Sin subidas.
            <br />
            Sin vueltas.
          </h2>
        </header>

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 nexo-stagger list-none">
          {STEPS.map((step) => (
            <li
              key={step.num}
              className="relative p-6 border-t border-nexo-border pt-7"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-nexo-green text-sm tracking-widest">
                  {step.num}
                </span>
                <span
                  aria-hidden="true"
                  className="flex-1 h-px bg-gradient-to-r from-nexo-green/60 to-transparent"
                />
              </div>
              <h3 className="nexo-display text-nexo-cream mt-4 text-xl">
                {step.title}
              </h3>
              <p className="mt-3 text-nexo-muted text-sm leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5">
          <button
            type="button"
            onClick={openPicker}
            className="nexo-btn-primary"
          >
            Abrir mi biblioteca
          </button>
          <p className="text-xs text-nexo-muted max-w-md leading-relaxed">
            Usa únicamente copias que poseas legalmente. NEXO ARCADE no
            distribuye ROMs, BIOS ni firmware.
          </p>
        </div>
      </div>
    </section>
  );
}
