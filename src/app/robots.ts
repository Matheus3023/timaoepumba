import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Tudo que fica atras de login (app, admin, API, fluxo de recuperacao de
 * senha) sai do indice. Nao adianta o Google gastar rastreio em rota que
 * so devolve redirecionamento para /login, e pagina de recuperacao de
 * senha indexada e ruido puro no resultado de busca da marca.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin-erro",
        "/api",
        "/home",
        "/jogos",
        "/analises",
        "/comunidade",
        "/perfil",
        "/onboarding",
        "/esqueci-senha",
        "/redefinir-senha",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
