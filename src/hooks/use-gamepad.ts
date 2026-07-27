"use client";

import { useEffect, useState } from "react";

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

/**
 * Comprueba si la Gamepad API está disponible.
 * Se ejecuta solo en cliente; en SSR devuelve false.
 */
function checkGamepadSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  return "getGamepads" in navigator;
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

/**
 * Simplifica el ID crudo del mando a un nombre legible.
 */
function simplifyName(rawId: string, brand: GamepadBrand): string {
  let name = rawId
    .replace(/Vendor:\s*[0-9a-f]+/gi, "")
    .replace(/Product:\s*[0-9a-f]+/gi, "")
    .replace(/045e|054c|2dc8|057e/gi, "")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Limpieza específica por marca
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
  const all = navigator.getGamepads?.() ?? [];
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
  /**
   * Si es true, el hook solo hace polling mientras sea true.
   * Útil para desactivar el polling cuando el modal está cerrado y ahorrar batería.
   * Por defecto: true (siempre activo).
   */
  enabled?: boolean;
  /**
   * Intervalo de polling en ms. Por defecto 100ms.
   * Si se pasa a 0 se desactiva el polling (solo eventos).
   */
  intervalMs?: number;
}

/**
 * Hook que detecta mandos conectados usando la Gamepad API.
 *
 * - Escucha los eventos `gamepadconnected` y `gamepaddisconnected`.
 * - Hace polling configurable para leer el estado actual (la Gamepad API
 *   no emite eventos de cambio de botón; hay que leer `navigator.getGamepads()`
 *   en cada frame).
 * - Expone una lista de mandos con info detallada:
 *   - marca detectada
 *   - botones pulsados ahora mismo
 *   - valores de ejes
 *   - flag `active`
 *
 * Compatible con Xbox, PlayStation, 8BitDo, Nintendo y mandos genéricos.
 * EmulatorJS ya gestiona el mapeo interno; este hook es solo para mostrar
 * feedback visual en la UI.
 */
export function useGamepad(options: UseGamepadOptions = {}) {
  const { enabled = true, intervalMs = 100 } = options;

  // Inicialización perezosa: solo se ejecuta en cliente en el primer render.
  // En SSR `supported` es false y `gamepads` es [].
  const [supported] = useState<boolean>(checkGamepadSupport);
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);

  useEffect(() => {
    if (!supported || !enabled) return;

    const update = () => {
      setGamepads(readGamepads());
    };

    // Lectura inicial
    update();

    // Polling configurable
    let interval: number | undefined;
    if (intervalMs > 0) {
      interval = window.setInterval(update, intervalMs);
    }

    const onConnect = (e: GamepadEvent) => {
      // Lectura inmediata + re-lectura a los 50ms por si el mando
      // aún no estaba listo del todo
      update();
      setTimeout(update, 50);
      setTimeout(update, 200);
      // Log para depuración
      if (typeof console !== "undefined") {
        console.info("[NEXO] Gamepad conectado:", e.gamepad?.id);
      }
    };
    const onDisconnect = (e: GamepadEvent) => {
      update();
      if (typeof console !== "undefined") {
        console.info("[NEXO] Gamepad desconectado:", e.gamepad?.id);
      }
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, [supported, enabled, intervalMs]);

  return {
    gamepads,
    supported,
    hasConnected: gamepads.length > 0,
    /** Marca del mando principal, si hay uno conectado */
    primaryBrand: gamepads[0]?.brand ?? null,
  };
}
