"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 * Genera el HTML completo para el iframe que carga EmulatorJS.
 *
 * Usamos un iframe aislado para:
 * - Evitar el error "Identifier 'EJS_STORAGE' has already been declared"
 *   que ocurre al reabrir un juego (EmulatorJS declara constantes globales
 *   que no se pueden limpiar)
 * - Aislar el estado del emulador del resto de la aplicación
 * - Limpiar completamente la memoria al cerrar (basta con remover el iframe)
 *
 * La comunicación parent ↔ iframe se hace con postMessage:
 * - Parent → iframe: { type: 'restart' }, { type: 'fullscreen' }
 * - Iframe → parent: { type: 'started' }, { type: 'error', message }
 */
function buildEmulatorHTML(params: {
  core: string;
  gameName: string;
  gameUrl: string;
}): string {
  const { core, gameName, gameUrl } = params;
  // JSON.stringify escapa correctamente las comillas y caracteres especiales
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #171814; overflow: hidden; }
  #game { width: 100vw; height: 100vh; }
  /* Ocultar elementos no necesarios de EmulatorJS */
  .ejs_ad_iframe, .ejs_ad_banner { display: none !important; }
</style>
</head>
<body>
<div id="game"></div>
<script>
  // Configuración de EmulatorJS
  window.EJS_player = '#game';
  window.EJS_core = ${JSON.stringify(core)};
  window.EJS_gameName = ${JSON.stringify(gameName)};
  window.EJS_gameUrl = ${JSON.stringify(gameUrl)};
  window.EJS_pathtodata = ${JSON.stringify(EJS_PATH_TO_DATA)};
  window.EJS_startOnLoaded = true;
  window.EJS_gamepad = true;
  window.EJS_gamepadModel = 1;
  window.EJS_color = '#B8FF3D';
  window.EJS_backgroundColor = '#171814';
  window.EJS_onGameStart = function() {
    parent.postMessage({ type: 'started', source: 'nexo-emulator' }, '*');
    // Auto-focar el canvas
    setTimeout(function() {
      var canvas = document.querySelector('#game canvas');
      if (canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
      }
    }, 300);
  };

  // Escuchar comandos del parent
  window.addEventListener('message', function(e) {
    var data = e.data || {};
    if (data.source !== 'nexo-parent') return;
    var emu = window.EJS_emulator;
    if (!emu) return;

    if (data.type === 'restart') {
      try {
        if (typeof emu.restart === 'function') {
          emu.restart();
        } else if (emu.Module && emu.Module._system_restart) {
          emu.Module._system_restart();
        }
      } catch (err) {
        console.warn('[NEXO-iframe] Error al reiniciar:', err);
      }
      // Forzar verificación de gamepad
      setTimeout(function() {
        if (typeof emu.checkGamepadInputs === 'function') {
          emu.checkGamepadInputs();
        }
        var canvas = document.querySelector('#game canvas');
        if (canvas) canvas.focus();
      }, 300);
    }

    if (data.type === 'fullscreen') {
      try {
        if (typeof emu.toggleFullscreen === 'function') {
          emu.toggleFullscreen();
        }
      } catch (err) {
        console.warn('[NEXO-iframe] Error fullscreen:', err);
      }
    }
  });

  // Reportar errores al parent
  window.addEventListener('error', function(e) {
    // Filtrar errores conocidos de EmulatorJS que no son críticos
    var msg = e.message || '';
    if (msg.indexOf('exitFullscreen') !== -1) return;
    if (msg.indexOf("Cannot read properties of undefined") !== -1 && msg.indexOf("'id'") !== -1) return;
    parent.postMessage({
      type: 'error',
      source: 'nexo-emulator',
      message: msg
    }, '*');
  });
</script>
<script src="${EJS_LOADER_URL}"></script>
</body>
</html>`;
}

/**
 * Modal accesible del emulador.
 *
 * Carga EmulatorJS en un iframe aislado que se destruye al cerrar,
 * evitando conflictos de constantes globales (EJS_STORAGE, etc.)
 * y limpiando completamente la memoria.
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
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const supported = useMemo(() => checkBrowserSupport(), []);
  const [showHelp, setShowHelp] = useState(false);
  const [restartStatus, setRestartStatus] = useState<
    "idle" | "ok" | "failed"
  >("idle");

  /**
   * Crea el iframe con EmulatorJS cuando el modal se abre.
   */
  useEffect(() => {
    if (!playing || !activeSystem || !objectUrl) return;

    // Guardar foco anterior
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    if (!supported) {
      setPlayerError(
        "Tu navegador no soporta WebAssembly o WebGL, necesarios para la emulación. Prueba con Chrome, Firefox o Edge reciente.",
      );
      return;
    }

    // Sanitizar el nombre visible
    const safeName = (activeFileName ?? "juego")
      .replace(/\.[^/.]+$/, "")
      .replace(/[^\w\- ]/g, "")
      .slice(0, 60) || "juego";

    // Crear el iframe fresco
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.title = `Reproductor de ${activeSystem.name}`;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.background = "#000";
      iframe.allow = "autoplay; fullscreen; gamepad; cross-origin-isolated";
      iframe.allowFullscreen = true;
      iframe.srcdoc = buildEmulatorHTML({
        core: activeSystem.core,
        gameName: safeName,
        gameUrl: objectUrl,
      });
      containerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      console.info("[NEXO] Iframe de EmulatorJS creado (core:", activeSystem.core, ")");
    }

    // Escuchar mensajes del iframe
    const onMessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.source !== "nexo-emulator") return;
      if (data.type === "started") {
        markRunning();
        console.info("[NEXO] Juego iniciado según iframe");
      }
      if (data.type === "error" && data.message) {
        console.warn("[NEXO] Error del iframe:", data.message);
      }
    };
    window.addEventListener("message", onMessage);

    // Timeout de seguridad
    const safety = window.setTimeout(() => {
      if (useNexoStore.getState().status === "loading-core") {
        setPlayerError(
          "El núcleo está tardando demasiado en cargar. Puede ser un problema de conexión con el CDN o de compatibilidad del navegador.",
        );
      }
    }, 45000);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(safety);
    };
  }, [playing, activeSystem, objectUrl, supported, markRunning, setPlayerError]);

  // Manejo de Escape y trampa de foco
  useEffect(() => {
    if (!playing) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [playing, close]);

  // Limpieza al cerrar: destruir iframe y revocar Object URL
  useEffect(() => {
    if (playing) return;

    // Destruir el iframe — esto limpia TODO el estado de EmulatorJS
    // (constantes globales, WebAssembly, canvas, audio, gamepad polling)
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
    iframeRef.current = null;

    // Restaurar scroll y foco
    document.body.style.overflow = "";
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    }
  }, [playing]);

  /**
   * Envía un comando al iframe de EmulatorJS vía postMessage.
   */
  const sendToIframe = useCallback((type: "restart" | "fullscreen") => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      { source: "nexo-parent", type },
      "*",
    );
  }, []);

  const restartCore = () => {
    sendToIframe("restart");
    setRestartStatus("ok");
    setTimeout(() => setRestartStatus("idle"), 2000);
    console.info("[NEXO] Comando 'restart' enviado al iframe");
  };

  const toggleFullscreen = () => {
    sendToIframe("fullscreen");
  };

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
      <div className="relative w-full max-w-[1100px] h-[calc(100vh-3rem)] max-h-[720px] bg-nexo-bg border border-nexo-border rounded-2xl overflow-hidden flex flex-col">
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
            <GamepadPanel variant="compact" intervalMs={80} />
          </div>
          {/* Controles adicionales */}
          {status === "running" && (
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-nexo-border text-nexo-muted text-xs hover:border-nexo-green hover:text-nexo-green transition-colors"
                aria-label="Ayuda para configurar el mando"
                title="¿Mando no funciona en el juego?"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                    : "border-nexo-border text-nexo-muted hover:border-nexo-green hover:text-nexo-green"
                }`}
                aria-label="Reiniciar el núcleo del emulador"
                title="Reiniciar core (útil si conectaste el mando después de abrir el juego)"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12a9 9 0 11-3.5-7.1M21 4v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden md:inline">
                  {restartStatus === "ok" ? "¡Listo!" : "Reiniciar"}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-nexo-border text-nexo-muted text-xs hover:border-nexo-green hover:text-nexo-green transition-colors"
                aria-label="Pantalla completa"
                title="Pantalla completa"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
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

        {/* Área de juego — el iframe se inyecta aquí */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />

          {/* Estado de carga */}
          {status === "loading-core" && !playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-nexo-bg/80 backdrop-blur-sm pointer-events-none">
              <span
                aria-hidden="true"
                className="w-10 h-10 border-2 border-nexo-border border-t-nexo-green rounded-full"
                style={{ animation: "nexo-spin-slow 0.9s linear infinite" }}
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
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.83 21h16.34a2 2 0 001.72-2.96L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-nexo-cream text-sm max-w-md" aria-live="assertive">
                {playerError}
              </p>
              <button type="button" onClick={close} className="nexo-btn-ghost mt-2">
                Cerrar y volver
              </button>
            </div>
          )}

          {/* Overlay de ayuda */}
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

          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <button
              type="button"
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="nexo-btn-primary !py-2 !text-sm flex-1"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
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
