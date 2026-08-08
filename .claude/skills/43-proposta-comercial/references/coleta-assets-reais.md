# Coleta de assets reais do lead

O objetivo é entrar na reunião com a marca REAL do cliente no mockup: logo dele, cor dele, foto dele. Isso é o que separa uma proposta que fecha de um template com cara de IA.

## 1. Puxar o site (mesmo quando bloqueia bot)

Muito site (WordPress atrás de Cloudflare, por exemplo) responde 403 para ferramenta automática, mas libera com User-Agent de navegador. Sempre tente o UA antes de desistir.

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
curl -sS -A "$UA" -L "https://SITE-DO-LEAD" -o home.html -w "%{http_code}\n"
```

Se ainda vier 403, use o navegador real (Claude in Chrome) para abrir a página e ler o conteúdo.

## 2. Extrair o que importa

```bash
# logo e imagens reais (ajuste o dominio)
grep -oiE 'https://SITE/wp-content/uploads/[^"?#]+\.(jpe?g|png|webp)' home.html | sort -u
grep -oiE 'og:image" content="[^"]+"' home.html          # a capa oficial

# cor real da marca (os hex mais frequentes sao a paleta de verdade)
grep -oiE '#[0-9a-f]{6}' home.html | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | head -12

# contato real
grep -oiE 'wa\.me/[0-9]+|api\.whatsapp\.com/send\?phone=[0-9]+|instagram\.com/[A-Za-z0-9_.]+|tel:\+?[0-9]+' home.html | sort -u

# o tom de voz que eles ja usam
grep -oiE '<h[123][^>]*>[^<]{6,120}</h[123]>' home.html | sed -E 's/<[^>]+>//g' | head -20
```

Regra de leitura da paleta: o hex que mais aparece no CSS costuma ser a cor primária da marca. Use ela, não a que você acha bonita. Se a marca é vermelha, o mockup é vermelho.

## 3. Baixar e embutir como data URI

O artefato bloqueia host externo, então toda imagem precisa ser embutida. Baixe variantes compactas (o WordPress gera versões `-480x125`, `-1024x576`, etc) para o arquivo não ficar pesado.

```bash
mkdir -p assets
dl(){ curl -sS -A "$UA" -e "https://SITE-DO-LEAD/" -o "assets/$2" "$1"; }
dl "https://SITE/.../logo-480x125.png" logo.png
dl "https://SITE/.../capa.jpeg"        capa.jpg
# ... equipe, produto, selos de associacao/autorizacao
```

Injete os data URI num template com marcadores, sem colar base64 no chat (usa muito contexto):

```bash
perl -0777 -MMIME::Base64 -e '
  my %m = ( LOGO=>["assets/logo.png","image/png"], CAPA=>["assets/capa.jpg","image/jpeg"] );
  open(my $t,"<","template.html"); local $/; my $h=<$t>; close $t;
  for my $k (keys %m){ open(my $b,"<:raw",$m{$k}[0]); local $/; my $d=<$b>; close $b;
    my $u="data:$m{$k}[1];base64,".encode_base64($d,""); $h=~s/__${k}__/$u/g; }
  open(my $o,">","final.html"); print $o $h; close $o;'
```

## 4. Checklist antes de publicar
- Logo real no topo (inverta com filtro em tema escuro se o logo for escuro).
- Paleta real nos tokens `:root`, tema claro e escuro.
- Pelo menos uma foto real de gente (rosto da equipe mata a cara de IA).
- CTA aponta pro WhatsApp real e Instagram real do lead.
- Zero travessão, zero número inventado.
- Faixa "mockup de proposta, não é o site publicado" no redesenho.
