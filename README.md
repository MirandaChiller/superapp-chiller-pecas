# 🚀 Superapp Chiller Peças - Marketing Intelligence Platform

> Plataforma completa de inteligência de marketing integrada para gestão estratégica de conteúdo e métricas

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black)

## 📋 Sobre o Projeto

O Superapp Chiller Peças é uma plataforma web completa que integra 6 ferramentas essenciais de marketing digital:

1. **Gerador de Personas** - Crie personas detalhadas com IA da Anthropic
2. **Posicionamento de Marca** - Canvas + IKIGAI + Declaração estratégica
3. **Content Pie Planner** - Planejamento de temas e intensidades de conteúdo
4. **Planejamento de Feed** - Gestão completa de calendário editorial
5. **Magic Metrics Matcher** - Checklist de otimização para tráfego pago
6. **Indicadores de Performance** - Sistema de score e análise de métricas

## 🎯 Funcionalidades

### ✨ Principais Recursos

- 🤖 **IA Integrada** - Geração automática de narrativas de personas
- 📊 **Sistema de Score** - Cálculo automático de performance de posts
- 🔗 **Integrações** - Fluxo de dados entre ferramentas
- 📄 **Exports** - PDF, DOCX e XLSX profissionais
- 💾 **Persistência** - Dados salvos permanentemente
- 👥 **Multi-usuário** - Acesso simultâneo sem conflitos

### 🔗 Integrações do Sistema

```
Persona → Posicionamento → Content Pie → Feed → Indicadores
                              ↓            ↓
                           (Temas)    (Métricas)
```

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **IA**: Anthropic Claude API
- **Deploy**: Vercel
- **Exports**: jsPDF, docx.js, exceljs

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/superapp-chiller-pecas.git
cd superapp-chiller-pecas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Execute o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## 🗄️ Configuração do Banco de Dados

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o schema SQL localizado em `/supabase/schema.sql`
3. Configure as variáveis de ambiente

## 🚀 Deploy na Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente
3. Deploy automático!

## 📝 Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave
SUPABASE_SERVICE_ROLE_KEY=sua-service-key

# Anthropic (opcional)
ANTHROPIC_API_KEY=sua-api-key
```

## 📱 Ferramentas Detalhadas

### 1️⃣ Gerador de Personas
- Criação com campos estruturados
- Geração de narrativa com IA
- Export em PDF e DOCX
- Armazenamento permanente

### 2️⃣ Posicionamento de Marca
- Canvas da Marca (3 etapas independentes)
- Diagrama IKIGAI
- Declaração de posicionamento automática
- Export em PDF e DOCX

### 3️⃣ Content Pie Planner
- Definição de temas customizáveis
- Cálculo automático de volume (posts/dia × 30)
- Visualização em gráfico pizza
- Export em PDF

### 4️⃣ Planejamento de Feed
- Importação automática de temas do Content Pie
- 3 formatos + 28 sub-formatos
- 5 objetivos estratégicos
- Sistema de status (Planejado → Publicado)
- Export em PDF

### 5️⃣ Magic Metrics Matcher
- Checklist por campanha
- Múltiplas campanhas individuais
- Histórico de análises
- Export em XLSX

### 6️⃣ Indicadores de Performance
- Vinculação com posts do Feed
- Score automático em tempo real
- Sistema de pesos e categorias
- Export em XLSX

## 📊 Sistema de Pontuação

```
SCORE = (Curtidas × 0,10) + 
        (Comentários × 0,15) + 
        (Salvamentos × 1,00) + 
        (Compartilhamentos × 2,00) + 
        (Seguidores × 10,00)
```

**Categorias:**
- RUIM: ≤ 50
- ÓTIMO: 50-100
- EXCELENTE: 100-150
- SUPER EXCELENTE: > 150 + Visitas ≥ 150

## 🏗️ Estrutura do Projeto

```
superapp-chiller-pecas/
├── app/                    # Páginas Next.js 14
│   ├── personas/          # Gerador de Personas
│   ├── posicionamento/    # Posicionamento de Marca
│   ├── content-pie/       # Temas e Intensidades
│   ├── feed/              # Planejamento de Feed
│   ├── metrics-matcher/   # Métricas Tráfego
│   └── indicadores/       # Indicadores Performance
├── components/            # Componentes React
├── lib/                   # Utilitários
│   ├── supabase.ts       # Cliente Supabase
│   └── exports/          # Funções de export
├── supabase/             # Schema SQL
└── public/               # Assets estáticos
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da Chiller Peças.

## 👥 Equipe

Desenvolvido pela equipe de Marketing da Chiller Peças.

## 📞 Suporte

Para suporte, entre em contato com a equipe de TI.

---

**Chiller Peças** - Marketing Intelligence Platform
