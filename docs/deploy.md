# Deploy do frontend

Depois do `npm run build`, o frontend vira **arquivos estáticos** (HTML, JS e CSS na pasta `dist/`). Nenhum processo Node fica rodando: quem entrega as telas é o servidor web (nginx ou IIS), o mesmo que repassa `/api` para o backend.

O roteiro completo do servidor (banco, backend, nginx, HTTPS e cópias de segurança) está no **DEPLOY.md do backend**. Aqui fica só a parte do frontend.

## Regras importantes

- **Mesmo endereço e HTTPS.** As telas e a API precisam estar no mesmo domínio, por exemplo `https://hemocentro.exemplo.gov.br` e `https://hemocentro.exemplo.gov.br/api`, e com HTTPS. Sem isso, o navegador não guarda o cookie do login: a pessoa entra e a próxima tela dá 401.
- **As variáveis entram no build.** O `VUE_APP_API_URL` é lido na hora do `npm run build`. Se mudar, gere o build de novo.
- **Rotas do Vue.** O servidor web precisa devolver o `index.html` para qualquer endereço que não seja arquivo, como `/fila` ou `/revisar/12`. Senão, um F5 numa tela dá "404".

## Opção 1: servidor com nginx

Na pasta do frontend, no servidor ou numa máquina de build:

```bash
git pull
printf 'VUE_APP_API_URL=https://hemocentro.exemplo.gov.br/api\n' > .env.production.local
npm ci
npm run build
```

Copie o conteúdo de `dist/` para a pasta que o nginx serve (no roteiro do backend, `/var/www/hemocentro`). Para atualizar depois, repita os comandos e copie a `dist/` de novo.

## Opção 2: Docker

O `docker-compose.yml` do backend já monta o sistema inteiro: banco, backend e um nginx que **gera o build do frontend** a partir da pasta `../projeto_hemocentro`, com `VUE_APP_API_URL=/api`. Para isso, as pastas dos dois projetos precisam estar lado a lado:

```
Faculdade/
├── Backend-Hemocentro/   (docker-compose.yml)
└── projeto_hemocentro/   (este repositório)
```

Os passos estão na seção "Opção com Docker" do DEPLOY.md do backend.
