/**
 * Tema do sportsbook da casa, pintado com as cores do app.
 *
 * O widget da Altenar aceita um preset de tema (objeto plano de tokens),
 * aplicado por `setFigmaParserTheming` no init. Sem isso ele monta com a
 * identidade da casa (vinho/branco) e parece que o usuário "saiu" para outro
 * app. Com o preset, ele veste o preto e o amarelo do Timão e Pumba e vira
 * parte da tela.
 *
 * As cores saem de `globals.css` — o mesmo `--background`, `--surface`,
 * `--primary` que o resto do app usa. Manter em um lugar só evita o widget
 * "quase" combinar e denunciar que é enxerto.
 */

const VOID = "#080b09"; // --background
const SURFACE = "#0f1512"; // painel sobre o fundo
const SURFACE_ELEVATED = "#1a2420"; // linha ativa / hover
const RULE = "#26302b"; // borda
const INK = "#f2f7f4"; // titulo, numero
const BODY = "#b9c9bf"; // corpo
const DIM = "#7b9086"; // rotulo, metadado
const PRIMARY = "#facc15"; // --primary, o amarelo do app
const ON_PRIMARY = "#111111"; // texto sobre o amarelo

/**
 * Preset de tema. As chaves são os tokens que o SDK reconhece (extraídos do
 * core do widget); cobrimos os que pintam o grosso da tela. O que não
 * cobrirmos herda do tema escuro base, que já é próximo do nosso.
 */
export const HOUSE_THEME_PRESET: Record<string, string> = {
  bodyBackground: VOID,
  background: SURFACE,
  backgroundHeader: VOID,
  backgroundActive: SURFACE_ELEVATED,
  cellBackground: SURFACE,
  headerBackground: VOID,
  borderColor: RULE,
  contentBorderColor: RULE,

  accentColor: PRIMARY,
  activeColor: PRIMARY,
  clickableColor: PRIMARY,
  basicColor: BODY,
  oddColor: INK,

  competitorColor: INK,
  competitorText: INK,
  categoryColor: DIM,
  championshipColor: DIM,
  dateColor: DIM,
  descriptionColor: BODY,

  continueButtonText: ON_PRIMARY,
};

/**
 * Config de tema para o `init` do SDK.
 *
 * `themeName: "dark"` para herdar o esquema escuro como base — sobre ele o
 * preset sobrescreve os tokens que importam. Começar do "light" faria o
 * texto claro cair sobre fundo claro nos cantos que o preset não cobre.
 */
export function houseThemeConfig(): { themeName: string; theme: Record<string, unknown> } {
  return {
    themeName: "dark",
    theme: { preset: HOUSE_THEME_PRESET },
  };
}
