import { defineConfig } from "vitest/config";

/**
 * Testes unitários do motor Funil (PRD sec. 52). Só cobrem código puro em
 * src/lib/funil — nada aqui toca rede, Supabase ou React, por isso o
 * ambiente é `node` e não jsdom.
 *
 * `.mts` de propósito: o package.json não é `type: module`, e um
 * vitest.config.ts seria carregado como CommonJS.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
