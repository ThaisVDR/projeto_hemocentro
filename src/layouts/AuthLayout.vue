<template>
  <div class="auth">
    <div class="auth__fundo" aria-hidden="true">
      <div class="auth__foto" :style="{ backgroundImage: foto }"></div>
    </div>

    <main class="auth__centro">
      <section class="auth__cartao">
        <header class="auth__topo">
          <span class="auth__logo"><Droplet :size="28" /></span>
          <span class="auth__nome">
            <strong>Hemocentro MT</strong>
            <small>Prontuário digital</small>
          </span>
        </header>

        <div class="auth__corpo">
          <router-view />
        </div>
      </section>

      <p class="auth__rodape">
        <span>Hemocentro MT • Digitalização e estruturação inteligente</span>
      </p>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Droplet } from 'lucide-vue-next'

export default defineComponent({
  name: 'AuthLayout',
  components: { Droplet },
  setup() {
    const foto = `url(${process.env.BASE_URL}fundo-login.jpg)`
    return { foto }
  }
})
</script>

<style scoped>
.auth {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px 16px;
  overflow: hidden;
}

.auth__fundo {
  position: absolute;
  inset: -12px;
  background:
    radial-gradient(circle at 20% 15%, #b3293f 0%, transparent 45%),
    linear-gradient(135deg, #8e1b2c, #3d0c16);
  filter: blur(2px);
}
.auth__foto {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
.auth__fundo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(40, 8, 16, 0.35), rgba(30, 6, 12, 0.6));
}

.auth__centro {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: 100%;
  max-width: 480px;
}
.auth__cartao {
  width: 100%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.auth__topo {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 26px 32px;
  background: #fff;
}

.auth__logo {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  color: #fff;
  background: var(--cor-primaria);
  border-radius: 14px;
}

.auth__nome { display: flex; flex-direction: column; line-height: 1.2; }
.auth__nome strong { font-size: 22px; font-weight: 650; color: var(--cor-primaria); }
.auth__nome small { font-size: 13px; color: var(--cor-texto-suave); }

.auth__corpo { padding: 28px 32px 30px; }

.auth__rodape {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 18px;
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

@media (max-width: 520px) {
  .auth__topo { padding: 20px; }
  .auth__corpo { padding: 22px 20px 24px; }
}
</style>