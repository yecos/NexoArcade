"use client";

import { useEffect, useRef } from "react";
import { useNexoStore } from "@/store/nexo-store";
import { NEXO_ACCEPT } from "@/lib/nexo/emulator-config";

/**
 * Input de archivo oculto, único en toda la página.
 * Se registra a sí mismo en el store para que cualquier componente
 * pueda invocar la apertura mediante `useNexoStore.getState().openPicker()`.
 *
 * Esto evita pasar props por varios niveles y mantiene un único input
 * accesible para lectores de pantalla.
 */
export function FilePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadFile = useNexoStore((s) => s.loadFile);

  useEffect(() => {
    // Registrar función de apertura en el store
    useNexoStore.setState({
      openPicker: () => {
        inputRef.current?.click();
      },
    });
    return () => {
      useNexoStore.setState({ openPicker: () => {} });
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="file"
      accept={NEXO_ACCEPT}
      className="sr-only nexo-file-input"
      aria-hidden="true"
      tabIndex={-1}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) loadFile(file);
        // Resetear para permitir re-seleccionar el mismo archivo
        e.target.value = "";
      }}
    />
  );
}
