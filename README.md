# Hemocentro MT • Prontuário Digital (frontend)

Sistema para **digitalizar as fichas em papel** do Hemocentro MT. As fichas escaneadas são lidas por IA, **conferidas por uma pessoa** e só então gravadas no prontuário do paciente.

Este repositório é o **frontend** (as telas). O **backend** (API, IA e banco de dados) fica em outro repositório:
➡️ [Taynah-M-Alves/Backend-Hemocentro](https://github.com/Taynah-M-Alves/Backend-Hemocentro)

Os dois **não precisam estar no mesmo repositório**: o frontend conversa com o backend pela internet, usando o endereço configurado em `VUE_APP_API_URL`.

---

## Tecnologias

- [Vue 3](https://vuejs.org/) com TypeScript
- [Vue Router](https://router.vuejs.org/) para a navegação entre telas
- [Lucide](https://lucide.dev/) para os ícones
- Vue CLI para rodar e compilar o projeto

## Requisitos

- [Node.js](https://nodejs.org/) (versão LTS)
- [Git](https://git-scm.com/)

---

## Como rodar só o frontend

```bash
git clone https://github.com/ThaisVDR/projeto_hemocentro.git
cd projeto_hemocentro
npm install
npm run serve
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:8080).

Sem o backend rodando, as telas abrem normalmente, mas as buscas e envios mostram **"Não foi possível conectar ao servidor"**. Isso é esperado.

## Como rodar junto com o backend

Use **dois terminais**, um para cada projeto.

**Terminal 1: backend** (veja o README do backend para configurar o banco e as chaves da IA)

```bash
cd Backend-Hemocentro
npm install
npx prisma generate
npm run start:dev
```

O backend roda em http://localhost:3000.

**Terminal 2: frontend**

```bash
cd projeto_hemocentro
npm run serve
```

O frontend roda em http://localhost:8080 e chama o backend no endereço do `.env.local` (veja abaixo).

> ⚠️ O backend precisa ter o **CORS habilitado** (`app.enableCors()` no `main.ts`). Sem isso, o navegador bloqueia as chamadas do frontend, porque eles rodam em portas diferentes.

---

## Configuração (`.env.local`)

Copie o arquivo de exemplo e ajuste se precisar:

```bash
cp .env.example .env.local
```

| Variável | Padrão | Para que serve |
|---|---|---|
| `VUE_APP_API_URL` | `http://localhost:3000` | endereço do backend |
| `VUE_APP_AUTH_MOCK` | ligado | `true`: login simulado, sem backend (senha `Senha123`). `false`: usa as rotas `/auth` do backend |
| `VUE_APP_EXIGIR_LOGIN` | desligado | `true`: todas as telas exigem login. `false`: as telas abrem sem login (útil durante o desenvolvimento) |

O `.env.local` **não vai para o GitHub**: cada pessoa tem o seu. Depois de alterar, **reinicie** o `npm run serve`.

**Para uso real**, com o login do backend pronto:

```
VUE_APP_AUTH_MOCK=false
VUE_APP_EXIGIR_LOGIN=true
```

---

## Fluxo de uma ficha

```
Upload ──► IA lê a ficha ──► Fila de revisão ──► Revisão humana ──► Aprovada ──► Prontuário
                                                        │
                                                        ├──► Com pendência (volta para a fila)
                                                        └──► Recusada (não entra no prontuário)
```

| Status | Significado |
|---|---|
| `processando` | a IA está lendo a ficha |
| `erro_leitura` | a IA não conseguiu ler |
| `digitalizada` | lida pela IA, aguardando revisão |
| `em_revisao` | alguém está revisando |
| `com_pendencia` | falta informação; volta para a fila |
| `aprovada` | conferida e gravada no prontuário |
| `recusada` | documento inválido ou ilegível |

**Só fichas `aprovada` aparecem no prontuário, no dashboard e na migração futura.**

## Rotas do backend usadas pelo frontend

Todas as chamadas ficam em [`src/services/api.ts`](src/services/api.ts). Se um nome de rota mudar no backend, só esse arquivo precisa ser ajustado.

| Rota | Usada em |
|---|---|
| `POST /fichas` (arquivo no campo `file`) | Upload |
| `GET /fichas` | Fila de revisão |
| `GET /fichas/:id` e `GET /fichas/:id/arquivo` | Revisar ficha |
| `PUT /fichas/:id` | Salvar rascunho |
| `POST /fichas/:id/aprovar`, `/pendencia`, `/recusar` | Ações da revisão |
| `GET /pacientes?nome=&dataNascimento=&nomeMae=` | Consulta de prontuário |
| `POST /auth/login`, `/auth/cadastro`, `/auth/esqueci-senha` | Login |

O detalhe de cada rota (campos enviados e recebidos) está na descrição do Pull Request em que ela foi criada.

---

## Estrutura de pastas

```
src/
├── router/      endereço de cada tela e regra de login
├── layouts/     moldura das telas (menu e cabeçalho; tela de login)
├── views/       as telas
├── components/  peças reaproveitáveis (campo de data, cabeçalho de página, campos da revisão…)
├── domain/      regras do negócio, sem visual (tipo sanguíneo, fenótipo, conferência da ficha)
├── services/    conversa com o backend (api.ts) e sessão de login
├── utils/       funções auxiliares (formatação de datas…)
└── styles/      cores e estilos usados no sistema todo
```

---

## Como contribuir (fluxo do grupo)

1. Atualize a `main` e crie uma branch para a tarefa:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/nome-da-tarefa
   ```
   Prefixos: `feature/` (funcionalidade nova), `fix/` (correção) e `docs/` (documentação).
2. Faça commits pequenos, com mensagens que digam o que mudou.
3. Envie a branch e abra um **Pull Request** para a `main`, com uma descrição do que foi feito e de como testar.
4. Outra pessoa do grupo revisa e faz o **merge**.

Se a `main` mudar enquanto você trabalha, traga as novidades para a sua branch com `git pull origin main`.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| "Não foi possível conectar ao servidor" | o backend não está rodando, ou o `VUE_APP_API_URL` está com o endereço errado |
| O navegador mostra erro de **CORS** no console (F12) | habilitar o CORS no backend (`app.enableCors()`) |
| O site abriu na porta 8081 em vez de 8080 | já existe outro `npm run serve` aberto; feche o terminal antigo |
| Mudei o `.env.local` e nada aconteceu | reinicie o `npm run serve` (Ctrl + C e rode de novo) |
| `bash: [200~git: command not found` | entrou um código invisível ao colar no terminal; digite o comando ou cole com o botão direito |

---

## Dados e privacidade

O sistema trata **dados de saúde**, considerados sensíveis pela LGPD. Por isso:
- **não use dados reais de pacientes** em testes, prints ou commits;
- o arquivo `.env.local` (com endereços e configurações) **nunca** deve ir para o GitHub;
- a proteção dos dados depende do backend conferir o login em todas as rotas.