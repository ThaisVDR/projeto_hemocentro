<script lang="ts">
import { defineComponent, ref } from 'vue'
import { Droplet } from 'lucide-vue-next'

export default defineComponent({
  name: 'AuthLayout',
  components: { Droplet },
  setup() {
    // Só aplica a foto se o arquivo existir em public/; sem ele fica o degradê, sem erro 404 no console.
    const foto = ref('')
    const img = new Image()
    img.onload = () => { foto.value = `url(${img.src})` }
    img.src = `${process.env.BASE_URL}fundo-login.jpg`
    return { foto }
  }
})
</script>