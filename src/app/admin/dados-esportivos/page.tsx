"use client";

import { useState } from "react";

interface ParamRow {
  key: string;
  value: string;
}

const PRESETS: { label: string; path: string; params: ParamRow[] }[] = [
  // Match — confirmed real paths
  { label: "Jogos ao vivo", path: "matches/live", params: [{ key: "sport_id", value: "1" }, { key: "timezone", value: "America/Sao_Paulo" }] },
  { label: "Jogos por dia", path: "matches/list", params: [{ key: "sport_id", value: "1" }, { key: "day", value: "0" }, { key: "timezone", value: "America/Sao_Paulo" }] },
  { label: "Detalhes da partida", path: "matches/details", params: [{ key: "match_id", value: "" }] },
  { label: "Resumo da partida", path: "matches/match/summary", params: [{ key: "match_id", value: "" }] },
  { label: "Estatisticas da partida", path: "matches/match/stats", params: [{ key: "match_id", value: "" }] },
  { label: "Escalacoes", path: "matches/match/lineups", params: [{ key: "match_id", value: "" }] },
  { label: "H2H", path: "matches/h2h", params: [{ key: "match_id", value: "" }] },
  { label: "Classificacao (por partida)", path: "matches/standings", params: [{ key: "match_id", value: "" }, { key: "type", value: "overall" }] },
  { label: "Momentum da partida", path: "matches/momentum", params: [{ key: "match_id", value: "" }] },
  // Team — confirmed real paths
  { label: "Detalhes do time", path: "teams/details", params: [{ key: "team_url", value: "" }] },
  { label: "Resultados do time", path: "teams/results", params: [{ key: "team_id", value: "" }, { key: "page", value: "1" }] },
  { label: "Elenco do time", path: "teams/squad", params: [{ key: "team_url", value: "" }] },
  { label: "Transferencias do time", path: "teams/transfers", params: [{ key: "team_id", value: "" }] },
  // Tournament — confirmed real paths
  { label: "Torneio: IDs", path: "tournaments/ids", params: [{ key: "tournament_url", value: "" }] },
  { label: "Torneio: detalhes", path: "tournaments/details", params: [{ key: "tournament_stage_id", value: "" }] },
  { label: "Torneio: resultados", path: "tournaments/results", params: [{ key: "tournament_template_id", value: "" }, { key: "season_id", value: "" }, { key: "page", value: "1" }] },
  { label: "Torneio: proximos jogos", path: "tournaments/fixtures", params: [{ key: "tournament_template_id", value: "" }, { key: "season_id", value: "" }, { key: "page", value: "1" }] },
  { label: "Torneio: classificacao", path: "tournaments/standings", params: [{ key: "tournament_stage_id", value: "" }, { key: "tournament_id", value: "" }, { key: "type", value: "overall" }] },
  { label: "Torneio: artilheiros", path: "tournaments/standings/top-scorers", params: [{ key: "tournament_id", value: "" }, { key: "tournament_stage_id", value: "" }] },
  // Player — confirmed real paths (nao usado pelo app ainda, mas mapeado)
  { label: "Jogador: detalhes", path: "players/details", params: [{ key: "player_url", value: "" }] },
  // General — confirmed real paths
  { label: "Buscar", path: "general/search", params: [{ key: "q", value: "real madrid" }] },
  { label: "Esportes", path: "general/sports", params: [] },
  { label: "Paises", path: "general/countries", params: [{ key: "sport_id", value: "1" }] },
  { label: "Torneios do pais", path: "general/tournaments", params: [{ key: "country_id", value: "176" }, { key: "sport_id", value: "1" }] },
];

export default function SportsDataDebugPage() {
  const [path, setPath] = useState("matches/live");
  const [params, setParams] = useState<ParamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setPath(preset.path);
    setParams(preset.params);
    setResult(null);
    setError(null);
  }

  function updateParam(index: number, field: "key" | "value", value: string) {
    setParams((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addParam() {
    setParams((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeParam(index: number) {
    setParams((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleTest() {
    setLoading(true);
    setError(null);
    setResult(null);

    const query: Record<string, string> = {};
    for (const p of params) {
      if (p.key) query[p.key] = p.value;
    }

    try {
      const response = await fetch("/api/admin/rapidapi-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, query }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? data.error ?? `Erro HTTP ${response.status}`);
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-white">Dados esportivos — teste de API</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Testa endpoints do Flashscore4/RapidAPI direto do servidor (usa RAPIDAPI_KEY/RAPIDAPI_HOST
        configurados na Vercel). Os marcados &quot;tentativa&quot; sao caminhos ainda nao confirmados —
        se derem 404, me manda o path exato que aparecer na sua conta RapidAPI.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset)}
            className="badge border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-yellow-400/50 hover:text-yellow-300"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="card mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm text-neutral-300">
          Path (depois de /api/flashscore/v2/)
          <input value={path} onChange={(e) => setPath(e.target.value)} className="input font-mono text-sm" />
        </label>

        <div>
          <p className="mb-1.5 text-sm text-neutral-300">Parametros (query string)</p>
          <div className="flex flex-col gap-2">
            {params.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="chave"
                  value={p.key}
                  onChange={(e) => updateParam(i, "key", e.target.value)}
                  className="input flex-1 font-mono text-sm"
                />
                <input
                  placeholder="valor"
                  value={p.value}
                  onChange={(e) => updateParam(i, "value", e.target.value)}
                  className="input flex-1 font-mono text-sm"
                />
                <button onClick={() => removeParam(i)} className="btn-secondary px-3 text-red-400">
                  ✕
                </button>
              </div>
            ))}
            <button onClick={addParam} className="btn-secondary self-start px-4 text-sm">
              + Adicionar parametro
            </button>
          </div>
        </div>

        <button onClick={handleTest} disabled={loading} className="btn-primary self-start px-6">
          {loading ? "Testando..." : "Testar endpoint"}
        </button>
      </div>

      {error && (
        <div className="card mt-4 border-red-500/30 bg-red-500/5">
          <p className="text-sm font-semibold text-red-300">Erro</p>
          <p className="mt-1 text-sm text-red-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="card mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className={`badge ${result.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                {String(result.status)}
              </span>
              <span className="text-neutral-500">{String(result.duration_ms)}ms</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(result.body, null, 2))}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Copiar JSON
            </button>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-neutral-500">{String(result.requested_url)}</p>
          <pre className="mt-3 max-h-[500px] overflow-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-300">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
