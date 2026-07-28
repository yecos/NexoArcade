/**
 * NEXO ARCADE — Configuración del emulador
 *
 * Define el mapeo de extensiones de archivo a núcleos de EmulatorJS,
 * los metadatos de cada sistema soportado y las URLs del CDN.
 *
 * Documentación de referencia: https://emulatorjs.org/
 * Cores: https://emulatorjs.org/docs/cores
 */

export type NexoFilter = "todos" | "nintendo" | "portatiles" | "playstation";

export interface NexoSystem {
  /** ID interno, también usado por EmulatorJS como EJS_core */
  core: string;
  /** Nombre completo del sistema */
  name: string;
  /** Nombre abreviado, estilo etiqueta técnica */
  shortName: string;
  /** Extensiones compatibles (sin punto, en minúsculas) */
  extensions: string[];
  /** Filtro al que pertenece */
  filter: Exclude<NexoFilter, "todos">;
  /** Color de acento del icono circular (hex) */
  accent: string;
  /** Descripción corta para tarjetas */
  description: string;
}

/**
 * Sistemas soportados en la primera versión.
 * Los nombres de los cores corresponden a los publicados por EmulatorJS stable.
 */
export const NEXO_SYSTEMS: NexoSystem[] = [
  {
    core: "nes",
    name: "Nintendo Entertainment System",
    shortName: "NES",
    extensions: ["nes"],
    filter: "nintendo",
    accent: "#B8FF3D",
    description: "8 bits. El origen de la era moderna.",
  },
  {
    core: "snes",
    name: "Super Nintendo",
    shortName: "SNES",
    extensions: ["sfc", "smc"],
    filter: "nintendo",
    accent: "#F4F0E6",
    description: "16 bits. La edad de oro de los JRPG.",
  },
  {
    core: "gb",
    name: "Game Boy / Game Boy Color",
    shortName: "GB · GBC",
    extensions: ["gb", "gbc"],
    filter: "portatiles",
    accent: "#FFB938",
    description: "Portátil monocromo y color de Nintendo.",
  },
  {
    core: "gba",
    name: "Game Boy Advance",
    shortName: "GBA",
    extensions: ["gba"],
    filter: "portatiles",
    accent: "#7AD7FF",
    description: "32 bits de bolsillo.",
  },
  {
    core: "nds",
    name: "Nintendo DS",
    shortName: "NDS · opcional",
    extensions: ["nds"],
    filter: "nintendo",
    accent: "#A7AA9A",
    description: "Doble pantalla. Soporte experimental.",
  },
  {
    core: "n64",
    name: "Nintendo 64",
    shortName: "N64",
    extensions: ["n64", "z64", "v64"],
    filter: "nintendo",
    accent: "#E371FF",
    description: "3D en los 90. Requiere un dispositivo potente.",
  },
  {
    core: "psx",
    name: "PlayStation",
    shortName: "PS1",
    extensions: ["bin", "iso", "chd"],
    filter: "playstation",
    accent: "#FF6B6B",
    description:
      "Soporte para .chd recomendado. .cue puede requerir varios archivos.",
  },
];

/** Filtros disponibles en la UI */
export const NEXO_FILTERS: { id: NexoFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "nintendo", label: "Nintendo" },
  { id: "portatiles", label: "Portátiles" },
  { id: "playstation", label: "PlayStation" },
];

/** Construye un mapa inverso extensión → core para detección rápida */
const EXTENSION_MAP: Record<string, string> = NEXO_SYSTEMS.reduce(
  (acc, sys) => {
    for (const ext of sys.extensions) acc[ext] = sys.core;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Normaliza la extensión de un archivo.
 * - Pasa a minúsculas
 * - Elimina el punto inicial si lo trae
 * - Devuelve "" si no hay extensión
 */
export function normalizeExtension(filename: string): string {
  if (!filename) return "";
  const clean = filename.trim().toLowerCase();
  const dot = clean.lastIndexOf(".");
  if (dot === -1 || dot === clean.length - 1) return "";
  return clean.slice(dot + 1);
}

/**
 * Dado el nombre de un archivo, devuelve el núcleo de EmulatorJS
 * correspondiente, o null si la extensión no está soportada.
 */
export function detectCore(filename: string): string | null {
  const ext = normalizeExtension(filename);
  if (!ext) return null;
  return EXTENSION_MAP[ext] ?? null;
}

/** Devuelve el sistema completo a partir de un nombre de archivo */
export function detectSystem(filename: string): NexoSystem | null {
  const core = detectCore(filename);
  if (!core) return null;
  return NEXO_SYSTEMS.find((s) => s.core === core) ?? null;
}

/** Cadena de extensiones para el atributo accept del input */
export const NEXO_ACCEPT =
  ".nes,.sfc,.smc,.gb,.gbc,.gba,.nds,.n64,.z64,.v64,.bin,.iso,.chd";

/**
 * URLs del CDN de EmulatorJS.
 *
 * NOTA DE PRODUCCIÓN: para fijar versiones y mejorar la privacidad,
 * se recomienda auto-alojar estos recursos. La ruta "stable" se usa
 * aquí como referencia; en producción debe sustituirse por una
 * versión concreta.
 */
export const EJS_PATH_TO_DATA = "https://cdn.emulatorjs.org/stable/data/";
export const EJS_LOADER_URL = "https://cdn.emulatorjs.org/stable/data/loader.js";

/** Filtra los sistemas según el filtro activo */
export function filterSystems(filter: NexoFilter): NexoSystem[] {
  if (filter === "todos") return NEXO_SYSTEMS;
  return NEXO_SYSTEMS.filter((s) => s.filter === filter);
}
