"use client";

import { useGamepad } from "@/hooks/use-gamepad";

const BRAND_LABELS: Record<string, string> = {
  xbox: "Xbox",
  playstation: "PlayStation",
  "8bitdo": "8BitDo",
  nintendo: "Nintendo",
  generic: "Genérico",
};

const BRAND_COLORS: Record<string, string> = {
  xbox: "#9BCB3D",
  playstation: "#7AD7FF",
  "8bitdo": "#FF8A3D",
  nintendo: "#E371FF",
  generic: "#A7AA9A",
};

interface GamepadPanelProps {
  /** Compacto para mostrar en el modal, completo para la página principal */
  variant?: "compact" | "full";
  /** Polling más rápido cuando el panel está visible */
  intervalMs?: number;
}

/**
 * Panel visual del estado del mando.
 *
 * - Muestra si la Gamepad API es soportada por el navegador.
 * - Lista todos los mandos conectados con su marca.
 * - Visualiza los botones pulsados y los ejes analógicos en tiempo real.
 * - Incluye un botón "Detectar mando" que fuerza la re-lectura.
 * - Muestra diagnóstico completo (navegador, SO, contexto seguro).
 */
export function GamepadPanel({
  variant = "full",
  intervalMs,
}: GamepadPanelProps) {
  const pollInterval = intervalMs ?? (variant === "full" ? 60 : 100);
  const { gamepads, supported, hasConnected, diagnostics, forceScan } = useGamepad({
    intervalMs: pollInterval,
  });

  // No soportado
  if (!supported) {
    if (variant === "compact") return null;
    return (
      <div className="p-5 rounded-xl border border-nexo-border bg-nexo-surface/50">
        <p className="text-sm text-nexo-cream font-medium mb-2">
          Navegador no compatible
        </p>
        <p className="text-sm text-nexo-muted">
          Tu navegador (<code className="text-nexo-cream">{diagnostics.browser}</code>) no soporta la Gamepad API.
          Prueba con Chrome, Firefox o Edge reciente en escritorio o Android.
          Safari tiene soporte limitado.
        </p>
      </div>
    );
  }

  // Contexto inseguro — la API no funcionará
  if (!diagnostics.secureContext && variant === "full") {
    return (
      <div className="p-5 rounded-xl border border-nexo-green/40 bg-nexo-green/5">
        <p className="text-sm text-nexo-cream font-medium mb-2">
          ⚠ Contexto no seguro
        </p>
        <p className="text-sm text-nexo-muted leading-relaxed">
          La Gamepad API solo funciona en contextos seguros (HTTPS o localhost).
          Estás accediendo desde <code className="text-nexo-cream">{typeof window !== "undefined" ? window.location.href : ""}</code>.
        </p>
        <p className="text-xs text-nexo-muted mt-2">
          Si estás en Vercel, deberías estar en HTTPS automáticamente. Si estás
          en local, usa <code className="text-nexo-cream">http://localhost:3000</code> en lugar de una IP.
        </p>
      </div>
    );
  }

  // Sin mandos — versión compacta discreta
  if (!hasConnected && variant === "compact") {
    return (
      <button
        type="button"
        onClick={() => forceScan()}
        className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-md border border-nexo-border text-nexo-muted/60 text-[0.7rem] hover:border-nexo-green hover:text-nexo-green transition-colors"
        title="Pulsa para detectar el mando. Recuerda pulsar un botón del mando después de conectarlo."
      >
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-nexo-muted/40"
        />
        Sin mando · pulsa para detectar
      </button>
    );
  }

  // Sin mandos — versión completa
  if (!hasConnected) {
    return (
      <div className="p-5 rounded-xl border border-dashed border-nexo-border bg-nexo-surface/30 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-nexo-bg/60 flex items-center justify-center mb-3">
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            className="text-nexo-muted"
          >
            <path
              d="M6 11h4M8 9v4M15 10h.01M18 12h.01M2 12c0-3.5 2-5 4-5h12c2 0 4 1.5 4 5s-1 6-3 6-2-2-4-2H7c-2 0-2 2-4 2s-3-2.5-3-6z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-nexo-cream text-sm font-medium">
          Ningún mando detectado
        </p>
        <p className="text-nexo-muted text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
          Conecta un mando por USB o Bluetooth y pulsa cualquier botón del mando.
          Los navegadores requieren este gesto para activar la detección.
        </p>

        {/* Botón forzar detección */}
        <button
          type="button"
          onClick={() => forceScan()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-nexo-green text-nexo-bg text-sm font-medium hover:brightness-105 transition-all"
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
          Detectar mando ahora
        </button>

        {/* Diagnóstico */}
        <div className="mt-5 pt-4 border-t border-nexo-border/50 grid grid-cols-2 gap-2 text-left text-[0.7rem]">
          <DiagnosticRow label="Navegador" value={diagnostics.browser} ok />
          <DiagnosticRow label="Sistema" value={diagnostics.platform} ok />
          <DiagnosticRow
            label="HTTPS"
            value={diagnostics.secureContext ? "Sí" : "No"}
            ok={diagnostics.secureContext}
          />
          <DiagnosticRow
            label="API Gamepad"
            value={diagnostics.apiSupported ? "Disponible" : "No disponible"}
            ok={diagnostics.apiSupported}
          />
          <DiagnosticRow
            label="Scans"
            value={String(diagnostics.scanCount)}
            ok
          />
          <DiagnosticRow
            label="Último scan"
            value={
              diagnostics.lastScan
                ? new Date(diagnostics.lastScan).toLocaleTimeString("es-ES")
                : "—"
            }
            ok
          />
        </div>

        {/* Troubleshooting */}
        <details className="mt-4 text-left">
          <summary className="text-xs text-nexo-muted cursor-pointer hover:text-nexo-cream transition-colors">
            ¿No se detecta? Ver estos puntos →
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs text-nexo-muted leading-relaxed">
            <li>
              • <strong className="text-nexo-cream">Pulsa un botón</strong> del
              mando después de conectarlo. La detección no es automática.
            </li>
            <li>
              • <strong className="text-nexo-cream">Xbox por Bluetooth</strong>:
              en Windows, empareja manteniendo el botón Sync hasta que el LED
              parpadee rápido.
            </li>
            <li>
              • <strong className="text-nexo-cream">DualShock/DualSense</strong>:
              mantén Share + PS hasta que el LED parpadee para emparejar.
            </li>
            <li>
              • <strong className="text-nexo-cream">USB</strong>: usa cable de
              datos (no solo carga). Si no se detecta, prueba otro cable.
            </li>
            <li>
              • <strong className="text-nexo-cream">8BitDo</strong>: cámbialo a
              modo X (XInput) manteniendo X + Start al encenderlo.
            </li>
            <li>
              • Abre la consola del navegador (F12) para ver logs detallados con
              el prefijo <code className="text-nexo-cream">[NEXO]</code>.
            </li>
          </ul>
        </details>
      </div>
    );
  }

  // Compacto: solo el primer mando
  if (variant === "compact") {
    const primary = gamepads[0];
    if (!primary) return null;
    const color = BRAND_COLORS[primary.brand] ?? BRAND_COLORS.generic;
    const brandLabel = BRAND_LABELS[primary.brand] ?? "Mando";

    return (
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 px-2 py-1 rounded-md border text-[0.7rem] transition-all ${
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
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="hidden sm:inline">{brandLabel}</span>
        <span
          className="sm:hidden"
          aria-label={`Mando ${brandLabel} conectado`}
        >
          {brandLabel.slice(0, 2)}
        </span>
      </span>
    );
  }

  // Completo: lista todos los mandos con visualización
  return (
    <div className="space-y-3">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between px-3 py-2 rounded-md border border-nexo-border bg-nexo-surface/40">
        <span className="text-[0.7rem] text-nexo-muted font-mono">
          Scan #{diagnostics.scanCount} · {diagnostics.browser} · {diagnostics.platform}
        </span>
        <button
          type="button"
          onClick={() => forceScan()}
          className="text-[0.7rem] text-nexo-muted hover:text-nexo-green transition-colors inline-flex items-center gap-1"
        >
          <svg
            aria-hidden="true"
            width="11"
            height="11"
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
          Re-escanear
        </button>
      </div>

      {gamepads.map((gp) => (
        <GamepadCard key={gp.index} gamepad={gp} />
      ))}
    </div>
  );
}

function DiagnosticRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded bg-nexo-bg/40 border border-nexo-border">
      <span className="text-nexo-muted">{label}</span>
      <span
        className={`font-mono ${
          ok === false ? "text-nexo-green" : "text-nexo-cream"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function GamepadCard({
  gamepad,
}: {
  gamepad: ReturnType<typeof useGamepad>["gamepads"][number];
}) {
  const color = BRAND_COLORS[gamepad.brand] ?? BRAND_COLORS.generic;
  const brandLabel = BRAND_LABELS[gamepad.brand] ?? "Genérico";

  return (
    <div
      className="p-4 rounded-xl border bg-nexo-surface/50 transition-colors"
      style={{
        borderColor: gamepad.active ? color : "var(--color-nexo-border)",
      }}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className="shrink-0 w-3 h-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: gamepad.active ? `0 0 8px ${color}` : "none",
            }}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-nexo-cream truncate">
              {gamepad.label}
            </p>
            <p className="text-[0.7rem] text-nexo-muted font-mono truncate">
              {brandLabel} · idx {gamepad.index}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.65rem] font-mono ${
            gamepad.active
              ? "bg-nexo-green/15 text-nexo-green border border-nexo-green/40"
              : "bg-nexo-bg/40 text-nexo-muted border border-nexo-border"
          }`}
        >
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: gamepad.active ? "#B8FF3D" : "#A7AA9A",
              animation: gamepad.active
                ? "nexo-pulse-green 1s ease-in-out infinite"
                : "none",
            }}
          />
          {gamepad.active ? "ACTIVO" : "INACTIVO"}
        </span>
      </div>

      {/* ID crudo */}
      <div className="mb-3 px-2 py-1 rounded bg-nexo-bg/60 border border-nexo-border">
        <p className="text-[0.65rem] text-nexo-muted font-mono truncate" title={gamepad.id}>
          {gamepad.id}
        </p>
      </div>

      {/* Especificaciones */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[0.7rem]">
        <div className="px-2 py-1 rounded bg-nexo-bg/40 border border-nexo-border">
          <span className="text-nexo-muted">Botones: </span>
          <span className="text-nexo-cream font-mono">{gamepad.buttons}</span>
        </div>
        <div className="px-2 py-1 rounded bg-nexo-bg/40 border border-nexo-border">
          <span className="text-nexo-muted">Ejes: </span>
          <span className="text-nexo-cream font-mono">{gamepad.axes}</span>
        </div>
      </div>

      {/* Botones pulsados */}
      <div className="mb-3">
        <p className="text-[0.65rem] uppercase tracking-wider text-nexo-muted mb-1.5">
          Botones
        </p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: gamepad.buttons }).map((_, i) => {
            const pressed = gamepad.pressedButtons.includes(i);
            return (
              <span
                key={i}
                className={`w-7 h-7 rounded flex items-center justify-center text-[0.65rem] font-mono transition-all ${
                  pressed
                    ? "bg-nexo-green text-nexo-bg scale-110"
                    : "bg-nexo-bg/40 text-nexo-muted border border-nexo-border"
                }`}
                aria-label={`Botón ${i} ${pressed ? "pulsado" : "no pulsado"}`}
              >
                {i}
              </span>
            );
          })}
        </div>
      </div>

      {/* Ejes analógicos */}
      {gamepad.axesValues.length >= 2 && (
        <div>
          <p className="text-[0.65rem] uppercase tracking-wider text-nexo-muted mb-1.5">
            Sticks analógicos
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from({
              length: Math.floor(gamepad.axesValues.length / 2),
            }).map((_, stickIdx) => {
              const x = gamepad.axesValues[stickIdx * 2] ?? 0;
              const y = gamepad.axesValues[stickIdx * 2 + 1] ?? 0;
              const mag = Math.sqrt(x * x + y * y);
              const isMoving = mag > 0.15;
              return (
                <StickViz
                  key={stickIdx}
                  label={`S${stickIdx + 1}`}
                  x={x}
                  y={y}
                  active={isMoving}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StickViz({
  label,
  x,
  y,
  active,
}: {
  label: string;
  x: number;
  y: number;
  active: boolean;
}) {
  const left = 50 + x * 45;
  const top = 50 + y * 45;
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-12 h-12 rounded-md border bg-nexo-bg/60"
        style={{
          borderColor: active ? "var(--color-nexo-green)" : "var(--color-nexo-border)",
        }}
        aria-label={`Stick ${label}: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`}
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 bottom-0 w-px bg-nexo-border/60 -translate-x-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-0 right-0 h-px bg-nexo-border/60 -translate-y-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            backgroundColor: active ? "var(--color-nexo-green)" : "var(--color-nexo-cream)",
            boxShadow: active ? "0 0 6px var(--color-nexo-green)" : "none",
          }}
        />
      </div>
      <span className="text-[0.6rem] font-mono text-nexo-muted">{label}</span>
    </div>
  );
}
