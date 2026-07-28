"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNexoStore } from "@/store/nexo-store";
import {
  EJS_LOADER_URL,
  EJS_PATH_TO_DATA,
} from "@/lib/nexo/emulator-config";
import { GamepadPanel } from "@/components/nexo/gamepad-panel";

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
  const [showHelp, setShowHelp] = useState(false);
  const [restartStatus, setRestartStatus] = useState<
    "idle" | "ok" | "failed"
  >("idle");

  /**
   * Reinicia el core de EmulatorJS. Útil cuando el usuario conecta el
   * mando después de que el juego haya cargado — algunos cores no
   * detectan el gamepad a mitad de partida.
   */
  const restartCore = () => {
    const w = window as unknown as {
      EJS_emulator?: {
        restart?: () => void;
        toggleGamepad?: (n: number) => void;
        checkGamepadInputs?: () => void;
        toggleVirtualGamepad?: () => void;
        Module?: {
          _system_restart?: () => void;
          _toggleMainLoop?: () => void;
        };
      };
    };
    const emu = w.EJS_emulator;
    if (!emu) {
      console.warn("[NEXO] EJS_emulator no disponible");
      return;
    }

    let restarted = false;
    // Método 1: restart directo (algunas versiones)
    if (typeof emu.restart === "function") {
      try {
        emu.restart();
        restarted = true;
        console.info("[NEXO] Core reiniciado vía emu.restart()");
      } catch (e) {
        console.warn("[NEXO] Error en emu.restart():", e);
      }
    }
    // Método 2: _system_restart del módulo WASM
    if (!restarted && emu.Module?._system_restart) {
      try {
        emu.Module._system_restart();
        restarted = true;
        console.info("[NEXO] Core reiniciado vía Module._system_restart()");
      } catch (e) {
        console.warn("[NEXO] Error en _system_restart():", e);
      }
    }

    // Si no se pudo reiniciar, al menos forzamos detección de gamepad
    if (!restarted) {
      console.warn(
        "[NEXO] No se encontró método de reinicio. Forzando solo detección de gamepad.",
      );
      setRestartStatus("failed");
      setTimeout(() => setRestartStatus("idle"), 4000);
    } else {
      setRestartStatus("ok");
      setTimeout(() => setRestartStatus("idle"), 2000);
    }

    // Re-forzar detección de gamepad (siempre, también si el reinicio falló)
    setTimeout(() => {
      try {
        if (typeof emu.checkGamepadInputs === "function") {
          emu.checkGamepadInputs();
          console.info("[NEXO] checkGamepadInputs() invocado");
        }
      } catch (e) {
        console.warn("[NEXO] Error en checkGamepadInputs():", e);
      }
      // Re-focar el canvas
      const canvas = document.querySelector<HTMLCanvasElement>(
        "#game canvas",
      );
      if (canvas) {
        canvas.focus();
        console.info("[NEXO] Canvas re-focado tras reinicio");
      }
    }, 500);
  };

  /**
   * Pulsa el botón de "pantalla completa" de EmulatorJS si está disponible.
   */
  const toggleFullscreen = () => {
    const w = window as unknown as {
      EJS_emulator?: { toggleFullscreen?: () => void };
    };
    const emu = w.EJS_emulator;
    if (emu && typeof emu.toggleFullscreen === "function") {
      try {
        emu.toggleFullscreen();
      } catch (e) {
        console.warn("[NEXO] Error al activar pantalla completa:", e);
      }
    }
  };

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
    // Modelo de gamepad por defecto (1 = estándar Xbox/layout)
    w.EJS_gamepadModel = 1;
    // Mostrar el botón de pantalla completa
    w.EJS_fullscreenOnLoaded = false;
    // Color del tema para que combine con NEXO
    w.EJS_color = "#B8FF3D";
    w.EJS_backgroundColor = "#171814";
    w.EJS_onGameStart = () => {
      markRunning();
      // Auto-focus del canvas para que reciba input del teclado y mando
      setTimeout(() => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          "#game canvas",
        );
        if (canvas) {
          canvas.setAttribute("tabindex", "0");
          canvas.focus();
          console.info("[NEXO] Canvas auto-focado para recibir input");
        }
        // Forzar verificación de gamepad en EmulatorJS
        const emu = (w as unknown as {
          EJS_emulator?: {
            checkGamepadInputs?: () => void;
          };
        }).EJS_emulator;
        if (emu && typeof emu.checkGamepadInputs === "function") {
          try {
            emu.checkGamepadInputs();
            console.info("[NEXO] checkGamepadInputs() invocado al iniciar");
          } catch (e) {
            console.warn("[NEXO] Error en checkGamepadInputs:", e);
          }
        }
        // Log de métodos disponibles para depuración
        if (emu) {
          const methods = Object.keys(emu).filter(
            (k) => typeof (emu as unknown as Record<string, unknown>)[k] === "function",
          );
          console.info("[NEXO] Métodos de EJS_emulator disponibles:", methods);
        }
      }, 500);
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
        className="relative w-full max-w-[1100px] h-[calc(100vh-3rem)] max-h-[720px] bg-nexo-bg border border-nexo-border rounded-2xl overflow-hidden flex flex-col"
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
            {/* Indicador de mando — visible en todas las resoluciones */}
            <GamepadPanel variant="compact" intervalMs={80} />
          </div>
          {/* Controles adicionales — solo cuando el juego está corriendo */}
          {status === "running" && (
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-nexo-border text-nexo-muted text-xs hover:border-nexo-green hover:text-nexo-green transition-colors"
                aria-label="Ayuda para configurar el mando"
                title="¿Mando no funciona en el juego?"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <span className="hidden md:inline">Ayuda</span>
              </button>
              <button
                type="button"
                onClick={restartCore}
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors ${
                  restartStatus === "ok"
                    ? "border-nexo-green text-nexo-green bg-nexo-green/10"
                    : restartStatus === "failed"
                      ? "border-nexo-green/50 text-nexo-green/70"
                      : "border-nexo-border text-nexo-muted hover:border-nexo-green hover:text-nexo-green"
                }`}
                aria-label="Reiniciar el núcleo del emulador"
                title="Reiniciar core (útil si conectaste el mando después de abrir el juego)"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden md:inline">
                  {restartStatus === "ok"
                    ? "¡Gamepad listo!"
                    : restartStatus === "failed"
                      ? "Fuerza detección"
                      : "Reiniciar"}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-nexo-border text-nexo-muted text-xs hover:border-nexo-green hover:text-nexo-green transition-colors"
                aria-label="Pantalla completa"
                title="Pantalla completa"
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
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

          {/* Overlay de ayuda para configurar el mando */}
          {showHelp && (
            <HelpOverlay
              onClose={() => setShowHelp(false)}
              onRestart={restartCore}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Overlay con instrucciones paso a paso para que el mando funcione
 * dentro del juego de EmulatorJS.
 */
function HelpOverlay({
  onClose,
  onRestart,
}: {
  onClose: () => void;
  onRestart: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10 bg-nexo-bg/95 backdrop-blur-sm overflow-y-auto nexo-scroll-y"
      role="dialog"
      aria-label="Ayuda para configurar el mando"
    >
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg my-4">
          {/* Cabecera */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="nexo-display text-nexo-cream text-xl">
              ¿Mando no funciona?
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-md border border-nexo-border text-nexo-muted hover:border-nexo-green hover:text-nexo-green transition-colors flex items-center justify-center"
              aria-label="Cerrar la ayuda"
            >
              ×
            </button>
          </div>

          {/* Pasos */}
          <ol className="space-y-3 mb-5">
            <HelpStep
              num={1}
              title="Pulsa un botón del mando"
              body="EmulatorJS solo detecta el mando cuando pulsas un botón físico. Conéctalo y pulsa A, B o cualquier botón."
            />
            <HelpStep
              num={2}
              title="Haz clic en la pantalla del juego"
              body="El canvas necesita foco para recibir input. Haz clic una vez sobre el área del juego."
            />
            <HelpStep
              num={3}
              title="Si conectaste el mando después, reinicia el core"
              body="Algunos núcleos no detectan mandos a mitad de partida. Usa el botón 'Reiniciar' arriba a la derecha."
            />
            <HelpStep
              num={4}
              title="Configura los botones en el menú de EmulatorJS"
              body="Pulsa el icono del engranaje dentro del juego → 'Options' → 'Controls'. Ahí puedes mapear cada botón manualmente si el auto-mapeo no funciona."
            />
          </ol>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <button
              type="button"
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="nexo-btn-primary !py-2 !text-sm flex-1"
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reiniciar core ahora
            </button>
            <button
              type="button"
              onClick={onClose}
              className="nexo-btn-ghost !py-2 !text-sm flex-1"
            >
              Entendido
            </button>
          </div>

          {/* Troubleshooting avanzado */}
          <details className="border border-nexo-border rounded-lg p-3 bg-nexo-surface/40">
            <summary className="text-sm text-nexo-cream cursor-pointer">
              Soluciones avanzadas →
            </summary>
            <ul className="mt-3 space-y-2 text-xs text-nexo-muted leading-relaxed">
              <li>
                <strong className="text-nexo-cream">8BitDo:</strong> debe
                estar en modo X (XInput). Mantén X + Start al encenderlo
                hasta que el LED parpadee rápido.
              </li>
              <li>
                <strong className="text-nexo-cream">DualShock 4:</strong>{" "}
                mantén Share + PS hasta que el LED parpadee para emparejar
                por Bluetooth.
              </li>
              <li>
                <strong className="text-nexo-cream">DualSense:</strong> mantén
                Share + PS hasta que el LED parpadee azul rápido.
              </li>
              <li>
                <strong className="text-nexo-cream">Xbox One/Series:</strong>{" "}
                mantén el botón Sync (arriba) hasta que el LED parpadee.
              </li>
              <li>
                <strong className="text-nexo-cream">USB:</strong> usa cable de
                datos. Si el mando aparece en el SO pero no en el navegador,
                prueba otro cable.
              </li>
              <li>
                <strong className="text-nexo-cream">Mapeo manual:</strong> en
                EmulatorJS → Settings → Input → &quot;Input User 1 Binds&quot; →
                pulsa cada botón para asignarlo.
              </li>
              <li>
                <strong className="text-nexo-cream">Mando 2:</strong> para
                multijugador, en Settings → Input → Input User 2 →
                selecciona el segundo gamepad.
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}

function HelpStep({
  num,
  title,
  body,
}: {
  num: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3 p-3 rounded-lg border border-nexo-border bg-nexo-surface/40">
      <span className="shrink-0 w-7 h-7 rounded-full bg-nexo-green text-nexo-bg flex items-center justify-center text-sm font-semibold font-mono">
        {num}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-nexo-cream">{title}</p>
        <p className="text-xs text-nexo-muted mt-1 leading-relaxed">{body}</p>
      </div>
    </li>
  );
}

