"use client";

import { useEffect } from "react";
import { useNexoStore } from "@/store/nexo-store";

/**
 * Banda de error accesible (aria-live).
 * Se muestra cuando el store tiene un mensaje de error de formato.
 * Auto-desaparece a los 6 segundos.
 */
export function ErrorBanner() {
  const error = useNexoStore((s) => s.error);
  const clearError = useNexoStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => clearError(), 6000);
    return () => window.clearTimeout(t);
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div className="bg-nexo-surface border border-nexo-green/40 rounded-xl p-4 shadow-2xl nexo-fade-up">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="shrink-0 mt-0.5 w-5 h-5 rounded-full border border-nexo-green/60 flex items-center justify-center text-nexo-green text-xs"
          >
            !
          </span>
          <div className="flex-1">
            <p className="text-nexo-cream text-sm font-medium leading-snug">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 text-nexo-muted hover:text-nexo-cream transition-colors"
            aria-label="Cerrar el mensaje de error"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
