export interface OnboardingConfig {
  welcome_title: string;
  welcome_text: string;
  benefits: string[];
  install_button_label: string;
  skip_install_button_label: string;
  notifications_title: string;
  notifications_text: string;
  notifications_button_label: string;
  skip_notifications_button_label: string;
  ios_instructions: string[];
  reprompt_after_first_decline_hours: number;
  reprompt_after_second_decline_days: number;
  reprompt_after_third_decline: boolean;
  install_step_enabled: boolean;
  notifications_step_enabled: boolean;
  onboarding_required: boolean;
}

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  welcome_title: "Sua conta esta pronta!",
  welcome_text:
    "Agora instale o aplicativo para acessar seus jogos, analises e a comunidade com mais rapidez.",
  benefits: [
    "Acesso rapido pela tela inicial",
    "Alertas de novas analises",
    "Notificacoes de partidas",
    "Acesso a comunidade",
    "Atualizacoes importantes da conta",
  ],
  install_button_label: "INSTALAR APLICATIVO",
  skip_install_button_label: "CONTINUAR NO NAVEGADOR",
  notifications_title: "Nao perca nenhuma atualizacao",
  notifications_text:
    "Ative as notificacoes para receber avisos sobre novos conteudos, inicio de partidas, movimentacoes na comunidade e atualizacoes importantes da sua conta.",
  notifications_button_label: "ATIVAR NOTIFICACOES",
  skip_notifications_button_label: "AGORA NAO",
  ios_instructions: [
    "Toque no botao de compartilhar do Safari.",
    'Escolha "Adicionar a Tela de Inicio".',
    'Confirme em "Adicionar".',
    "Abra o aplicativo pela nova imagem criada na tela inicial.",
  ],
  reprompt_after_first_decline_hours: 48,
  reprompt_after_second_decline_days: 7,
  reprompt_after_third_decline: false,
  install_step_enabled: true,
  notifications_step_enabled: true,
  onboarding_required: false,
};
