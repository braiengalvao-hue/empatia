# Manual do usuário — Empatia (Jardim de Sentimentos)

Guia para participar do jardim colaborativo: registrar sua plantação, explorar o mapa e avaliar o trabalho de outras pessoas.

---

## O que é o Empatia?

O **Jardim de Sentimentos** é um espaço web onde cada participante:

1. Informa **nome** e **frase**.
2. Escolhe um **lugar no mapa** e faz um **desenho único** (sua “plantação do amor”).
3. **Explora** as plantações de outras pessoas.
4. **Avalia** frases e desenhos (nota de 1 a 5).
5. Consulta os **rankings** da comunidade (top 5).

Cada pessoa contribui **uma vez** por sessão. O desenho não pode ser refeito depois de salvo.

---

## Antes de começar

- Use um **navegador atualizado** (Chrome, Firefox, Edge ou Safari).
- É necessário **JavaScript** e suporte a **Canvas** habilitados.
- O sistema roda em servidor local (ex.: XAMPP) ou em ambiente configurado pela equipe.
- Na primeira instalação, o administrador deve executar `setup_db.php` no navegador.

---

## Passo a passo

### 1. Entrada no jardim

1. Abra a página inicial do projeto (ex.: `http://localhost/2025/empatia/`).
2. Preencha:
   - **Nome** — até 30 caracteres.
   - **Frase** — até 250 caracteres (sua mensagem para a comunidade).
3. Clique em **Entrar no jardim**.

Você será levado à página principal do jardim.

---

### 2. Compromisso de participação

Na primeira visita ao jardim (neste navegador), aparece um **modal de compromisso**.

- **Aceitar** — você pode usar o mapa, desenhar e avaliar.
- **Recusar** — você volta à página de entrada.

A escolha fica salva no navegador (`sessionStorage`) até limpar os dados do site.

---

### 3. Conhecer a tela do jardim

| Área | Função |
|------|--------|
| **HUD (barra superior)** | Mostra seu nome e frase; botões de ações |
| **Dica abaixo do HUD** | Orienta o que fazer no mapa |
| **Mapa grande** | Área rolável onde ficam as plantações |
| **Pétalas caindo** | Efeito visual ambiente (automático) |

**Botões no HUD:**

| Botão | O que faz |
|-------|-----------|
| **Rankings** | Abre o painel com os 5 melhores em frase, desenho e geral |
| **Chover Sentimentos** | Liga/desliga chuva visual apenas no seu navegador |

---

### 4. Criar sua plantação (uma única vez)

1. **Role o mapa** até encontrar um espaço livre (sem flor de outra pessoa).
2. **Clique** no ponto desejado.
3. Abre o **modal de desenho** com um canvas.
4. O modo **tela cheia** abre automaticamente (ideal para **mesa digitalizadora e caneta**).
5. Desenhe apenas na área branca com **caneta ou mouse** (toque com dedo é ignorado para não mover a tela).
6. Use **Sair da tela cheia** se quiser janela menor; **Limpar** refaz o desenho antes de salvar.
7. Clique em **Salvar plantação**.

Após salvar:

- Sua flor aparece no mapa como um **coração** colorido.
- O desenho fica **bloqueado** — não é possível plantar de novo nesta sessão.
- Outras pessoas poderão avaliar sua frase e seu desenho.

**Dicas:**

- Escolha um lugar com calma; não há como mover a plantação depois.
- Se o salvamento falhar, verifique a conexão ou peça ajuda ao administrador (limite de tamanho do desenho no servidor).

---

### 5. Explorar o mapa

- O mapa é **muito maior** que a tela — **arraste** com o mouse ou o dedo para navegar (ou use a rolagem, se disponível).
- Cada plantação concluída aparece como **flor/coração** com o **nome** do jardineiro abaixo.
- Sua flor usa um tom de rosa diferente das demais (destaque visual).

---

### 6. Avaliar outras plantações

1. **Clique** em uma flor que **não seja a sua**.
2. Abre o **modal da flor** com:
   - Nome do jardineiro
   - Frase
   - Imagem do desenho
3. Avalie com os botões **1 a 5**:
   - **Frase** — uma nota por plantação (por sessão).
   - **Desenho** — uma nota por plantação (por sessão).

**Regras:**

- Você **não pode** avaliar a própria plantação.
- Cada categoria (frase ou desenho) só recebe **um voto seu** por plantação.
- Mensagens na parte inferior da tela (**toast**) confirmam sucesso ou erro.

---

### 7. Consultar rankings

1. Clique em **Rankings** no HUD.
2. No modal, use as abas:
   - **Frase** — melhores frases
   - **Desenho** — melhores desenhos
   - **Geral** — combinação das duas médias
3. Cada lista mostra até **5** entradas com nome, média e frase (quando aplicável).
4. Os rankings **atualizam** quando você vota (sem precisar recarregar a página).

---

### 8. Efeitos visuais opcionais

- **Pétalas** — caem automaticamente na tela (ambiente).
- **Chover Sentimentos** — ativa gotas de chuva só no seu dispositivo; não afeta o banco de dados nem o que outros usuários veem.

---

### 9. Sair e entrar com outra identidade

1. Use o link **Sair** (rodapé ou conforme disponível na interface).
2. A sessão no servidor é encerrada.
3. Na página de entrada, informe **novo nome e frase** para uma nova participação.

Para “recomeçar” no mesmo navegador sem sair: limpe cookies/dados do site ou use aba anônima.

---

## Perguntas frequentes

| Pergunta | Resposta |
|----------|----------|
| Posso desenhar de novo? | Não, após salvar a plantação fica definitiva nesta sessão. |
| Posso mudar nome ou frase? | Só **antes** de salvar o desenho; depois disso o registro principal está fixo. |
| Por que não consigo clicar no mapa? | Aceite o compromisso ou verifique se já desenhou (mapa bloqueado para nova plantação). |
| O mapa não se move | **Arraste** dentro da área do mapa; em telas pequenas, use gestos com um dedo. |
| A chuva aparece para todos? | Não, apenas para quem ativou o botão no próprio navegador. |
| Erro de conexão ao abrir o jardim | O banco pode não estar instalado — peça para executar `setup_db.php`. |

---

## Boas práticas de uso

- Escreva frases **respeitosas** e autênticas.
- Desenhe com intenção — é a sua contribuição permanente na sessão.
- Avalie com critério e empatia; os rankings refletem a média da comunidade.
- Em celular, prefira **modo paisagem** ou zoom confortável para desenhar no canvas.

---

## Suporte técnico (administrador)

Problemas comuns estão no `README.md` do projeto: conexão MySQL, tamanho do POST para desenhos, modo debug e proteção do instalador em produção.

---

*Empatia — Jardim de Sentimentos. Uso educacional e colaborativo.*
