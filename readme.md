# Clínica TF - Sistema de Gestão de Embaixadoras

Este é um sistema completo (Fullstack) para gerenciamento de clientes, agendamentos, procedimentos e um programa exclusivo de **Embaixadoras** da Clínica TF, onde indicações geram pontos e benefícios.

Inicialmente concebido com Backend em Python (FastAPI) e Frontend em React (Vite), o projeto foi **migrado para uma arquitetura única em Next.js 14 (App Router)**, utilizando Node.js e Prisma ORM conectado a um banco de dados PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Linguagem:** JavaScript / React
- **Estilização:** CSS Customizado / [Lucide React](https://lucide.dev/) (Ícones)
- **Banco de Dados:** PostgreSQL (Hospedado no NeonDB)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticação:** JWT (JSON Web Tokens) com `jsonwebtoken` e `bcryptjs`
- **Gráficos e Mapas:** [Recharts](https://recharts.org/) e [React-Leaflet](https://react-leaflet.js.org/)

## 📦 Estrutura do Projeto

```text
clinicatf-next/
├── prisma/                 # Configurações do Prisma, Schema do banco de dados e script de Seed
├── src/
│   ├── api/                # Cliente Axios configurado para chamadas na API interna
│   ├── app/                # Next.js App Router (Páginas e Rotas de API)
│   │   ├── (dashboard)/    # Grupo de rotas protegidas (ex: /clientes, /agenda, /vendas)
│   │   ├── api/            # Endpoints do Backend (Next.js API Routes)
│   │   │   ├── auth/       # Rotas de Autenticação (login, me)
│   │   │   ├── clients/    # Rotas CRUD de clientes
│   │   │   ├── ambassadors/# Rotas CRUD de embaixadoras
│   │   │   └── dashboard/  # Rota de métricas gerais
│   │   ├── login/          # Página pública de Login
│   │   ├── globals.css     # Estilos globais
│   │   └── layout.jsx      # Layout raiz da aplicação
│   ├── components/         # Componentes reutilizáveis (UI, Formulários, Mapas)
│   └── lib/                # Arquivos auxiliares (ex: instância Singleton do Prisma)
└── .env                    # Variáveis de ambiente (ex: DATABASE_URL)
```

## ⚙️ Como Rodar o Projeto Localmente

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior recomendada)
- **NPM** ou **Yarn**

### 2. Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
cd clinicatf-next
npm install
```

### 3. Configuração do Banco de Dados

Crie um arquivo `.env` na raiz do projeto e configure a URL do seu banco de dados PostgreSQL e a chave secreta para geração dos tokens JWT:

```env
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
SECRET_KEY="sua_chave_secreta_super_segura"
NEXT_PUBLIC_API_URL="/api"
```

### 4. Prisma e Migrations

Gere o cliente do Prisma e aplique o esquema no seu banco de dados:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

*Opcional:* Se for um banco novo e você quiser preenchê-lo com dados iniciais de demonstração (como o usuário admin, alguns benefícios e procedimentos), execute:

```bash
npx prisma db seed
```
> **Credenciais de teste geradas pelo Seed:**
> **Usuário:** admin
> **Senha:** admin123

### 5. Rodando o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🚀 Deploy

O projeto está otimizado para ser hospedado na **Vercel**.
Lembre-se de configurar as mesmas **Environment Variables** (Variáveis de Ambiente) lá no painel da Vercel (`DATABASE_URL`, `SECRET_KEY`, etc). 

Durante o build (`npm run build`), o Next.js gerará as páginas estáticas e preparará as *Serverless Functions* das rotas da API.

---
Desenvolvido para gerenciamento inteligente da **Clínica TF**.