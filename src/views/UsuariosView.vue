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
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icone-aba">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
        </svg>
        Ativos ({{ usuariosAtivos.length }})
      </button>

      <button 
        :class="['aba', { 'aba-ativa': abaAtual === 'inativos' }]" 
        @click="abaAtual = 'inativos'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icone-aba">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/>
        </svg>
        Inativos ({{ usuariosInativos.length }})
      </button>
    </div>

    <div class="tabela-container">
      <table class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="usuario in listaExibida" :key="usuario.id">
            <td>{{ usuario.nome }}</td>
            <td>{{ usuario.email }}</td>
            <td>
              <span :class="['badge-perfil', usuario.perfil === 'GESTOR' ? 'badge-gestor' : 'badge-colaborador']">
                {{ usuario.perfil === 'GESTOR' ? 'GESTOR' : 'COLABORADOR' }}
              </span>
            </td>
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

                   <div class="campo campo-senha">
            <label>Senha Inicial</label>
            <div class="input-container">
              <input 
                :type="mostrarSenha ? 'text' : 'password'" 
                v-model="form.senha" 
                required 
                placeholder="Insira a palavra-passe" 
                autocomplete="new-password"
              />
              <button type="button" class="botao-olho" @click="mostrarSenha = !mostrarSenha" tabindex="-1">
                <EyeOff v-if="mostrarSenha" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
            <IndicadorSenha :senha="form.senha" />
          </div>
          
          <div class="campo">
            <label>Perfil de Acesso</label>
            <select v-model="form.perfil" required>
              <option value="COLABORADOR">Colaborador</option>
              <option value="GESTOR">Gestor</option>
            </select>
          </div>

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
import IndicadorSenha from '@/components/ui/IndicadorSenha.vue'
import { politicaSenha } from '@/utils/validacao'
import { Eye, EyeOff } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { 
  listarUsuarios, 
  criarUsuario, 
  inativarUsuario, 
  reativarUsuario, 
  UsuarioGerenciamentoApi, 
  ErroApi 
} from '@/services/api'

// Controle de visibilidade da senha
const mostrarSenha = ref(false)

// Mensagem de feedback na tela
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
  senha: '',
  perfil: 'COLABORADOR' as 'GESTOR' | 'COLABORADOR'
})

async function carregarTodos() {
  try {
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
  form.value = { nome: '', email: '', senha: '', perfil: 'COLABORADOR' }
  mostrarSenha.value = false // Reseta o olho ao reabrir o modal
  erroModal.value = ''
  mostrarModal.value = true
}

async function salvarUsuario() {
  erroModal.value = ''
  const erroSenha = politicaSenha()(form.value.senha, {})
  if (erroSenha) {
    erroModal.value = erroSenha
    return
  }

  salvando.value = true

  try {
    const payload = {
      nome: form.value.nome.trim(),
      email: form.value.email.trim(),
      senha: form.value.senha,
      perfil: String(form.value.perfil).toUpperCase()
    }
    
    await criarUsuario(payload as any)
    
    mostrarModal.value = false
    mostrarAviso('Utilizador registado com sucesso!', 'sucesso')
    await carregarTodos()
  } catch (e: any) {
    erroModal.value = e instanceof ErroApi 
      ? e.message 
      : (e?.message || 'Erro ao registar o utilizador.')
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
.usuarios-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Alerta Flutuante */
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

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-container input {
  width: 100%;
  padding-right: 40px;
}

.botao-olho {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #666;
  padding: 0;
  transition: color 0.2s;
  z-index: 2;
}

.botao-olho:hover {
  color: #333;
}

/* Abas com Ícones */
.abas {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}
.aba {
  display: flex;
  align-items: center;
  gap: 8px;
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
  border-bottom-color: #8c1d1d;
  color: #8c1d1d;
  font-weight: 600;
}
.icone-aba {
  stroke: currentColor;
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

/* Badges de Perfil */
.badge-perfil {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}
.badge-gestor {
  background: #fef2f2;
  color: #8c1d1d;
  border: 1px solid #fecaca;
}
.badge-colaborador {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
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
.form-cadastro input[type="email"],
.form-cadastro input[type="password"],
.form-cadastro select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
}
.form-cadastro input:focus,
.form-cadastro select:focus {
  outline: none;
  border-color: #8c1d1d;
  box-shadow: 0 0 0 2px rgba(140, 29, 29, 0.1);
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
.dica-senha {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
}
</style>