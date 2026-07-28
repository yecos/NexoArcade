"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GamepadInfo {
  index: number;
  id: string;
  /** Nombre amigable (marca + modelo si es detectable) */
  label: string;
  /** Marca detectada */
  brand: GamepadBrand;
  /** Número de botones físicos */
  buttons: number;
  /** Número de ejes (sticks) */
  axes: number;
  /** Si está produciendo input activo ahora mismo */
  active: boolean;
  /** Qué botones están pulsados ahora mismo (índices) */
  pressedButtons: number[];
  /** Valor de los ejes [-1..1] */
  axesValues: number[];
}

export type GamepadBrand =
  | "xbox"
  | "playstation"
  | "8bitdo"
  | "nintendo"
  | "generic";

export interface GamepadDiagnostics {
  /** La Gamepad API existe en este navegador */
  apiSupported: boolean;
  /** La página está en contexto seguro (HTTPS o localhost) — requisito de la API */
  secureContext: boolean;
  /** Nombre del navegador detectado */
  browser: string;
  /** Sistema operativo detectado */
  platform: string;
  /** Número de veces que se ha forzado un scan */
  scanCount: number;
  /** Última vez que se detectó algo (incluso null) */
  lastScan: number | null;
  /** Si el último scan encontró gamepads */
  lastScanFound: boolean;
}

/**
 * Comprueba si la Gamepad API está disponible.
 */
function checkGamepadSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  return "getGamepads" in navigator;
}

/**
 * Detecta si la página está en un contexto seguro (HTTPS o localhost).
 * La Gamepad API solo funciona en contexto seguro.
 */
function checkSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

/**
 * Detecta el navegador a partir del user agent.
 */
function detectBrowser(): string {
  if (typeof navigator === "undefined") return "desconocido";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/OPR\//.test(ua)) return "Opera";
  return "otro";
}

/**
 * Detecta el sistema operativo.
 */
function detectPlatform(): string {
  if (typeof navigator === "undefined") return "desconocido";
  const platform = (navigator.platform || "").toLowerCase();
  const ua = navigator.userAgent.toLowerCase();
  if (/win/.test(platform) || /windows/.test(ua)) return "Windows";
  if (/mac/.test(platform) || /macintosh/.test(ua)) return "macOS";
  if (/linux/.test(platform) || /linux/.test(ua)) return "Linux";
  if (/android/.test(ua)) return "Android";
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  return "otro";
}

/**
 * Detecta la marca del mando a partir de su ID crudo.
 */
function detectBrand(rawId: string): GamepadBrand {
  const lower = rawId.toLowerCase();
  if (lower.includes("xbox") || lower.includes("x-box") || lower.includes("045e")) {
    return "xbox";
  }
  if (
    lower.includes("dualsense") ||
    lower.includes("dualshock") ||
    lower.includes("sony") ||
    lower.includes("054c")
  ) {
    return "playstation";
  }
  if (lower.includes("8bitdo") || lower.includes("2dc8")) {
    return "8bitdo";
  }
  if (
    lower.includes("nintendo") ||
    lower.includes("switch") ||
    lower.includes("057e")
  ) {
    return "nintendo";
  }
  return "generic";
}

function simplifyName(rawId: string, brand: GamepadBrand): string {
  let name = rawId
    .replace(/Vendor:\s*[0-9a-f]+/gi, "")
    .replace(/Product:\s*[0-9a-f]+/gi, "")
    .replace(/045e|054c|2dc8|057e/gi, "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (brand === "playstation") {
    if (rawId.toLowerCase().includes("dualsense")) name = "DualSense (PS5)";
    else if (rawId.toLowerCase().includes("dualshock")) name = "DualShock 4 (PS4)";
    else name = "Sony Controller";
  } else if (brand === "xbox") {
    name = name.replace(/microsoft/i, "").trim() || "Xbox Controller";
  } else if (brand === "8bitdo") {
    name = "8BitDo " + name.replace(/8bitdo/i, "").trim();
  } else if (brand === "nintendo") {
    if (rawId.toLowerCase().includes("switch")) {
      name = "Switch Pro Controller";
    } else {
      name = "Nintendo " + name.replace(/nintendo/i, "").trim();
    }
  }

  if (name.length > 40) name = name.slice(0, 40) + "…";
  return name || "Mando genérico";
}

/**
 * Lee todos los mandos conectados y devuelve su info simplificada.
 */
function readGamepads(): GamepadInfo[] {
  if (typeof navigator === "undefined" || !("getGamepads" in navigator)) {
    return [];
  }
  let all: (Gamepad | null)[] = [];
  try {
    all = navigator.getGamepads?.() ?? [];
  } catch (err) {
    console.warn("[NEXO] Error al leer gamepads:", err);
    return [];
  }
  const result: GamepadInfo[] = [];
  for (const gp of all) {
    if (!gp) continue;

    const pressedButtons: number[] = [];
    for (let i = 0; i < gp.buttons.length; i++) {
      const b = gp.buttons[i];
      if (b && b.value > 0.1) pressedButtons.push(i);
    }

    const axesValues = Array.from(gp.axes).map((v) =>
      typeof v === "number" ? Math.max(-1, Math.min(1, v)) : 0,
    );

    const brand = detectBrand(gp.id);

    result.push({
      index: gp.index,
      id: gp.id,
      label: simplifyName(gp.id, brand),
      brand,
      buttons: gp.buttons.length,
      axes: gp.axes.length,
      active: pressedButtons.length > 0 || axesValues.some((v) => Math.abs(v) > 0.15),
      pressedButtons,
      axesValues,
    });
  }
  return result;
}

