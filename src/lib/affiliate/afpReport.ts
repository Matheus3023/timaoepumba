/**
 * Seleção da linha do relatório da casa correspondente a um `afp`.
 *
 * Vive separado do cliente HTTP (que é `server-only` e não pode ser
 * importado por teste) porque é aqui que mora o risco real desta
 * integração: o relatório inclui uma linha com `afp` VAZIO, que agrega todo
 * o tráfego histórico da conta — centenas de registros e FTDs. Casar com ela
 * por engano liberaria o app para qualquer pessoa.
 */

export interface AfpReportRow {
  afp?: string | null;
  visit_count?: number | null;
  registration_count?: number | null;
  ftd_count?: number | null;
}

export interface AfpSummary {
  afp: string;
  registrations: number;
  ftds: number;
  visits: number;
}

/**
 * `null` quando o `afp` procurado é vazio — nunca se procura pela linha
 * agregada. Caso contrário devolve o somatório daquele `afp`, ou zeros
 * quando ele não aparece no relatório (procurou e não achou é diferente de
 * não ter podido procurar).
 */
export function summarizeAfp(rows: AfpReportRow[], afp: string): AfpSummary | null {
  const alvo = afp.trim();
  if (!alvo) return null;

  const encontradas = rows.filter((row) => (row.afp ?? "").trim() === alvo);
  if (encontradas.length === 0) return { afp: alvo, registrations: 0, ftds: 0, visits: 0 };

  // Somamos em vez de pegar a primeira: com `aggregation_period` o mesmo
  // `afp` aparece uma vez por dia, e pegar só a primeira linha perderia o
  // cadastro que aconteceu em outro dia.
  return encontradas.reduce<AfpSummary>(
    (acc, row) => ({
      afp: alvo,
      registrations: acc.registrations + Number(row.registration_count ?? 0),
      ftds: acc.ftds + Number(row.ftd_count ?? 0),
      visits: acc.visits + Number(row.visit_count ?? 0),
    }),
    { afp: alvo, registrations: 0, ftds: 0, visits: 0 }
  );
}
