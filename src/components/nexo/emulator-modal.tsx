"use client";

import { useEffect, useMemo, useRef } from "react";
import { useNexoStore } from "@/store/nexo-store";
import {
  EJS_LOADER_URL,
  EJS_PATH_TO_DATA,
} from "@/lib/nexo/emulator-config";
import { useGamepad } from "@/hooks/use-gamepad";

/**
 * Comprueba si el navegador soporta las capacidades necesarias para
 * la emulación (WebAssembly + WebGL). Se ejecuta solo en cliente.
 */
function checkBrowserSupport(): boolean {
  if (typeof window === "undefined") return false;
  const hasWasm =
    typeof WebAssembly === "object" &&
    typeof WebAssembly.instantiate === "function";
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return hasWasm && !!gl;
  } catch {
    return false;
  }
}

/**
 * Modal accesible del emulador.
 *
 * Carga EmulatorJS bajo demanda, solo cuando el usuario elige un archivo.
 * Maneja:
 * - Cierre con Escape y botón "Cerrar ×"
 * - Trampa de foco y retorno al elemento que abrió el modal
 * - Bloqueo de scroll del cuerpo
 * - Estado de carga del core
 * - Detección de fallos (WebAssembly / WebGL / SharedArrayBuffer)
 * - Limpieza del script, contenedor y Object URL al cerrar
 *
 * EmulatorJS expone su configuración a través del objeto global `window.EJS_*`.
 * Una vez que el loader.js se ejecuta, busca esas variables y monta el
 * reproductor dentro del selector indicado por `EJS_player`.
 */