interface UseGamepadOptions {
  enabled?: boolean;
  intervalMs?: number;
  /**
   * Si es true, escucha gestos del usuario (click, keydown) y fuerza
   * una re-lectura de los gamepads. Útil porque algunos navegadores
   * solo exponen gamepads tras un gesto del usuario en la página.
   * Por defecto: true.
   */
  listenForGestures?: boolean;
}

/**
 * Hook que detecta mandos conectados usando la Gamepad API.
 *
 * Estrategia de detección multi-capas:
 * 1. Polling periódico con `navigator.getGamepads()`
 * 2. Eventos `gamepadconnected` / `gamepaddisconnected`
 * 3. Re-lectura tras gestos del usuario (click, tecla) — algunos navegadores
 *    requieren esto para exponer gamepads
 * 4. Función `forceScan()` que el usuario puede invocar manualmente
 *
 * Además expone diagnóstico:
 * - Si la API es soportada
 * - Si el contexto es seguro (HTTPS / localhost)
 * - Navegador y SO detectados
 * - Número de scans realizados
 */
export function useGamepad(options: UseGamepadOptions = {}) {
  const {
    enabled = true,
    intervalMs = 100,
    listenForGestures = true,
  } = options;

  const [supported] = useState<boolean>(checkGamepadSupport);
  const [secureContext] = useState<boolean>(checkSecureContext);
  const [browser] = useState<string>(detectBrowser);
  const [platform] = useState<string>(detectPlatform);
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [lastScan, setLastScan] = useState<number | null>(null);
  const scanCountRef = useRef(0);

  const update = useCallback(() => {
    const result = readGamepads();
    setGamepads(result);
    scanCountRef.current += 1;
    setScanCount(scanCountRef.current);
    setLastScan(Date.now());
    return result;
  }, []);

  const forceScan = useCallback(() => {
    console.info("[NEXO] forceScan() invocado por el usuario");
    const result = update();
    console.info(
      `[NEXO] Scan #${scanCountRef.current}: ${result.length} mando(s) detectado(s)`,
      result.map((g) => ({ id: g.id, label: g.label })),
    );
    // Re-intentar a los 100ms y 500ms por si el mando necesita tiempo
    setTimeout(update, 100);
    setTimeout(update, 500);
    return result;
  }, [update]);

  // Lectura inicial diferida al siguiente tick para no romper
  // la regla react-hooks/set-state-in-effect
  useEffect(() => {
    if (!supported || !enabled) return;

    // Lectura inicial diferida
    const t = window.setTimeout(update, 0);

    // Polling configurable
    let interval: number | undefined;
    if (intervalMs > 0) {
      interval = window.setInterval(update, intervalMs);
    }

    const onConnect = (e: GamepadEvent) => {
      console.info("[NEXO] ✓ gamepadconnected:", e.gamepad?.id);
      update();
      setTimeout(update, 50);
      setTimeout(update, 200);
    };
    const onDisconnect = (e: GamepadEvent) => {
      console.info("[NEXO] ✗ gamepaddisconnected:", e.gamepad?.id);
      update();
    };

    // Re-lectura tras gestos del usuario — clave para Chrome y Edge
    const onUserGesture = () => {
      update();
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    if (listenForGestures) {
      window.addEventListener("click", onUserGesture);
      window.addEventListener("keydown", onUserGesture);
      window.addEventListener("touchstart", onUserGesture, { passive: true });
    }

    // Log de diagnóstico al montar
    console.info("[NEXO] useGamepad iniciado:", {
      apiSupported: supported,
      secureContext: checkSecureContext(),
      browser: detectBrowser(),
      platform: detectPlatform(),
      url: typeof window !== "undefined" ? window.location.href : "",
    });

    return () => {
      window.clearTimeout(t);
      if (interval !== undefined) window.clearInterval(interval);
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
      if (listenForGestures) {
        window.removeEventListener("click", onUserGesture);
        window.removeEventListener("keydown", onUserGesture);
        window.removeEventListener("touchstart", onUserGesture);
      }
    };
  }, [supported, enabled, intervalMs, listenForGestures, update]);

  const diagnostics: GamepadDiagnostics = {
    apiSupported: supported,
    secureContext,
    browser,
    platform,
    scanCount,
    lastScan,
    lastScanFound: gamepads.length > 0,
  };

  return {
    gamepads,
    supported,
    hasConnected: gamepads.length > 0,
    primaryBrand: gamepads[0]?.brand ?? null,
    diagnostics,
    forceScan,
  };
}
