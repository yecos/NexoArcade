"use client";

import { create } from "zustand";
import type { NexoFilter, NexoSystem } from "@/lib/nexo/emulator-config";
import { detectSystem } from "@/lib/nexo/emulator-config";

export type EmulatorStatus =
  | "idle"
  | "loading-core"
  | "running"
  | "error"
  | "closing";

interface NexoState {
  /** Filtro de consolas seleccionado en la UI */
  activeFilter: NexoFilter;
  setFilter: (f: NexoFilter) => void;

  /** Mensaje de error de formato incompatible (vacío si no hay) */
  error: string;
  setError: (msg: string) => void;
  clearError: () => void;

  /** Indica si el modal del emulador está abierto */
  playing: boolean;
  /** Sistema activo (detectado desde el archivo) */
  activeSystem: NexoSystem | null;
  /** Nombre original del archivo */
  activeFileName: string | null;
  /** Object URL local revocable */
  objectUrl: string | null;
  /** Estado actual del reproductor */
  status: EmulatorStatus;
  /** Mensaje de error del reproductor (CDN, core, etc.) */
  playerError: string | null;

  /**
   * Intenta cargar un archivo elegido por el usuario.
   * Si la extensión es incompatible, establece `error` y NO abre el modal.
   * Si es compatible, crea la Object URL y abre el modal en estado loading-core.
   */
  loadFile: (file: File) => void;

  /** Marca que el core terminó de cargar y el juego está corriendo */
  markRunning: () => void;

  /** Marca error del reproductor (fallo de CDN/WebAssembly) */
  setPlayerError: (msg: string) => void;

  /** Cierra el modal y revoca la Object URL */
  close: () => void;

  /** Limpieza interna tras cerrar (revocar URL, resetear estado) */
  _cleanup: () => void;

  /** Abre el selector de archivos. Lo registra el componente FilePicker. */
  openPicker: () => void;
}

export const useNexoStore = create<NexoState>((set, get) => ({
  activeFilter: "todos",
  setFilter: (f) => set({ activeFilter: f }),

  error: "",
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: "" }),

  playing: false,
  activeSystem: null,
  activeFileName: null,
  objectUrl: null,
  status: "idle",
  playerError: null,

  loadFile: (file) => {
    if (!file) return;

    // Revocar Object URL previa si existía
    const prev = get().objectUrl;
    if (prev) {
      try {
        URL.revokeObjectURL(prev);
      } catch {
        /* noop */
      }
    }

    const system = detectSystem(file.name);
    if (!system) {
      set({
        error:
          "Formato no soportado. NEXO ARCADE admite: .nes, .sfc, .smc, .gb, .gbc, .gba, .nds, .n64, .z64, .v64, .bin, .iso, .chd",
        playing: false,
        activeSystem: null,
        activeFileName: null,
        objectUrl: null,
        status: "idle",
        playerError: null,
      });
      return;
    }

    let url: string;
    try {
      url = URL.createObjectURL(file);
    } catch {
      set({
        error:
          "No se pudo preparar el archivo localmente. Intenta de nuevo con un archivo más pequeño.",
        playing: false,
      });
      return;
    }

    set({
      error: "",
      activeSystem: system,
      activeFileName: file.name,
      objectUrl: url,
      playing: true,
      status: "loading-core",
      playerError: null,
    });
  },

  markRunning: () => set({ status: "running", playerError: null }),

  setPlayerError: (msg) => set({ status: "error", playerError: msg }),

  close: () => {
    set({ status: "closing" });
    // Pequeña espera para que EmulatorJS libere el canvas antes de desmontar
    setTimeout(() => {
      get()._cleanup();
    }, 50);
  },

  _cleanup: () => {
    const prev = get().objectUrl;
    if (prev) {
      try {
        URL.revokeObjectURL(prev);
      } catch {
        /* noop */
      }
    }
    set({
      playing: false,
      activeSystem: null,
      activeFileName: null,
      objectUrl: null,
      status: "idle",
      playerError: null,
    });
  },

  openPicker: () => {},
}));
