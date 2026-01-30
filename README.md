# B2B Lead Engine - Versão Offlabel

Sistema inteligente de captação e enriquecimento de leads B2B baseado em inteligência artificial.

## 🚀 Funcionalidades

- **Captação Híbrida:** Extração de dados de PDFs (listas, notas fiscais) ou busca proativa na web por palavras-chave.
- **Enriquecimento Inteligente:** Integração com BrasilAPI e IA Gemini 2.0 Flash para estruturar dados e descobrir e-mails corporativos.
- **CRM Integrado:** Fluxo de gestão de contatos com respostas padronizadas e histórico.
- **Dashboard Admin:** Visão macro da operação, logs de performance e exportação de dados.
- **Multi-Tema:** Suporte completo a modo claro/escuro.

## 🛠️ Instalação e Configuração

### 1. Requisitos
- Node.js (v18+)
- Conta no Supabase
- Chave de API do Google AI Studio (Gemini)

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e preencha as chaves:
```bash
cp .env.example .env
```

### 3. Banco de Dados (Supabase)
Importe as tabelas necessárias:
- `leads`: (id, c_id, cnpj, razao_social, email, telefone, status, contacted, userId, etc.)
- `profiles`: (id, email, full_name, created_at)

### 4. Rodar o Projeto
```bash
npm install
npm run dev
```

## 🛡️ Segurança e Customização
Esta é uma versão "White Label". Você pode alterar as cores em `constants.tsx` e customizar a logo no sidebar em `App.tsx`.

A proteção de rotas admin é baseada no email configurado em `VITE_ADMIN_EMAIL` no seu arquivo `.env`.

---
Feito com ❤️ para escalar operações de vendas.
