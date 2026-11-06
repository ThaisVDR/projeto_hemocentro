# Arquitetura do frontend

Como o código está organizado, como os dados vão e voltam do backend e o passo a passo para criar uma tela nova.

---

## Visão geral

```
 Tela (views/)  ──usa──►  Regras (domain/)  ──usa──►  Backend (services/api.ts)  ──HTTP──►  API /api/...
       │                                                      │
       └── peças (components/), avisos (composables/)         └── sessão de login (services/sessao.ts)
```

- **views/**: uma tela por arquivo. A tela junta as peças, guarda o estado dela e chama as funções de `domain/` e `services/`.
- **components/**: peças reaproveitáveis, separadas pela tela que mais usa (`revisao/`, `prontuario/`, `dashboard/`, `upload/`…). As genéricas ficam soltas em `components/` (`CampoData`, `PageHeader`, `DialogoConfirmacao`) ou em `ui/`.
- **domain/**: regras do negócio **sem visual**. Por exemplo: o que conta como ficha conferida, como ler uma reação "2+", como traduzir `O_POSITIVO` para "O+". Pode ser testado sem abrir a tela.
- **services/**: o único lugar que fala com o backend (`api.ts`) e o que guarda quem está logado (`sessao.ts`).
- **composables/**: estado reaproveitável entre telas: avisos flutuantes (`useAvisos`) e formulários com validação (`useFormulario`).
- **utils/**: funções pequenas: datas (`formatacao.ts`), mensagens de erro em frase simples (`erros.ts`), regras de campos (`validacao.ts`).

Os componentes são escritos com `defineComponent` e `setup()`, com `ref`, `computed` e `watch`. Os nomes de arquivos, variáveis e funções são em português, como o domínio do hemocentro.

---

## Conversa com o backend (`services/api.ts`)

Toda chamada passa pela função `chamar()`, que:

1. manda o **cookie da sessão** (`credentials: 'include'`);
2. em POST, PATCH e DELETE, manda o cabeçalho **`X-CSRF-Token`**, que protege contra ações feitas por outro site em nome do usuário;
3. se o backend responde **401** (sessão expirada), limpa a sessão e leva para o login, guardando a tela de volta;
4. se responde **403** com `trocarSenhaNoProximoLogin`, leva para a tela de troca de senha;
5. se o backend não responde, lança "Não foi possível conectar ao servidor".

Em cima dela:

- `requisitar<T>(caminho)` devolve o JSON já com o tipo certo. Se der erro, lança um `ErroApi` com a mensagem do backend. Mensagens técnicas, como erros do banco, viram uma frase genérica para o usuário e o detalhe vai para o console (F12).
- `enviarJson<T>(caminho, metodo, dados)` faz o mesmo, mandando um corpo JSON.

O arquivo é dividido por área (Fichas, Lotes, Colaboradores, Cidades, Autenticação, Pacientes, Dashboard, Auditoria, Usuários). Cada área tem as **interfaces** que descrevem o que o backend devolve (terminadas em `Api`, como `FichaDetalheApi`) e as **funções** que as telas chamam (`buscarFicha`, `aprovarFicha`…). **Se uma rota mudar no backend, só este arquivo muda.**

---

## Login e acesso às telas

### Onde fica a sessão

A sessão de verdade é um **cookie `httpOnly`** criado pelo backend no login. O JavaScript não consegue ler esse cookie, o que impede que um script malicioso roube o login.

O frontend guarda só o que precisa mostrar, no `sessionStorage` (`services/sessao.ts`):

- o usuário (id, nome, e-mail, perfil e se precisa trocar a senha);
- o token CSRF;
- quando a sessão expira.

`sessao.ts` exporta valores prontos para as telas: `estaAutenticado`, `usuarioLogado`, `ehGestor`, `idUsuarioAtual`, `precisaTrocarSenha`.

### Regras do roteador (`router/index.ts`)

Antes de abrir qualquer tela, o `beforeEach`:

1. **Confere a sessão no backend** (`GET /auth/sessao`) uma vez por carregamento da página. O cookie é o mesmo para todas as abas, então essa conferência evita que uma aba ache que é de outro usuário.
2. Se a pessoa precisa **trocar a senha provisória**, só deixa abrir `/trocar-senha`.
3. **Telas públicas** (`meta.publica`: login, esqueci e redefinir senha): quem já está logado vai para a primeira tela, menos onde há `meta.tambemLogado`.
4. **Telas internas**: sem login, vai para `/login?redirect=...`.
5. **`meta.requerGestor`** (tela Usuários): colaborador volta para a primeira tela que pode abrir.

O menu (`components/layout/AppSidebar.vue`) segue a mesma regra e só mostra Usuários para o gestor. Ele pode ser recolhido, e a preferência fica guardada no navegador.

> A proteção de verdade está no **backend**, que confere a sessão e o perfil em toda rota. O frontend só evita mostrar o que a pessoa não pode usar.

---

## Revisão da ficha: como os dados circulam

É a parte mais complexa. Os arquivos principais são `views/RevisarFichaView.vue`, `domain/revisao.ts` e `domain/conversaoApi.ts`.

### 1. Do backend para a tela

`GET /fichas/:id` devolve o que a IA leu (`FichaExtraidaApi`). A função **`fichaDaExtracao()`** transforma isso na ficha da tela (`FichaEmRevisao`):

- cada campo vira um **`CampoRevisavel`**: `{ valor, estado, rotulo, pagina }`;
- o estado começa como `sugerido` (a IA leu), `incerto` (a IA teve dúvida) ou `vazio`;
- os valores do banco são traduzidos para o que a tela mostra (`domain/traducao.ts`), por exemplo `O_POSITIVO` para "O+".

A tela guarda uma cópia, o **`original`**, para saber depois o que mudou.

### 2. Na tela

Cada ação do revisor muda o estado do campo (funções de `domain/revisao.ts`):

| Ação | Função | Estado |
|---|---|---|
| ✓ confirmar | `confirmarConferencia` | `conferido` |
| digitar ou escolher | `editarCampo` | `editado` (ou `vazio`, se apagou) |
| — em branco no papel | `marcarNaoConsta` | `nao_consta` |
| ↩ desfazer | `desfazerConferencia` / `desfazerNaoConsta` | volta ao anterior |

**`resumirConferencia()`** conta os itens conferidos e lista o que **bloqueia a aprovação**: nome e data de nascimento vazios e leituras incertas. É dessa lista que vêm a barra de progresso, a mensagem do rodapé e as bordas vermelhas.

### 3. Da tela para o backend

Ao salvar, a tela **não manda a ficha inteira**. As funções `alteracoesDaIdentificacao`, `alteracoesDasTransfusoes`, `alteracoesDaImunohematologia` e `alteracoesDosKits` comparam a ficha atual com o `original` e geram só o que mudou:

```json
PATCH /fichas/12/dados
{ "alteracoes": [
  { "campo": "paciente.sexo", "valor": "F" },
  { "campo": "transfusoes[1].volMl", "valor": 300 },
  { "campo": "pesquisas[0].anticorpos", "valor": [{ "especificidade": "Anti-K", "data": "2026-02-20", "classe": "IGG" }] }
]}
```

O backend registra **cada alteração** como um evento na auditoria (valor anterior e posterior, quem e quando). Depois de salvar, `marcarComoSalvo()` atualiza o `original`.

O **Aprovar** salva primeiro o que estiver pendente, porque o backend aprova o que está gravado nele. Antes disso, grava como NR os testes que ficaram sem resultado.

---

## Avisos, formulários e janelas

- **Avisos flutuantes:** `avisar('sucesso' | 'info' | 'alerta' | 'erro', texto)`, de `composables/useAvisos.ts`. Aparecem num canto fixo da tela. Os de sucesso somem sozinhos; os de erro ficam até a pessoa fechar.
- **Formulários** (login, senha, usuários): `useFormulario(valoresIniciais, regras)` cuida dos valores, dos erros por campo e do envio. As regras ficam em `utils/validacao.ts` (`obrigatorio`, `email`, `politicaSenha`…).
- **Janelas de confirmação:** `DialogoConfirmacao`, `DialogoRecusa` e `DialogoPendencia`, feitas com `<dialog>`. O sistema não usa `window.prompt` nem `window.confirm`.
- **Datas:** o backend usa `AAAA-MM-DD` e a tela mostra `dd/mm/aaaa`. O componente `CampoData` e as funções de `utils/formatacao.ts` fazem a conversão.

## Estilos

`src/styles/base.css` define as cores como variáveis (`--cor-primaria`, `--cor-texto-suave`, `--cor-alerta-suave`…) e as classes comuns:

- `.cartao`: caixa branca com borda;
- `.botao` e `.botao--primario`: botões;
- `.selo` e `.selo--sucesso`, `--alerta`, `--info`, `--perigo`, `--neutro`: etiquetas de situação.

Cada componente tem o seu `<style scoped>`, que só vale dentro dele. Use as variáveis em vez de cores soltas, para tudo ficar com a mesma cara.

---

## Como criar uma tela nova

Exemplo: uma tela "Relatórios" no endereço `/relatorios`.

1. **Rota no backend.** Combine com o backend o endereço e o formato da resposta.
2. **`services/api.ts`.** Na seção da área, crie a interface e a função:
   ```ts
   export interface RelatorioApi {
     total: number
     itens: { mes: string; fichas: number }[]
   }

   export function buscarRelatorio(): Promise<RelatorioApi> {
     return requisitar<RelatorioApi>('/relatorios')
   }
   ```
3. **A tela** em `src/views/RelatoriosView.vue`, seguindo as outras: `PageHeader` no topo, estado com `ref`, carregamento no `onMounted`, mensagens de "Carregando…" e de erro com "Tentar novamente".
4. **A rota** em `router/index.ts`, dentro dos filhos do `AppLayout`:
   ```ts
   {
     path: 'relatorios',
     name: 'relatorios',
     component: () => import('@/views/RelatoriosView.vue'),
     meta: { titulo: 'Relatórios' } // + requerGestor: true se for só do gestor
   },
   ```
   O `titulo` aparece no topo da tela.
5. **O menu** em `components/layout/AppSidebar.vue`: acrescente o item na lista `todos`, com um ícone do Lucide.
6. **Teste** com o backend rodando, rode `npm run lint` e abra o Pull Request.
