# Hemocentro MT • Prontuário Digital (frontend)

Sistema para **digitalizar as fichas em papel** do Hemocentro MT. A ficha escaneada é lida por uma IA, **conferida por uma pessoa** e só então gravada no prontuário do paciente.

Este repositório é o **frontend**, ou seja, as telas. O **backend** (API, leitura por IA e banco de dados) fica em outro repositório: [Taynah-M-Alves/Backend-Hemocentro](https://github.com/Taynah-M-Alves/Backend-Hemocentro).

| Documento | O que tem |
|---|---|
| Este README | como rodar, configurar e contribuir |
| [docs/telas.md](docs/telas.md) | cada tela do sistema: para que serve e o que faz |
| [docs/arquitetura.md](docs/arquitetura.md) | como o código está organizado e como criar uma tela nova |
| [docs/deploy.md](docs/deploy.md) | como gerar a versão de produção do frontend |

---

## Tecnologias

- [Vue 3](https://vuejs.org/) com TypeScript (componentes com `defineComponent` e `setup()`)
- [Vue Router](https://router.vuejs.org/) para a navegação e o controle de acesso às telas
- [Lucide](https://lucide.dev/) para os ícones
- Vue CLI para rodar, verificar e compilar o projeto

Não há biblioteca de componentes nem de estado: os estilos ficam em `src/styles/base.css` e o estado compartilhado (sessão e avisos) é feito com `ref` e `computed` do próprio Vue.

## Requisitos

- [Node.js](https://nodejs.org/) (versão LTS)
- [Git](https://git-scm.com/)
- O backend rodando, com o banco PostgreSQL (veja o README do backend)

---

## Como rodar

Use **dois terminais**, um para cada projeto.

**Terminal 1: backend**

```bash
cd Backend-Hemocentro
git pull
npm install
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

O backend está pronto quando aparecer `Nest application successfully started`. Ele roda em http://localhost:3000/api.

Na primeira vez, crie o usuário gestor:

```bash
npm run build
node dist/scripts/criar-primeiro-gestor.js
```

**Terminal 2: frontend**

```bash
cd projeto_hemocentro
git pull origin main
npm install
npm run serve
```

Abra http://localhost:8080 no Edge ou no Chrome e entre com o e-mail e a senha do gestor.

> No `.env` do backend, `CORS_ORIGINS` precisa ter `http://localhost:8080`. Sem isso, o login dá "Origem não permitida".

## Comandos

| Comando | Para que serve |
|---|---|
| `npm run serve` | roda o frontend em modo de desenvolvimento (recarrega sozinho a cada mudança) |
| `npm run lint` | confere o padrão do código; rode antes de abrir um Pull Request |
| `npm run build` | gera a versão de produção na pasta `dist/` |

## Configuração (`.env.local`)

```bash
cp .env.example .env.local
```

| Variável | Padrão | Para que serve |
|---|---|---|
| `VUE_APP_API_URL` | `http://localhost:3000/api` | endereço do backend, **com** o prefixo `/api` |

O `.env.local` **não vai para o GitHub**: cada pessoa tem o seu. Depois de alterar, reinicie o `npm run serve`.

---

## Perfis de usuário

| Perfil | O que pode fazer |
|---|---|
| **Colaborador** | todas as telas de trabalho: Dashboard, Upload, Leituras com problema, Fila de revisão, Revisar ficha, Prontuários e Auditoria |
| **Gestor** | tudo o que o colaborador faz e, além disso, a tela **Usuários**: cadastrar, inativar e reativar contas |

Não existe cadastro aberto: só o gestor cria contas. A conta nova recebe uma **senha provisória**, e a pessoa precisa criar a própria senha no primeiro acesso.

## Fluxo de uma ficha

```
Upload ──► IA lê a ficha ──► Fila de revisão ──► Revisão humana ──► Validada ──► Prontuário
              │                                        │
              └──► Falha na leitura                    ├──► Com pendência (volta para a fila)
                   (Leituras com problema,             └──► Recusada (não entra no prontuário)
                    botão Reprocessar)
```

| Status no backend | Nome na tela | Significado |
|---|---|---|
| `ENVIADA` | Na fila da IA | o arquivo chegou e espera a leitura |
| `LENDO` | Lendo com IA | a IA está lendo |
| `FALHA_LEITURA` | Erro na leitura | a IA não conseguiu ler; dá para reprocessar depois de 5 minutos |
| `AGUARDANDO_REVISAO` | Aguardando revisão | lida pela IA, esperando uma pessoa |
| `EM_REVISAO` | Em revisão | alguém está conferindo |
| `COM_PENDENCIA` | Com pendência | falta informação; o motivo aparece no topo da revisão |
| `VALIDADA` | Validada | conferida e gravada no prontuário |
| `RECUSADA` | Recusada | documento ilegível ou não é uma ficha do hemocentro |

**Só o que foi validado aparece no prontuário.** O que a IA leu é só uma sugestão até a aprovação.

---

## Estrutura de pastas

```
src/
├── router/       endereço de cada tela e regras de acesso (login, gestor, troca de senha)
├── layouts/      moldura das telas: menu e topo (AppLayout) ou tela de login (AuthLayout)
├── views/        as telas (uma por arquivo; auth/ tem login, senha e afins)
├── components/   peças reaproveitáveis, separadas por tela (revisao/, prontuario/, dashboard/…)
├── composables/  lógica reaproveitável com estado: avisos flutuantes e formulários
├── domain/       regras do negócio, sem visual: conferência da ficha, fenótipo, tradução de valores
├── services/     conversa com o backend (api.ts) e sessão de login (sessao.ts)
├── utils/        funções auxiliares: datas, mensagens de erro, validação de campos
└── styles/       cores e estilos usados no sistema todo
```

Os detalhes de cada pasta e o passo a passo para criar uma tela estão em [docs/arquitetura.md](docs/arquitetura.md).

---

## Como contribuir

1. Atualize a `main` e crie uma branch para a tarefa:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nome-da-tarefa
   ```
   Prefixos: `feature/` (funcionalidade nova), `ajuste/` ou `fix/` (correção) e `docs/` (documentação).
2. Rode `npm run serve` e `npm run lint` e confira que não há erros.
3. Faça commits pequenos, com mensagens que digam o que mudou.
4. Envie a branch e abra um **Pull Request** para a `main`, dizendo o que foi feito e como testar.
5. Outra pessoa do grupo revisa, testa com o backend e faz o merge.

**Nada vai direto para a `main`.** Envio direto já quebrou a compilação para o grupo inteiro.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| "Não foi possível conectar ao servidor" | o backend não está rodando, ou o `VUE_APP_API_URL` está errado |
| "Origem não permitida" ao entrar | coloque `http://localhost:8080` no `CORS_ORIGINS` do `.env` do backend e reinicie o backend |
| Toda tela volta para o login | a sessão expirou (dura 4 horas) ou o backend foi reiniciado com o banco recriado; entre de novo |
| O site abriu na porta 8081 | já existe outro `npm run serve` aberto; feche o terminal antigo |
| Mudei o `.env.local` e nada aconteceu | reinicie o `npm run serve` |
| "Compiled with problems" depois de um `git pull` | alguém enviou código com erro; avise o grupo com o print da mensagem |
| Uma janela do sistema não abre no navegador do VS Code | use o Edge ou o Chrome |

---

## Dados e privacidade

O sistema trata **dados de saúde**, considerados sensíveis pela LGPD. Por isso:

- **não use dados reais de pacientes** em testes, prints, commits ou no grupo;
- os arquivos `.env` e `.env.local` **nunca** vão para o GitHub;
- o frontend não guarda a sessão de login: ela fica num cookie protegido, que o JavaScript não lê (veja [docs/arquitetura.md](docs/arquitetura.md)).
