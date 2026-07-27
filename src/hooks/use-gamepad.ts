"use client";

import { useEffect, useState } from "react";

export interface GamepadInfo {
  index: number;
  id: string;
  /** Nombre amigable (marca + modelo si es detectable) */
  label: string;
  /** Número de botones físicos */
  buttons: number;
  /** Número de ejes (sticks) */
  axes: number;
  /** Si está produciendo input activo ahora mismo */
  active: boolean;
}

/**
 * Comprueba si la Gamepad API está disponible.
 * Se ejecuta solo en cliente; en SSR devuelve false.
 */
function checkGamepadSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  return "getGamepads" in navigator;
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
    const active = Array.from(gp.buttons).some((b) => b && b.value > 0.1);
    result.push({
      index: gp.index,
      id: gp.id,
      label: simplifyName(gp.id),
      buttons: gp.buttons.length,
      axes: gp.axes.length,
      active,
    });
  }
  return result;
}

/**
 * Simplifica el ID crudo del mando (que suele venir con vendor/product IDs
 * y caracteres de control) a un nombre legible.
 */
function simplifyName(rawId: string): string {
  let name = rawId
    .replace(/Vendor:\s*[0-9a-f]+/gi, "")
    .replace(/Product:\s*[0-9a-f]+/gi, "")
    .trim();

  const lower = name.toLowerCase();
  if (lower.includes("xbox") || lower.includes("x-box")) {
    name = name.replace(/microsoft/i, "").trim() || "Xbox Controller";
  } else if (lower.includes("dualsense") || lower.includes("sony")) {
    name = "DualSense (PS5)";
  } else if (lower.includes("dualshock")) {
    name = "DualShock 4 (PS4)";
  } else if (lower.includes("8bitdo") || lower.includes("8bit")) {
    name = "8BitDo " + name.replace(/8bitdo/i, "").trim();
  } else if (lower.includes("nintendo")) {
    name = "Nintendo " + name.replace(/nintendo/i, "").trim();
  } else if (lower.includes("switch")) {
    name = "Switch Pro Controller";
  }

  name = name.replace(/[\u0000-\u001f]/g, "").trim();
  if (name.length > 40) name = name.slice(0, 40) + "…";
  return name || "Mando genérico";
}

/**
 * Hook que detecta mandos conectados usando la Gamepad API.
 *
 * - Escucha los eventos `gamepadconnected` y `gamepaddisconnected`.
 * - Hace polling cada 100ms para leer el estado actual (la Gamepad API
 *   no emite eventos de cambio de botón; hay que leer `navigator.getGamepads()`
 *   en cada frame).
 * - Expone una lista de mandos con un flag `active` que indica si algún
 *   botón o eje está siendo pulsado ahora mismo.
 *
 * Compatible con Xbox, PlayStation, 8BitDo y mandos genéricos. EmulatorJS
 * ya gestiona el mapeo interno; este hook es solo para mostrar feedback
 * visual en la UI.
 */
export function useGamepad() {
  // Inicialización perezosa: solo se ejecuta en cliente en el primer render.
  // En SSR `supported` es false y `gamepads` es [].
  const [supported] = useState<boolean>(checkGamepadSupport);
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);

  useEffect(() => {
    if (!supported) return;

    const update = () => {
      setGamepads(readGamepads());
    };

    // Lectura inicial
    update();

    // Polling a 100ms — suficiente para feedback visual sin saturar React
    const interval = window.setInterval(update, 100);

    const onConnect = () => setTimeout(update, 50);
    const onDisconnect = () => setTimeout(update, 50);

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, [supported]);

  return {
    gamepads,
    supported,
    hasConnected: gamepads.length > 0,
  };
}
