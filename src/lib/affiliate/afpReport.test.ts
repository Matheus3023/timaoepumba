import { describe, expect, it } from "vitest";

import { summarizeAfp, type AfpReportRow } from "@/lib/affiliate/afpReport";

/**
 * Recorte real de `af2_media_report_af?group_by=afp`, capturado em
 * 12/08/2026. Repare na primeira linha: `afp` vazio agregando o tráfego
 * histórico inteiro da conta — 494 registros e 184 FTDs. Casar com ela
 * liberaria o app para qualquer pessoa que apertasse "já me cadastrei".
 */
const RELATORIO_REAL: AfpReportRow[] = [
  { afp: "", visit_count: 24930, registration_count: 494, ftd_count: 184 },
  { afp: "32670", visit_count: 122, registration_count: 0, ftd_count: 0 },
];

describe("summarizeAfp", () => {
  it("NUNCA casa com a linha de afp vazio, que agrega a conta inteira", () => {
    expect(summarizeAfp(RELATORIO_REAL, "")).toBeNull();
    expect(summarizeAfp(RELATORIO_REAL, "   ")).toBeNull();
  });

  it("acha o afp pedido", () => {
    expect(summarizeAfp(RELATORIO_REAL, "32670")).toEqual({
      afp: "32670",
      registrations: 0,
      ftds: 0,
      visits: 122,
    });
  });

  it("devolve zeros quando o afp nao aparece — procurou e nao achou", () => {
    expect(summarizeAfp(RELATORIO_REAL, "usr_naoexiste")).toEqual({
      afp: "usr_naoexiste",
      registrations: 0,
      ftds: 0,
      visits: 0,
    });
  });

  it("soma quando o mesmo afp aparece em varias linhas (relatorio por dia)", () => {
    const porDia: AfpReportRow[] = [
      { afp: "usr_abc", registration_count: 0, ftd_count: 0, visit_count: 3 },
      { afp: "usr_abc", registration_count: 1, ftd_count: 0, visit_count: 2 },
      { afp: "usr_abc", registration_count: 0, ftd_count: 1, visit_count: 1 },
    ];

    expect(summarizeAfp(porDia, "usr_abc")).toEqual({
      afp: "usr_abc",
      registrations: 1,
      ftds: 1,
      visits: 6,
    });
  });

  it("tolera campos ausentes ou nulos sem virar NaN", () => {
    const sujo: AfpReportRow[] = [{ afp: "usr_x" }, { afp: "usr_x", registration_count: null }];
    expect(summarizeAfp(sujo, "usr_x")).toEqual({ afp: "usr_x", registrations: 0, ftds: 0, visits: 0 });
  });

  it("ignora espaco em volta do afp nos dois lados", () => {
    expect(summarizeAfp([{ afp: " usr_y ", registration_count: 1 }], "usr_y")?.registrations).toBe(1);
  });
});
