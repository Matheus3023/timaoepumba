"use client";

import { useState } from "react";

/**
 * Modal de depósito PIX — gera o PIX por DENTRO do app (igual ao JR Club),
 * sem mandar o usuário pro site da casa.
 *
 * Chama POST /api/house/deposit com só o valor; o servidor usa o token da
 * casa (cookie httpOnly) e devolve o EMV copia-e-cola (+ imagem do QR quando
 * a casa manda). Se a casa não mandar imagem, geramos o QR a partir do EMV.
 *
 * Montado só quando aberto (o pai renderiza condicionalmente), então o estado
 * nasce limpo a cada abertura — não sobra o PIX de um depósito anterior.
 */

// Chips rápidos e quais levam o selo "HOT" (igual à tela da casa).
const QUICK_VALUES = [50, 100, 250, 500, 1000];
const HOT_VALUES = new Set([50, 250, 1000]);
const MIN_VALUE = 10;

// Métodos de depósito ativos na casa (payments API). Todos PIX; o rótulo é o
// nome do provedor que aparece no campo "Método de Pagamento".
const METHODS = [
  { slug: "efibank", label: "EFIBANK" },
  { slug: "paag", label: "PAAG" },
  { slug: "triopay", label: "TRIOPAY" },
] as const;

interface DepositResult {
  brCode: string | null;
  qrCodeImage: string | null;
  value: number;
}

export function DepositModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>(METHODS[0].slug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DepositResult | null>(null);
  const [copied, setCopied] = useState(false);

  const value = parseFloat(amount.replace(",", ".")) || 0;
  const valid = value >= MIN_VALUE;
  const methodLabel = METHODS.find((m) => m.slug === method)?.label ?? METHODS[0].label;

  async function generate() {
    if (!valid) {
      setError(`O valor mínimo para depósito é R$ ${MIN_VALUE},00.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/house/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value, method }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok) {
        // Diagnóstico temporário: mostra o motivo/detalhe real vindo da API,
        // para depurar o primeiro depósito. (Trocar por texto amigável depois.)
        const diag = [data?.error, data?.detail].filter(Boolean).join(" — ");
        if (resp.status === 401) {
          setError(`Sessão da casa recusada${diag ? `: ${diag}` : ". Saia e entre de novo."}`);
        } else {
          setError(`Não foi possível gerar o PIX${diag ? `: ${diag}` : ". Tente novamente."}`);
        }
        return;
      }
      setResult({ brCode: data.brCode ?? null, qrCodeImage: data.qrCodeImage ?? null, value: data.value ?? value });
    } catch {
      setError("Falha na comunicação. Verifique sua conexão e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPix() {
    if (!result?.brCode) return;
    try {
      await navigator.clipboard.writeText(result.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado — o usuário ainda vê o código no textarea */
    }
  }

  // Imagem do QR: usa a da casa se for http/data; senão gera a partir do EMV.
  const rasterSrc = (result?.qrCodeImage || "").trim();
  const isRaster = rasterSrc.startsWith("http") || rasterSrc.startsWith("data:image");
  const qrSrc =
    isRaster
      ? rasterSrc
      : result?.brCode
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(result.brCode)}`
        : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {!result ? (
          <>
            {/* Cabeçalho: seta de voltar + título, igual à tela da casa. */}
            <div className="mb-5 flex items-start gap-3">
              <button
                onClick={onClose}
                aria-label="Fechar"
                className="mt-1 text-2xl leading-none opacity-70 hover:opacity-100"
              >
                ←
              </button>
              <div>
                <h2 className="text-xl font-bold">Depositar</h2>
                <p className="text-sm text-text-muted">Adicione saldo à sua conta</p>
              </div>
            </div>

            {/* Abas de método (todas PIX; a selecionada fica destacada). */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.slug}
                  onClick={() => setMethod(m.slug)}
                  aria-pressed={method === m.slug}
                  className={`flex min-h-[56px] items-center justify-center rounded-xl border text-sm font-bold transition ${
                    method === m.slug ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-text-muted"
                  }`}
                >
                  PIX
                </button>
              ))}
            </div>

            <label className="mb-1 block text-sm text-text-muted">Método de Pagamento</label>
            <div className="mb-4 flex min-h-[52px] items-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {methodLabel}
            </div>

            <label className="mb-1 block text-sm font-semibold">Valor a ser depositado:</label>
            <div className="mb-4 flex min-h-[56px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Valor"
                className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-text-muted placeholder:font-normal"
              />
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-text-muted">
                <span aria-hidden>🇧🇷</span> BRL
              </span>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {QUICK_VALUES.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className={`relative min-h-[52px] rounded-xl border text-sm font-bold transition ${
                    value === v ? "border-primary bg-primary/15 text-primary" : "border-white/10 bg-white/5"
                  }`}
                >
                  {HOT_VALUES.has(v) && (
                    <span className="absolute -top-2 right-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
                      HOT
                    </span>
                  )}
                  R$ {v}
                </button>
              ))}
            </div>

            <p className="mb-3 text-xs text-text-muted">Valor mínimo: R$ {MIN_VALUE},00</p>

            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            <button
              onClick={generate}
              disabled={!valid || loading}
              className="btn-primary min-h-[56px] w-full text-base font-bold disabled:opacity-50"
            >
              {loading ? "Gerando PIX…" : "DEPOSITAR"}
            </button>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-sm text-text-muted">
              Depósito de <span className="font-bold text-text">R$ {result.value.toFixed(2).replace(".", ",")}</span>
            </p>
            {qrSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="QR Code do PIX"
                width={220}
                height={220}
                className="mx-auto mb-4 rounded-lg bg-white p-2"
              />
            )}
            <label className="mb-1 block text-left text-xs font-semibold text-text-muted">PIX copia e cola</label>
            <textarea
              readOnly
              value={result.brCode ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              className="mb-3 h-20 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-xs"
            />
            <button onClick={copyPix} className="btn-primary min-h-[48px] w-full font-bold">
              {copied ? "Copiado! ✓" : "Copiar código PIX"}
            </button>
            <button onClick={onClose} className="mt-2 min-h-[44px] w-full text-sm text-text-muted">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
