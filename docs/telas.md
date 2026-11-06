# Telas do sistema

Cada tela, na ordem do menu, com o que ela faz e as rotas do backend que usa. Todas as chamadas ao backend ficam em [`src/services/api.ts`](../src/services/api.ts).

Todas as telas, menos as de login e senha, exigem estar logado. A tela **Usuários** é só do gestor.

---

## Login e senha

Arquivos em `src/views/auth/`. Usam o layout `AuthLayout` (cartão no centro, sem menu).

| Tela | Endereço | O que faz | Rota do backend |
|---|---|---|---|
| Entrar | `/login` | e-mail e senha; depois volta para a tela que a pessoa queria abrir | `POST /auth/login` |
| Recuperar senha | `/esqueci-senha` | pede um link de nova senha. A resposta é sempre a mesma, exista ou não o e-mail, para não revelar quem tem conta | `POST /auth/esqueci-senha` |
| Criar nova senha | `/redefinir-senha?token=…` | abre pelo link do e-mail; o link vale 30 minutos e só pode ser usado uma vez | `POST /auth/redefinir-senha` |
| Crie a sua senha | `/trocar-senha` | aparece no primeiro acesso, para trocar a senha provisória que o gestor criou. Enquanto não trocar, nenhuma outra tela abre | `POST /auth/trocar-senha` |

Regra da senha (igual à do backend): de 8 a 64 caracteres, com letra maiúscula, letra minúscula, número e símbolo. O indicador abaixo do campo mostra o que falta.

---

## Dashboard

`/dashboard` • [`DashboardView.vue`](../src/views/DashboardView.vue)

Visão geral do acervo para quem acompanha o trabalho:

- **Indicadores:** fichas digitalizadas e validadas no período, em revisão e em processamento agora.
- **Período:** campos De e Até, com o botão Atualizar.
- **Evolução da digitalização:** gráfico por semana.
- **Prioridades de revisão:** as 3 fichas que mais pedem atenção, com link para a Fila.
- **Atividade recente:** os últimos eventos da auditoria.
- **Qualidade do cadastro:** quantas fichas validadas estão com o cadastro completo.

Rotas: `GET /dashboard`, `GET /fichas?ordenar=atencao`, `GET /auditoria/eventos?limite=3`.

---

## Upload de documentos

`/upload` • [`UploadView.vue`](../src/views/UploadView.vue)

Envio das fichas escaneadas, **um arquivo por ficha** (PDF com as páginas na ordem, JPG ou PNG, até 50 MB).

- Arrastar e soltar ou "Selecionar arquivos"; vários arquivos viram um lote.
- A tabela "Enviados nesta sessão" acompanha cada arquivo sozinha, sem F5: Enviando, Na fila da IA, Lendo com IA, Aguardando revisão (com o link "Revisar") ou Erro na leitura.
- O erro da IA aparece numa frase simples. O texto técnico completo aparece ao passar o mouse.
- **Reprocessar** fica bloqueado por 5 minutos depois da falha, com a contagem na tela, para não sobrecarregar a IA. O backend também faz essa trava.

A lista some quando a pessoa sai da tela. As fichas que falharam continuam em **Leituras com problema**.

Rotas: `POST /lotes`, `GET /lotes/:id`, `POST /documentos/:id/reprocessar`.

---

## Leituras com problema

`/leituras` • [`LeiturasView.vue`](../src/views/LeiturasView.vue)

Lista fixa das fichas que **ainda não chegaram à revisão**, em dois cartões: **Com falha** e **Na fila ou lendo**.

- Mostra o código da ficha, o lote, a situação e o motivo da falha.
- Tem o mesmo botão Reprocessar do Upload, com a espera de 5 minutos.
- Enquanto houver ficha sendo lida, a lista se atualiza a cada 10 segundos. Quando a leitura termina, a ficha sai daqui e vai para a Fila de revisão.

Rotas: `GET /fichas?status=ENVIADA,LENDO,FALHA_LEITURA`, `POST /documentos/:id/reprocessar`.

---

## Fila de revisão

`/fila` • [`FilaRevisaoView.vue`](../src/views/FilaRevisaoView.vue)

Fichas lidas pela IA, esperando ou passando pela conferência humana.

- Filtros por situação, com os contadores: Pendentes, Aguardando revisão, Em revisão, Com pendência e Validadas.
- Busca por nome, nome da mãe ou data de nascimento (Enter ou botão), com paginação.
- **Revisar →** abre a ficha. **Recusar** recusa direto da fila, com o motivo (ilegível ou outro documento).

Rotas: `GET /fichas/revisao`, `POST /fichas/:id/recusar`.

---

## Revisar ficha

`/revisar/:fichaId` • [`RevisarFichaView.vue`](../src/views/RevisarFichaView.vue)

A tela principal do sistema. Não aparece no menu: só se chega a ela pela Fila, pelo Upload ou por Leituras com problema. O endereço `/revisar` sem ficha volta para a Fila.

**Esquerda:** o documento original (PDF ou imagem), na página do campo em que a pessoa está.

**Direita:** os dados lidos pela IA, em seções numeradas como na ficha de papel:

