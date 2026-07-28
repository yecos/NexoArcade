import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Cabeceras necesarias para SharedArrayBuffer (usado por varios núcleos
  // de EmulatorJS). `credentialless` permite cargar recursos cross-origin
  // (como el CDN de EmulatorJS) sin exigir CORP explícito.
  // Si auto-alojas EmulatorJS, puedes cambiar a `require-corp` para máxima
  // seguridad.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
