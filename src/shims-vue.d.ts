/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// O TypeScript 4.5 do projeto não conhece estes métodos do <dialog>; os navegadores atuais têm.
interface HTMLDialogElement {
  showModal(): void
  close(returnValue?: string): void
}