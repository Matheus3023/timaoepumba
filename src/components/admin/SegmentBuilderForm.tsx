"use client";

import { useState } from "react";
import { CONDITION_LABEL, CONDITION_VALUE_KIND, type SegmentConditionType } from "@/lib/segments/types";

const ACCESS_LEVELS = ["VISITOR", "APP_USER", "REGISTERED_USER", "FTD_USER", "RESTRICTED_USER", "ADMIN"];
const CONDITION_TYPES = Object.keys(CONDITION_LABEL) as SegmentConditionType[];

interface Row {
  type: SegmentConditionType;
  value: string;
}

export function SegmentBuilderForm({ action }: { action: (formData: FormData) => void }) {
  const [rows, setRows] = useState<Row[]>([{ type: "inactive_days_at_least", value: "7" }]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form action={action} className="card mt-4 flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-200">Novo segmento</h2>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Nome
        <input name="name" required className="input" placeholder="Ex: Cadastro sem FTD ha 7 dias" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">
        Descricao
        <input name="description" className="input" />
      </label>

      <div>
        <p className="mb-1.5 text-sm text-neutral-300">Condicoes (todas precisam ser verdadeiras)</p>
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => {
            const valueKind = CONDITION_VALUE_KIND[row.type];
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  name="condition_type"
                  value={row.type}
                  onChange={(e) => updateRow(i, { type: e.target.value as SegmentConditionType, value: "" })}
                  className="input flex-1 text-sm"
                >
                  {CONDITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CONDITION_LABEL[type]}
                    </option>
                  ))}
                </select>

                {valueKind === "number" && (
                  <input
                    name="condition_value"
                    type="number"
                    min={1}
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                    className="input w-24 text-sm"
                    placeholder="N"
                  />
                )}
                {valueKind === "access_level" && (
                  <select
                    name="condition_value"
                    value={row.value}
                    onChange={(e) => updateRow(i, { value: e.target.value })}
                    className="input w-44 text-sm"
                  >
                    <option value="">selecione</option>
                    {ACCESS_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                )}
                {!valueKind && <input type="hidden" name="condition_value" value="" />}

                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                  className="btn-secondary px-3 text-red-400"
                  disabled={rows.length === 1}
                >
                  ✕
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, { type: "active_within_days", value: "7" }])}
            className="btn-secondary self-start px-4 text-sm"
          >
            + Adicionar condicao
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary mt-2 self-start px-6">
        Salvar segmento
      </button>
    </form>
  );
}
