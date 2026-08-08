import { ImageResponse } from "next/og";

/**
 * Imagem do card de compartilhamento (WhatsApp, Instagram, X, Telegram).
 *
 * O projeto nao tinha nenhuma: colar o link em qualquer conversa gerava um
 * retangulo cinza sem imagem, que e a primeira impressao da marca para quem
 * chega por indicacao. Gerada aqui com o `next/og` que ja vem no Next, sem
 * dependencia nova e sem precisar versionar um JPG de 1200x630 no repo.
 *
 * A rota nao tem parametro dinamico, entao o Next gera o PNG uma vez no
 * build e serve como arquivo estatico (custo zero por compartilhamento).
 *
 * Tipografia: o `next/og` ja embute a Geist Regular, a mesma familia do
 * site. So existe o peso regular, entao a hierarquia aqui e feita por
 * tamanho, cor e espacamento, nunca por negrito.
 */

export const alt = "Timão e Pumba Tips: jogos ao vivo, análises da equipe e comunidade. Conteúdo para maiores de 18 anos.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#080b09";
const YELLOW = "#facc15";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BG,
          padding: "72px 76px",
          position: "relative",
        }}
      >
        {/* Faixas do gramado recem-cortado, quase invisiveis. Da textura de
            campo sem virar "orb com blur" de landing generica. */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              style={{
                width: 150,
                height: "100%",
                backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.035)" : "transparent",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 5, backgroundColor: YELLOW }} />
          <div style={{ fontSize: 24, letterSpacing: 7, color: YELLOW }}>TIMÃO E PUMBA TIPS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", color: "#ffffff", fontSize: 78, lineHeight: 1.12 }}>
          <div style={{ display: "flex" }}>
            <span>Viva o jogo com a&nbsp;</span>
            <span style={{ color: YELLOW }}>torcida,</span>
          </div>
          <div style={{ display: "flex" }}>não sozinho</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 30,
          }}
        >
          <div style={{ fontSize: 27, color: "#a3a3a3" }}>
            Jogos ao vivo · Análises da equipe · Comunidade
          </div>
          <div style={{ fontSize: 23, color: "#737373" }}>18+ · Jogue com responsabilidade</div>
        </div>
      </div>
    ),
    size
  );
}
