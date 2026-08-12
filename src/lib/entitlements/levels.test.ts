import { afterEach, describe, expect, it, vi } from "vitest";

import { accessLevelSatisfies } from "@/lib/entitlements/levels";

/**
 * O portão lê a variável de ambiente na hora da chamada, então cada teste
 * precisa reimportar o módulo depois de mexer no ambiente.
 */
async function loadGate() {
  vi.resetModules();
  return import("@/lib/entitlements/levels");
}

const ORIGINAL = process.env.ACCESS_GATE_ENABLED;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ACCESS_GATE_ENABLED;
  else process.env.ACCESS_GATE_ENABLED = ORIGINAL;
});

describe("portao de acesso", () => {
  it("barra quem esta abaixo de REGISTERED_USER", async () => {
    delete process.env.ACCESS_GATE_ENABLED;
    const { needsRegistration } = await loadGate();

    expect(needsRegistration("VISITOR")).toBe(true);
    expect(needsRegistration("APP_USER")).toBe(true);
  });

  it("libera quem ja tem cadastro na casa ou mais", async () => {
    delete process.env.ACCESS_GATE_ENABLED;
    const { needsRegistration } = await loadGate();

    expect(needsRegistration("REGISTERED_USER")).toBe(false);
    expect(needsRegistration("FTD_USER")).toBe(false);
    expect(needsRegistration("ADMIN")).toBe(false);
  });

  it("barra usuario sem nivel nenhum, em vez de deixar passar", async () => {
    delete process.env.ACCESS_GATE_ENABLED;
    const { needsRegistration } = await loadGate();

    expect(needsRegistration(null)).toBe(true);
    expect(needsRegistration(undefined)).toBe(true);
  });

  it("barra RESTRICTED_USER mesmo tendo progredido antes", async () => {
    delete process.env.ACCESS_GATE_ENABLED;
    const { needsRegistration } = await loadGate();

    expect(needsRegistration("RESTRICTED_USER")).toBe(true);
  });

  /**
   * O portão depende de um sinal externo (postback da casa). Se ele parar,
   * todo usuário legítimo fica trancado — inclusive quem já se cadastrou.
   * O interruptor tem de abrir o app sem precisar de deploy.
   */
  it("ACCESS_GATE_ENABLED=false abre o app para todo mundo", async () => {
    process.env.ACCESS_GATE_ENABLED = "false";
    const { needsRegistration } = await loadGate();

    expect(needsRegistration("VISITOR")).toBe(false);
    expect(needsRegistration(null)).toBe(false);
  });

  it("fica LIGADO quando a variavel nao existe — ausencia nao desliga regra de negocio", async () => {
    delete process.env.ACCESS_GATE_ENABLED;
    const { accessGateEnabled, needsRegistration } = await loadGate();

    expect(accessGateEnabled()).toBe(true);
    expect(needsRegistration("APP_USER")).toBe(true);
  });

  it("so 'false' desliga; qualquer outro valor mantem ligado", async () => {
    process.env.ACCESS_GATE_ENABLED = "0";
    const { accessGateEnabled } = await loadGate();

    expect(accessGateEnabled()).toBe(true);
  });
});

describe("ranking de nivel de acesso", () => {
  it("RESTRICTED_USER nunca satisfaz nada", () => {
    expect(accessLevelSatisfies("RESTRICTED_USER", "VISITOR")).toBe(false);
    expect(accessLevelSatisfies("RESTRICTED_USER", "REGISTERED_USER")).toBe(false);
  });

  it("FTD_USER satisfaz o exigido para cadastro", () => {
    expect(accessLevelSatisfies("FTD_USER", "REGISTERED_USER")).toBe(true);
  });
});