export function EmulatorModal() {
  const {
    playing,
    activeSystem,
    activeFileName,
    objectUrl,
    status,
    playerError,
    close,
    markRunning,
    setPlayerError,
  } = useNexoStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const gameDivRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const supported = useMemo(() => checkBrowserSupport(), []);
  const { gamepads, supported: gamepadSupported, hasConnected } = useGamepad();

  // Cargar EmulatorJS cuando se abre el modal
  useEffect(() => {
    if (!playing || !activeSystem || !objectUrl) return;

    // Guardar foco anterior
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Bloquear scroll
    document.body.style.overflow = "hidden";

    // Verificar compatibilidad
    if (!supported) {
      setPlayerError(
        "Tu navegador no soporta WebAssembly o WebGL, necesarios para la emulación. Prueba con Chrome, Firefox o Edge reciente.",
      );
      return;
    }

    // Limpiar configuración previa (por si se abrió y cerró antes)
    const w = window as unknown as Record<string, unknown>;
    delete w.EJS_player;
    delete w.EJS_core;
    delete w.EJS_gameName;
    delete w.EJS_gameUrl;
    delete w.EJS_pathtodata;
    delete w.EJS_startOnLoaded;
    delete w.EJS_onGameStart;
    delete w.EJS_gamepad;
    delete w.EJS_VirtualGamepadSettings;

    // Sanitizar el nombre visible: quitar extensión
    const safeName = (activeFileName ?? "juego")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^\w\- ]/g, "")
      .slice(0, 60) || "juego";

    // Configurar EmulatorJS
    w.EJS_player = "#game";
    w.EJS_core = activeSystem.core;
    w.EJS_gameName = safeName;
    w.EJS_gameUrl = objectUrl;
    w.EJS_pathtodata = EJS_PATH_TO_DATA;
    w.EJS_startOnLoaded = true;
    // Activar soporte nativo de mandos (Gamepad API) en EmulatorJS
    w.EJS_gamepad = true;
    w.EJS_onGameStart = () => {
      markRunning();
    };

    // Crear el div #game dentro del contenedor
    if (gameDivRef.current) {
      gameDivRef.current.innerHTML = "";
      const game = document.createElement("div");
      game.id = "game";
      game.style.width = "100%";
      game.style.height = "100%";
      gameDivRef.current.appendChild(game);
    }

    // Cargar el script del loader
    const script = document.createElement("script");
    script.src = EJS_LOADER_URL;
    script.async = true;
    script.onerror = () => {
      setPlayerError(
        "No se pudo cargar el runtime del emulador desde el CDN. Verifica tu conexión e inténtalo de nuevo.",
      );
    };
    scriptRef.current = script;
    document.body.appendChild(script);

    // Timeout de seguridad: si en 30s no hemos pasado a "running", mostramos error recuperable
    const safety = window.setTimeout(() => {
      if (useNexoStore.getState().status === "loading-core") {
        setPlayerError(
          "El núcleo está tardando demasiado en cargar. Puede ser un problema de conexión con el CDN o de compatibilidad del navegador.",
        );
      }
    }, 30000);

    return () => {
      window.clearTimeout(safety);
    };
  }, [playing, activeSystem, objectUrl, supported]);

  // Manejo de Escape y trampa de foco
  useEffect(() => {
    if (!playing) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && containerRef.current && closeBtnRef.current) {
        // Trampa simple: solo el botón de cerrar es enfocable
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        // Filtrar los que están realmente visibles/enfocables
        const visible = Array.from(focusable).filter(
          (el) => !el.hasAttribute("disabled"),
        );
        if (visible.length === 0) {
          e.preventDefault();
          closeBtnRef.current.focus();
          return;
        }
        const first = visible[0];
        const last = visible[visible.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey);

    // Foco inicial al botón de cerrar (tras montar)
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [playing, close]);

  // Limpieza al cerrar: revocar URL, eliminar script, restaurar foco
  useEffect(() => {
    if (playing) return;

    // Eliminar script del loader
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    // Vaciar contenedor de juego
    if (gameDivRef.current) {
      gameDivRef.current.innerHTML = "";
    }
    // Limpiar variables globales de EmulatorJS
    const w = window as unknown as Record<string, unknown>;
    [
      "EJS_player",
      "EJS_core",
      "EJS_gameName",
      "EJS_gameUrl",
      "EJS_pathtodata",
      "EJS_startOnLoaded",
      "EJS_onGameStart",
      "EJS_gamepad",
      "EJS_VirtualGamepadSettings",
      "EJS_emulator",
    ].forEach((k) => {
      try {
        delete w[k];
      } catch {
        /* noop */
      }
    });

    // Restaurar scroll y foco
    document.body.style.overflow = "";
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    }
  }, [playing]);

  if (!playing) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reproductor de ${activeSystem?.name ?? "juego"}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={() => close()}
        aria-hidden="true"
      />

      {/* Contenedor del juego */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[1100px] max-h-[720px] aspect-[1100/720] bg-nexo-bg border border-nexo-border rounded-2xl overflow-hidden flex flex-col"
      >
        {/* Barra superior */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-nexo-border bg-nexo-surface/50 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="shrink-0 w-2 h-2 rounded-full bg-nexo-green"
              style={{
                animation:
                  status === "running"
                    ? "none"
                    : "nexo-pulse-green 1.5s ease-in-out infinite",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-nexo-muted truncate">
                {activeSystem?.name ?? "Cargando"}
              </p>
              <p className="text-[0.7rem] text-nexo-muted/70 truncate font-mono">
                {activeFileName}
              </p>
            </div>
            {/* Indicador de mando */}
            <GamepadIndicator
              supported={gamepadSupported}
              hasConnected={hasConnected}
              gamepads={gamepads}
            />
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-nexo-border text-nexo-cream text-sm hover:border-nexo-green hover:text-nexo-green transition-colors"
            aria-label="Cerrar el reproductor"
          >
            <span aria-hidden="true">×</span>
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>

        {/* Área de juego */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Contenedor donde EmulatorJS monta el reproductor */}
          <div ref={gameDivRef} className="w-full h-full" />

          {/* Estado de carga */}
          {status === "loading-core" && !playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-nexo-bg/80 backdrop-blur-sm pointer-events-none">
              <span
                aria-hidden="true"
                className="w-10 h-10 border-2 border-nexo-border border-t-nexo-green rounded-full"
                style={{
                  animation: "nexo-spin-slow 0.9s linear infinite",
                }}
              />
              <p className="text-nexo-cream text-sm" aria-live="polite">
                Cargando el núcleo de {activeSystem?.shortName}…
              </p>
              <p className="text-nexo-muted text-xs max-w-xs text-center">
                Se descarga el runtime bajo demanda. La próxima vez será más
                rápido gracias a la caché del navegador.
              </p>
            </div>
          )}

          {/* Error recuperable */}
          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-nexo-bg/95 p-6 text-center">
              <div className="w-12 h-12 rounded-full border border-nexo-border flex items-center justify-center text-nexo-green">
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className="text-nexo-cream text-sm max-w-md"
                aria-live="assertive"
              >
                {playerError}
              </p>
              <button
                type="button"
                onClick={close}
                className="nexo-btn-ghost mt-2"
              >
                Cerrar y volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Indicador visual del estado del mando en la barra superior del modal.
 *
 * Estados:
 * - No soportado: oculto
 * - Soportado, sin mando: badge gris "Sin mando"
 * - Soportado, con mando inactivo: badge verde con nombre del mando
 * - Soportado, con mando activo: badge verde brillante + icono de gamepad
 */
function GamepadIndicator({
  supported,
  hasConnected,
  gamepads,
}: {
  supported: boolean;
  hasConnected: boolean;
  gamepads: ReturnType<typeof useGamepad>["gamepads"];
}) {
  if (!supported) return null;

  if (!hasConnected) {
    return (
      <span
        className="hidden md:inline-flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-md border border-nexo-border text-nexo-muted/60 text-[0.7rem]"
        title="Conecta un mando por Bluetooth o USB y pulsa un botón"
      >
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-nexo-muted/40" />
        Sin mando
      </span>
    );
  }

  const primary = gamepads[0];
  if (!primary) return null;

  return (
    <span
      className={`hidden md:inline-flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-md border text-[0.7rem] transition-all ${
        primary.active
          ? "border-nexo-green text-nexo-green bg-nexo-green/10"
          : "border-nexo-border text-nexo-muted"
      }`}
      title={`${primary.label} · ${primary.buttons} botones · ${primary.axes} ejes`}
      aria-live="polite"
    >
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        className={primary.active ? "animate-pulse" : ""}
      >
        <path
          d="M6 11h4M8 9v4M15 10h.01M18 12h.01M2 12c0-3.5 2-5 4-5h12c2 0 4 1.5 4 5s-1 6-3 6-2-2-4-2H7c-2 0-2 2-4 2s-3-2.5-3-6z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="max-w-[80px] truncate">{primary.label}</span>
    </span>
  );
}

