<template>
  <div class="usuarios-view">
    <PageHeader titulo="Gestão de Usuários">
      <button class="botao-primario" @click="abrirModalCadastro">
        + Novo Usuário
      </button>
    </PageHeader>

    <div v-if="mensagemFeedback.texto" :class="['alerta-flutuante', mensagemFeedback.tipo]">
          {{ mensagemFeedback.texto }}
    </div>

    <div class="abas">
      <button 
        :class="['aba', { 'aba-ativa': abaAtual === 'ativos' }]" 
        @click="abaAtual = 'ativos'"
      >
        Ativos ({{ usuariosAtivos.length }})
      </button>
      <button 
        :class="['aba', { 'aba-ativa': abaAtual === 'inativos' }]" 
        @click="abaAtual = 'inativos'"
      >
        Inativos ({{ usuariosInativos.length }})
      </button>
    </div>

    <div class="tabela-container">
      <table class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Permissões</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in listaExibida" :key="usuario.id">
            <td>{{ usuario.nome }}</td>
            <td>{{ usuario.email }}</td>
            <td>{{ formatarPermissoes(usuario.permissoes) }}</td>
            <td>
              <button 
                v-if="usuario.ativo" 
                class="botao-inativar" 
                @click="alternarStatus(usuario)"
              >
                Inativar
              </button>
              <button 
                v-else 
                class="botao-reativar" 
                @click="alternarStatus(usuario)"
              >
                Reativar
              </button>
            </td>
          </tr>
          <tr v-if="listaExibida.length === 0">
            <td colspan="4" class="tabela-vazia">Nenhum utilizador encontrado nesta aba.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Cadastro -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal">
        <h2>Cadastrar Novo Usuário</h2>
        
        <form @submit.prevent="salvarUsuario" class="form-cadastro">
          <div class="campo">
            <label>Nome Completo</label>
            <input type="text" v-model="form.nome" required placeholder="Ex: João da Silva" />
          </div>
          
          <div class="campo">
            <label>E-mail Institucional</label>
            <input type="email" v-model="form.email" required placeholder="Ex: joao@hemocentro.mt.gov.br" />
          </div>
          
          <fieldset class="grupo-checkboxes">
            <legend>Permissões de Acesso</legend>
            <label class="checkbox-item" v-for="perm in permissoesDisponiveis" :key="perm.valor">
              <input type="checkbox" :value="perm.valor" v-model="form.permissoes" />
              <span>{{ perm.rotulo }}</span>
            </label>
          </fieldset>

          <div v-if="erroModal" class="mensagem-erro">
            {{ erroModal }}
          </div>

          <div class="modal-acoes">
            <button type="button" class="botao-cancelar" @click="mostrarModal = false" :disabled="salvando">
              Cancelar
            </button>
            <button type="submit" class="botao-salvar" :disabled="salvando">
              {{ salvando ? 'Cadastrando...' : 'Cadastrar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { 
  listarUsuarios, 
  criarUsuario, 
  inativarUsuario, 
  reativarUsuario, 
  UsuarioGerenciamentoApi, 
  PermissaoUsuario, 
  ErroApi 
} from '@/services/api'

// Mensagem de feedback na tela (substitui o useAvisos se ele não estiver disponível)
const mensagemFeedback = ref({ texto: '', tipo: 'sucesso' as 'sucesso' | 'erro' })

function mostrarAviso(texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
  mensagemFeedback.value = { texto, tipo }
  setTimeout(() => {
    if (mensagemFeedback.value.texto === texto) {
      mensagemFeedback.value.texto = ''
    }
  }, 4000)
}

const usuariosAtivos = ref<UsuarioGerenciamentoApi[]>([])
const usuariosInativos = ref<UsuarioGerenciamentoApi[]>([])
const abaAtual = ref<'ativos' | 'inativos'>('ativos')

const listaExibida = computed(() => 
  abaAtual.value === 'ativos' ? usuariosAtivos.value : usuariosInativos.value
)

// Controlo do Modal
const mostrarModal = ref(false)
const salvando = ref(false)
const erroModal = ref('')

const form = ref({
  nome: '',
  email: '',
  permissoes: [] as PermissaoUsuario[]
})

// Mapeamento exato com o Enum do Prisma no Backend
const permissoesDisponiveis: { valor: PermissaoUsuario, rotulo: string }[] = [
  { valor: 'VISUALIZAR_DASHBOARD', rotulo: 'Visualizar Dashboard' },
  { valor: 'ENVIAR_DOCUMENTOS', rotulo: 'Enviar Documentos (Upload)' },
  { valor: 'REVISAR_FICHAS', rotulo: 'Revisar Fichas e Prontuários' },
  { valor: 'CONSULTAR_PRONTUARIOS', rotulo: 'Consultar Prontuários' },
  { valor: 'CONSULTAR_AUDITORIA', rotulo: 'Acessar Trilha de Auditoria' },
  { valor: 'EXPORTAR_AUDITORIA', rotulo: 'Exportar Relatórios' },
  { valor: 'GERENCIAR_USUARIOS', rotulo: 'Gestão de Usuários (Gestor)' }
]

function formatarPermissoes(permissoes: PermissaoUsuario[]): string {
  if (!permissoes || permissoes.length === 0) return 'Nenhuma permissão'
  return `${permissoes.length} concedida(s)`
}

async function carregarTodos() {
  try {
    // Busca ativos e inativos explicitamente para garantir que ambos os arrays são preenchidos
    const [ativos, inativos] = await Promise.all([
      listarUsuarios(true).catch(() => []),
      listarUsuarios(false).catch(() => [])
    ])
    
    usuariosAtivos.value = ativos
    usuariosInativos.value = inativos
  } catch (error) {
    mostrarAviso('Erro ao carregar a lista de utilizadores.', 'erro')
  }
}

function abrirModalCadastro() {
  form.value = { nome: '', email: '', permissoes: [] }
  erroModal.value = ''
  mostrarModal.value = true
}

async function salvarUsuario() {
  if (form.value.permissoes.length === 0) {
    erroModal.value = 'Selecione ao menos uma permissão.'
    return
  }

  salvando.value = true
  erroModal.value = ''

  try {
    const payload = {
      nome: form.value.nome.trim(),
      email: form.value.email.trim(),
      permissoes: form.value.permissoes,
      senha: 'Hemocentro@2026' 
    }
    
    await criarUsuario(payload as any)
    
    mostrarModal.value = false
    mostrarAviso('Utilizador registado com sucesso! A palavra-passe provisória é Hemocentro@2026.', 'sucesso')
    await carregarTodos()
  } catch (e: any) {
    erroModal.value = e instanceof ErroApi 
      ? e.message 
      : (e?.message || 'Erro desconhecido ao registar o utilizador.')
  } finally {
    salvando.value = false
  }
}

async function alternarStatus(usuario: UsuarioGerenciamentoApi) {
  try {
    if (usuario.ativo) {
      await inativarUsuario(usuario.id)
      mostrarAviso(`${usuario.nome} foi inativado.`, 'sucesso')
    } else {
      await reativarUsuario(usuario.id)
      mostrarAviso(`${usuario.nome} foi reativado.`, 'sucesso')
    }
    await carregarTodos()
  } catch (error) {
    const acao = usuario.ativo ? 'inativar' : 'reativar'
    mostrarAviso(`Falha ao ${acao} o utilizador.`, 'erro')
  }
}

onMounted(() => {
  carregarTodos()
})
</script>

<style scoped>

.alerta-flutuante {
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}
.alerta-flutuante.sucesso {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}
.alerta-flutuante.erro {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.usuarios-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Abas */
.abas {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}
.aba {
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 16px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}
.aba:hover {
  color: #333;
}
.aba-ativa {
  border-bottom-color: #8c1d1d; /* Cor do hemocentro */
  color: #8c1d1d;
  font-weight: 600;
}

/* Tabela */
.tabela-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid #e0e0e0;
}
.tabela {
  width: 100%;
  border-collapse: collapse;
}
.tabela th, .tabela td {
  padding: 14px 20px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
}
.tabela th {
  background-color: #f9fafb;
  font-weight: 600;
  color: #333;
}
.tabela tr:last-child td {
  border-bottom: none;
}
.tabela-vazia {
  text-align: center;
  padding: 40px !important;
  color: #666;
  font-style: italic;
}

/* Botões da Tabela */
.botao-inativar, .botao-reativar {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.botao-inativar:hover {
  background: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}
.botao-reativar:hover {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #22c55e;
}

/* Modal Overlay e Box */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal {
  background: #fff;
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
.modal h2 {
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 20px;
  color: #333;
}

/* Formulário */
.form-cadastro .campo {
  margin-bottom: 16px;
}
.form-cadastro label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
  color: #444;
}
.form-cadastro input[type="text"],
.form-cadastro input[type="email"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}
.form-cadastro input:focus {
  outline: none;
  border-color: #8c1d1d;
  box-shadow: 0 0 0 2px rgba(140, 29, 29, 0.1);
}

/* Checkboxes */
.grupo-checkboxes {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
  background: #fafafa;
}
.grupo-checkboxes legend {
  font-weight: 600;
  font-size: 14px;
  color: #444;
  padding: 0 8px;
}
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}
.checkbox-item:last-child {
  margin-bottom: 0;
}
.checkbox-item input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Ações e Erros */
.mensagem-erro {
  background: #fef2f2;
  color: #b91c1c;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  border-left: 4px solid #ef4444;
}

.modal-acoes {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.botao-primario, .botao-salvar {
  background: #8c1d1d;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.botao-primario:hover, .botao-salvar:hover:not(:disabled) {
  background: #731717;
}
.botao-salvar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.botao-cancelar {
  background: transparent;
  color: #666;
  border: 1px solid #ccc;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}
.botao-cancelar:hover {
  background: #f5f5f5;
  color: #333;
}
</style>