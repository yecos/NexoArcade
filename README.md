# NEXO ARCADE

> Una pequeña puerta a mundos abiertos.

Portal web para descubrir proyectos de videojuegos de código abierto y
ejecutar, directamente en el navegador, ROMs retro aportadas legalmente por
el propio usuario. Los archivos se procesan localmente y nunca se suben al
servidor.

## Stack

- **Framework**: Next.js 16 con App Router
- **Lenguaje**: TypeScript 5
- **Estilos**: Tailwind CSS 4 + utilidades CSS custom
- **Tipografía**: Space Grotesk (Google Fonts)
- **Estado**: Zustand
- **Emulador**: EmulatorJS (cargado bajo demanda desde CDN)
- **Mandos**: Gamepad API nativa + `EJS_gamepad = true`

## Estructura

```
src/
  app/
    layout.tsx           # Layout raíz (lang=es, fuentes, metadata)
    page.tsx             # Página principal (Client Component)
    globals.css          # Tokens de diseño y utilidades NEXO
  components/
    nexo/
      navbar.tsx         # Navegación fija con marca + CTA
      hero.tsx           # Hero con portal abstracto CSS
      selection.tsx      # 3 tarjetas: OpenArena, Freedoom, Retro Library
      emulators.tsx      # Filtros + grid de sistemas
      how-it-works.tsx   # Sección de 3 pasos
      footer.tsx         # Pie con enlaces oficiales
      file-picker.tsx    # Input de archivo único
      emulator-modal.tsx # Modal accesible con EmulatorJS + indicador de mando
      error-banner.tsx   # Banda de error accesible (aria-live)
      external-resources.tsx # Enlaces a recursos externos (Emu-Land, etc.)
  hooks/
    use-gamepad.ts      # Hook de detección de mandos (Gamepad API)
  lib/
    nexo/
      emulator-config.ts # Mapeo extensión → core + metadatos
  store/
    nexo-store.ts        # Estado global (Zustand)
public/
  favicon.svg
```

## Desarrollo local

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint     # ESLint
```

> El proyecto también funciona con `npm` o `pnpm` cambiando los comandos.

## Despliegue en Vercel

1. Sube el repositorio a GitHub (o tu proveedor Git preferido).
2. En [vercel.com](https://vercel.com) crea un nuevo proyecto e importa el repo.
3. Vercel detecta automáticamente Next.js. No hace falta configurar nada.
4. Pulsa **Deploy**. La build de producción se ejecuta con `next build`.
5. Recibirás una URL `https://<tu-proyecto>.vercel.app`.

### Notas para producción

- **CDN de EmulatorJS**: la primera versión usa `https://cdn.emulatorjs.org/stable/data/`.
  Para fijar versiones y mejorar privacidad, se recomienda auto-alojar los
  recursos en `public/emulatorjs/<version>/` y actualizar `EJS_PATH_TO_DATA`
  y `EJS_LOADER_URL` en `src/lib/nexo/emulator-config.ts`.
- **CSP**: si activas una Content Security Policy estricta, asegúrate de
  permitir `script-src` y `worker-src` desde el dominio del CDN elegido
  (o desde tu propio origen si auto-alojas).
- **SharedArrayBuffer**: EmulatorJS lo usa para algunos núcleos. Si tu
  hosting lo permite, configura las cabeceras
  `Cross-Origin-Opener-Policy: same-origin` y
  `Cross-Origin-Embedder-Policy: require-corp` en `next.config.ts` o en
  `vercel.json`.

## Sistemas soportados

| Sistema | Core | Extensiones |
|---|---|---|
| Nintendo Entertainment System | `nes` | `.nes` |
| Super Nintendo | `snes` | `.sfc`, `.smc` |
| Game Boy / Game Boy Color | `gb` | `.gb`, `.gbc` |
| Game Boy Advance | `gba` | `.gba` |
| Nintendo DS (opcional) | `nds` | `.nds` |
| Nintendo 64 | `n64` | `.n64`, `.z64`, `.v64` |
| PlayStation | `psx` | `.bin`, `.iso`, `.chd` |

## Soporte para mandos (Gamepad API)

NEXO ARCADE detecta automáticamente cualquier mando conectado por USB o
Bluetooth usando la [Gamepad API](https://developer.mozilla.org/docs/Web/API/Gamepad_API)
del navegador. EmulatorJS activa el mapeo interno con `EJS_gamepad = true`.

Compatibilidad probada:
- Xbox One / Series (USB y Bluetooth)
- DualShock 4 (PS4)
- DualSense (PS5)
- 8BitDo Pro 2 / SN30
- Switch Pro Controller
- Mandos genéricos

Para conectar un mando:
1. Conéctalo por USB o emparéjalo por Bluetooth en tu sistema operativo.
2. Pulsa cualquier botón del mando (los navegadores requieren un gesto del
   usuario para activar la detección).
3. El indicador en la barra superior del modal mostrará el nombre del mando
   y se iluminará en verde al recibir input.

El indicador es solo informativo; el mapeo de botones lo gestiona EmulatorJS
a través de su menú de opciones (icono de mando dentro del reproductor).

## Recursos externos

La sección "Recursos" enlaza a sitios externos donde el usuario puede
encontrar ROMs y emuladores. NEXO ARCADE no controla ni aloja ese contenido.
Los enlaces actuales:

- **Emu-Land** — https://www.emu-land.net/ — Catálogo ruso de emuladores y ROMs.
- **EmulatorJS** — https://emulatorjs.org/ — Motor que usamos.
- **Homebrew Hub** — https://hh.beyondbubble.io/ — Juegos homebrew legales.
- **Internet Archive** — https://archive.org/details/softwarelibrary — Software preservado.

> ⚠️ **Aviso**: descargar ROMs de juegos comerciales sin permiso del titular
> puede ser ilegal en tu jurisdicción. NEXO ARCADE facilita solo la ejecución
> local de archivos que ya poseas legalmente.

## Legal y privacidad

- **No** se suben, almacenan ni distribuyen ROMs del usuario.
- **No** se incluyen BIOS, firmware, claves ni contenido comercial protegido.
- **No** se registran nombres de archivos en analítica.
- Los enlaces a OpenArena y Freedoom apuntan a sus sitios oficiales.
- NEXO ARCADE no está afiliado a Nintendo, Sony, id Software, OpenArena,
  Freedoom ni a EmulatorJS. Las marcas pertenecen a sus respectivos
  propietarios.
- Usa únicamente copias que poseas legalmente.

## Licencias de dependencias

| Dependencia | Licencia |
|---|---|
| Next.js | MIT |
| React | MIT |
| TypeScript | Apache-2.0 |
| Tailwind CSS | MIT |
| Zustand | MIT |
| EmulatorJS | GPL-3.0 (revisar [emulatorjs.org](https://emulatorjs.org/)) |

## Limitaciones conocidas (v1)

- Sin sincronización en la nube de ROMs ni guardados.
- Sin soporte para Nintendo Switch (se deja espacio para investigarlo).
- PlayStation con `.cue` requiere varios archivos; se recomienda `.chd` o
  `.iso` para una primera versión.
- Si un núcleo requiere BIOS, el usuario debe aportar su copia legal.
- EmulatorJS se carga desde el CDN oficial; para producción se recomienda
  auto-alojar una versión concreta.
