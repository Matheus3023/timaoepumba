"use client";

import { useState } from "react";

interface ParamRow {
  key: string;
  value: string;
}

// Nao confirmados — vem so das palavras usadas na doc da Smartico ("Media
// reports, Balance API and Affiliates data"). O prefixo /api/ foi confirmado
// pela doc de registro de afiliados (POST /api/register-aff). Servem de
// ponto de partida pra testar, nao sao paths garantidos.
const PATH_SUGGESTIONS = ["api/affiliates", "api/media-reports", "api/balance", "api/players", "api/reports"];

export function SmarticoDebugClient({ canWrite }: { canWrite: boolean }) {
  const [path, setPath] = useState("api/affiliates");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [authMode, setAuthMode] = useState<"header" | "query">("header");
  const [authKeyName, setAuthKeyName] = useState("api-key");
  const [params, setParams] = useState<ParamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch("/api/admin/smartico-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, method, query, authMode, authKeyName }),
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
      <h2 className="text-lg font-bold text-white">Smartico — teste de API</h2>
      <p className="mt-1 text-sm text-secondary">
        Testa endpoints da API da Smartico (TAP BackOffice) direto do servidor, usando SMARTICO_API_KEY
        configurada na Vercel. A URL base e onde a chave entra (header ou query) ainda nao estao
        confirmadas pra essa conta — ajuste abaixo e teste.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PATH_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setPath(suggestion)}
            className="badge border border-surface-highlighted bg-surface text-body hover:border-primary/50 hover:text-yellow-300"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="card mt-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5 text-sm text-body">
            Path (depois da base URL)
            <input value={path} onChange={(e) => setPath(e.target.value)} className="input font-mono text-sm" />
          </label>
          <label className="flex w-28 flex-col gap-1.5 text-sm text-body">
            Metodo
            <select value={method} onChange={(e) => setMethod(e.target.value as "GET" | "POST")} className="input text-sm">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5 text-sm text-body">
            Onde vai a chave
            <select value={authMode} onChange={(e) => setAuthMode(e.target.value as "header" | "query")} className="input text-sm">
              <option value="header">Header</option>
              <option value="query">Query param</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm text-body">
            Nome do header/param
            <input value={authKeyName} onChange={(e) => setAuthKeyName(e.target.value)} className="input font-mono text-sm" />
          </label>
        </div>

        <div>
          <p className="mb-1.5 text-sm text-body">Parametros (query string)</p>
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

        <button onClick={handleTest} disabled={loading || !canWrite} className="btn-primary self-start px-6">
          {loading ? "Testando..." : canWrite ? "Testar endpoint" : "Somente leitura"}
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
              <span className="text-muted">{String(result.duration_ms)}ms</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(result.body, null, 2))}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              Copiar JSON
            </button>
          </div>
          <p className="mt-2 break-all font-mono text-xs text-muted">{String(result.requested_url)}</p>
          <pre className="mt-3 max-h-[500px] overflow-auto rounded-lg bg-sunken p-3 text-xs text-body">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