1. **Identificação do receptor**: nome, raça/cor, ABO/Rh, nascimento, sexo, mãe, prontuário, cartão SUS, município (busca de cidades) e diagnóstico.
2. **Ficha transfusional**: uma linha por envio de hemocomponente, com GR.S/RhD, PAI e prova cruzada em listas de opções, destino (busca de cidades) e responsável (busca de colaboradores, com "+ Cadastrar" para nome novo).
3. e 4. **ID-DiaCell I, II** e **ID-DiaPanel**: data, lote do kit, interpretação e a grade de reações por célula e por método (LISS/Coombs, enzima, frio), com o autocontrole.
5. **Pesquisa imuno-hematológica**: grupo, fator Rh, D fraco, PAI, autocontrole, TAD, DC-Screening, fenotipagem eritrocitária (grade de antígenos) e anticorpos identificados (data, especificidade e classe IgG/IgM).

No fim, o **perfil imuno-hematológico** calculado a partir do que foi conferido.

**Estado de cada campo** (a legenda fica no topo):

| Ícone | Estado | Significado |
|---|---|---|
| brilho | Sugerido pela IA | precisa ser conferido com o original |
| ✓ | Conferido | a pessoa confirmou que está igual ao papel (↩ desfaz) |
| lápis | Preenchido ou corrigido | a pessoa digitou ou mudou o valor |
| ! | Leitura incerta | a IA teve dúvida; **bloqueia a aprovação** até confirmar |
| ○ | Ainda não preenchido | vazio |
| — | Em branco no original | o campo está vazio no papel |

**Ações** (o rodapé fica sempre visível):

- **Iniciar revisão** (ou **Assumir revisão**, se outra pessoa estiver com a ficha, com justificativa opcional): sem isso, os botões ficam desligados.
- **Salvar rascunho**: grava só o que mudou desde o último salvamento. Cada mudança fica registrada na auditoria.
- **Sinalizar pendência**: pede o motivo e devolve a ficha para a fila. Quem abrir a ficha depois vê o motivo num aviso amarelo no topo.
- **Recusar**: ilegível ou outro documento, com observação.
- **Aprovar e salvar**: salva o que falta e grava no prontuário. Se algo bloqueia, mostra o aviso, deixa o campo com borda vermelha e rola até ele ("Mostrar onde" faz o mesmo). Testes sem resultado (PAI, prova cruzada, TAD, autocontrole, DC-Screening) são gravados como **NR, não realizado**.
- **Possível paciente já cadastrado**: se o backend acha alguém parecido, é obrigatório dizer se é a mesma pessoa antes de aprovar.

Rotas: `GET /fichas/:id`, `GET /fichas/:id/semelhantes`, `POST /fichas/:id/iniciar-revisao`, `/assumir-revisao`, `PATCH /fichas/:id/dados`, `POST /fichas/:id/pendencia`, `/recusar`, `/aprovar`, `GET /colaboradores`, `POST /colaboradores`, `GET /cidades`.

---

## Prontuários

`/prontuarios` e `/prontuarios/:pacienteId` • [`ProntuarioView.vue`](../src/views/ProntuarioView.vue)

- **Busca** por nome, data de nascimento e nome da mãe.
- **Página do paciente:** cabeçalho com os dados de identificação e a última validação, o **perfil transfusional** (anticorpos irregulares com classe, antígenos para os quais as hemácias precisam ser negativas e grupos ABO/RhD compatíveis) e o **histórico** das fichas validadas, com o documento original de cada uma.

**Ficha completa** (`/prontuarios/:pacienteId/ficha-completa`, [`FichaCompletaView.vue`](../src/views/FichaCompletaView.vue)): tudo o que foi validado do paciente (transfusões, pesquisas e kits), com a página de origem de cada dado.

Só mostra dados de fichas **validadas**.

Rotas: `GET /pacientes`, `GET /pacientes/:id/ficha-completa`, `GET /pacientes/:id/historico`.

---

## Auditoria

`/auditoria` • [`AuditoriaView.vue`](../src/views/AuditoriaView.vue)

Trilha de tudo o que aconteceu no sistema, do envio à validação: quem fez, quando e em qual ficha.

- Filtros: busca (ficha, lote ou paciente), período, tipo de evento e usuário.
- Contadores de eventos, edições e validações.
- **Detalhe do evento:** valor anterior (sugestão da IA) e valor posterior (correção humana), justificativa e links para a ficha e o documento original. Nas falhas de leitura, mostra a frase simples e esconde o texto técnico em "Ver detalhes técnicos".
- **Exportar trilha:** baixa uma planilha (.xlsx) com os filtros aplicados.

Rotas: `GET /auditoria/eventos`, `GET /auditoria/eventos/:id`, `GET /auditoria/eventos/exportar`, `GET /auditoria/eventos/usuarios`.

---

## Usuários (só gestor)

`/usuarios` • [`UsuariosView.vue`](../src/views/UsuariosView.vue)

- Abas **Ativos** e **Inativos**, com o perfil de cada um.
- **Cadastrar novo usuário:** nome, e-mail, senha provisória (com o indicador da regra da senha) e perfil (Gestor ou Colaborador). A pessoa troca a senha no primeiro acesso.
- **Inativar** e **Reativar**. Inativar encerra as sessões abertas da pessoa. O sistema não deixa ficar sem nenhum gestor ativo.

Rotas: `GET /usuarios`, `POST /usuarios`, `POST /usuarios/:id/inativar`, `/reativar`.
