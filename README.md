# Empatia — Jardim de Sentimentos

Experiência web colaborativa em que cada pessoa registra nome e frase, escolhe um ponto no mapa, desenha uma plantação única e participa de rankings por avaliação da comunidade.

## Requisitos

- [XAMPP](https://www.apachefriends.org/) (Apache + MySQL/MariaDB + PHP 8.0+)
- Extensão PHP `mysqli` habilitada
- Navegador moderno com suporte a Canvas e `fetch`

## Instalação rápida

1. Copie o projeto para `C:\xampp\htdocs\2025\empatia` (ou outro diretório servido pelo Apache).
2. Inicie **Apache** e **MySQL** no painel do XAMPP.
3. Ajuste credenciais em `config.php` se necessário (padrão: `root` sem senha).
4. Abra no navegador: `http://localhost/2025/empatia/setup_db.php`  
   Isso cria o banco `jardim` e a tabela `gardeners`.
5. Acesse: `http://localhost/2025/empatia/`

## Fluxo da aplicação

1. **index.php** — formulário com nome (máx. 30 caracteres) e frase (máx. 250).
2. **garden.php** — cria ou recupera o registro na sessão, exibe o mapa e injeta dados em JavaScript.
3. Aceite do compromisso (armazenado em `sessionStorage` no navegador).
4. Clique no mapa → desenho no canvas → **save_entry.php** grava posição e imagem (uma vez).
5. Clique em outras flores → avaliação 1–5 via **rate.php** (frase e/ou desenho).
6. Rankings atualizados em tempo real (top 5 por frase, desenho e geral).

## Estrutura do projeto

| Arquivo | Função |
|---------|--------|
| `index.php` | Página de entrada |
| `garden.php` | Página principal do jardim (SSR + dados) |
| `save_entry.php` | API JSON — salvar desenho e coordenadas |
| `rate.php` | API JSON — registrar voto e rankings |
| `db.php` | Conexão MySQL |
| `config.php` | Configuração (banco, debug, limites) |
| `helpers.php` | Validações e respostas JSON |
| `rankings.php` | Cálculo compartilhado dos rankings |
| `setup_db.php` | Instalação do banco |
| `logout.php` | Encerra sessão e permite novo cadastro |
| `jardim.sql` | Script SQL manual |
| `script.js` | Mapa, desenho, modais e chamadas à API |
| `garden.css` / `login.css` | Estilos |

## Banco de dados

- **Banco:** `jardim`
- **Tabela:** `gardeners`

Colunas: `id`, `name`, `phrase`, `drawing_data`, `location_x`, `location_y`, `score_phrase`, `votes_phrase`, `score_drawing`, `votes_drawing`, `created_at`.

## Configuração (`config.php`)

```php
'db_host' => 'localhost',
'db_user' => 'root',
'db_pass' => '',
'db_name' => 'jardim',
'debug' => true,              // false em produção
'world_width' => 3000,
'world_height' => 3000,
'max_drawing_bytes' => 2097152,
```

## PHP — limites recomendados

Desenhos são enviados como Data URL (base64). Se o salvamento falhar silenciosamente, aumente no `php.ini`:

```ini
post_max_size = 8M
upload_max_filesize = 8M
memory_limit = 128M
```

Reinicie o Apache após alterar.

## Segurança e regras de negócio

- Uma plantação por sessão (`entry_id` na sessão PHP).
- Desenho imutável após o primeiro salvamento.
- Não é possível avaliar a própria plantação.
- Um voto por categoria (frase/desenho) por plantação, por sessão.
- Coordenadas validadas dentro do tamanho do mapa.
- Prepared statements em todas as queries com parâmetros.

## Solução de problemas

| Problema | Ação |
|----------|------|
| Erro de conexão ao abrir o jardim | Execute `setup_db.php` e confira `config.php` |
| Desenho não salva | Aumente `post_max_size`; verifique se MySQL está ativo |
| Página em branco com erro PHP | Ative `debug => true` em `config.php` |
| Sessão inconsistente | Limpe cookies do site ou use aba anônima |

## Produção

1. Defina `'debug' => false` em `config.php`.
2. Use usuário MySQL dedicado com senha forte.
3. Restrinja acesso ao `setup_db.php` (remova ou proteja por senha).

## Licença

Projeto educacional / uso interno conforme definido pela equipe.
