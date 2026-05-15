# Requisitos do Sistema de Jardim

## 1. Arquitetura e Organização
- Página de login separada: `index.php` com `login.css`.
- Página do jardim: `garden.php` com `garden.css`.
- Backend minimalista: captura nome e frase, cria uma entrada única por usuário e grava desenho, localização e pontuações em `jardim.gardeners` via `mysqli`.
- Não há upload de imagens nem interface para enviar fotos.
- `script.js` contém toda a lógica de construção do jardim e interatividade.

## 2. Fluxo da Aplicação
1. Usuário abre `index.php`.
2. Insere o nome e envia o formulário.
3. `garden.php` recebe o nome, guarda na sessão e renderiza o jardim.
4. O usuário é levado para a página do jardim.
5. O usuário escolhe um lugar no mapa para sua plantação do amor.
6. O desenho é produzido em canvas e só pode ser feito uma vez.
7. O botão "Chover no Jardim" ativa/desativa chuva local.

## 3. UI/UX do Jardim
- O jardim tem visual orgânico e desenhado à mão.
- As flores usam pétalas assimétricas com `border-radius` e formas naturais.
- Cada flor tem um pequeno rótulo com o nome do jardineiro.
- Ao passar o mouse sobre a flor, ela cresce levemente e revela o nome.
- O mapa do jardim tem altura mínima de `320vh`, permitindo navegação vertical longa.
- A área do jardim é interativa e pode ser arrastada para navegar.
- As flores são posicionadas com margem mínima de `20px` entre si.
- Flores não ficam todas conectadas; cada uma é independente, espalhada e sem linhas ligando.

## 4. Chuva Local
- Adicionado botão `Chover no Jardim` ao HUD.
- A chuva aparece apenas localmente no navegador do usuário.
- As gotas caem do topo e desaparecem ao alcançar a parte inferior da tela.
- A chuva não depende de backend e não altera o banco de dados.

## 5. Comportamento do Jardim
- O jardim não carrega nomes de usuários pré-existentes.
- Nenhum jardineiro fictício é plantado automaticamente.
- Apenas uma plantação do amor por usuário é permitida.
- O usuário também envia uma frase e um desenho para serem julgados.
- O botão de plantar não está disponível porque a plantação é única por usuário.
- O usuário pode clicar em qualquer flor no mapa para abrir o modal de avaliação.

## 6. Cores disponíveis
A seguir estão as cores já usadas e uma paleta estendida para flor e interface:

### Paleta atual de pétalas
- `#f47d8b`
- `#f9b3c0`
- `#f8d57e`
- `#a7d37d`
- `#a0d6f1`
- `#d3a8f5`
- `#d78f6a`
- `#ff9fa6`

### Paleta adicional de cores possíveis
- Vermelho: `#e63946`, `#d62828`, `#ff5d8f`
- Rosa: `#ffb4c4`, `#ff7fbf`, `#f72585`
- Amarelo: `#ffd166`, `#ffba08`, `#f4d35e`
- Verde: `#3a5a40`, `#82b74b`, `#b7e4c7`
- Azul: `#4d908e`, `#4361ee`, `#90e0ef`
- Roxo: `#8338ec`, `#9d4edd`, `#c77dff`
- Laranja: `#f08a5d`, `#f28482`, `#ff963c`
- Marrom/terra: `#8d6e63`, `#6d4c41`, `#a1887f`
- Neutros claros: `#f5f3f4`, `#e9ecef`, `#ced4da`
- Neutros escuros: `#212529`, `#495057`, `#343a40`

### Cores para elemento de interface
- Fundo do céu: `#bfdbe4`, `#e7f3ef`
- Solo escuro: `#5d4b34`
- Grama: `#81b392`, `#5c8d6d`
- Placa e rótulos: `#ffffff`, `#3d4e3d`
- Destaque: `#4a6b51`, `#5e7d5d`

## 7. Arquivos principais
- `index.php`
- `login.css`
- `garden.php`
- `garden.css`
- `script.js`
- `save_entry.php`
- `rate.php`
- `jardim.sql`
- `requisitos.md`

## 8. Banco de dados
- Banco: `jardim`
- Tabela: `gardeners`
- Colunas: `id`, `name`, `phrase`, `drawing_data`, `location_x`, `location_y`, `score_phrase`, `votes_phrase`, `score_drawing`, `votes_drawing`, `created_at`

## 9. Arquivos adicionais
- `save_entry.php` - endpoint para salvar a localização e o desenho do usuário.
- `rate.php` - endpoint para avaliar frases e desenhos e atualizar rankings.

## 10. Observações
- O layout foi pensado para ser leve e sem dependências extras.
- O backend registra nome, frase, localização e desenho do usuário.
- O sistema cria três rankings: frase, desenho e geral.
- O desenho só pode ser criado uma vez por usuário e depois é bloqueado.
