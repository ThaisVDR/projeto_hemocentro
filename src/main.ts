import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/base.css'
import { consultarSessao } from './services/api'
import { estaAutenticado, iniciarSessao, usuarioLogado } from './services/sessao'

createApp(App).use(router).mount('#app')

// Outra aba pode ter trocado o cookie (ex.: login de Colaborador). Ao voltar para esta aba,
// confere quem é o dono da sessão e recarrega se mudou, em vez de usar permissões antigas.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || !estaAutenticado.value) return
  try {
    const atual = await consultarSessao()
    if (atual.usuario.id !== usuarioLogado.value?.id) {
      iniciarSessao(atual)
      location.assign('/')
    }
  } catch {
    // 401 já é tratado pelas próximas chamadas.
  }
})