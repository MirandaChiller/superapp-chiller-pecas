-- =============================================
-- SCHEMA DO BANCO DE DADOS - SUPERAPP CHILLER PEÇAS
-- =============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: PERSONAS
-- =============================================
CREATE TABLE IF NOT EXISTS personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados básicos
    nome VARCHAR(255) NOT NULL,
    idade_min INT,
    idade_max INT,
    profissao VARCHAR(255),
    
    -- Dados estruturados (JSON)
    dados_demograficos JSONB DEFAULT '{}'::jsonb,
    
    -- IA Generated (preparado para futuro)
    narrativa_gerada TEXT,
    imagem_url TEXT
);

-- =============================================
-- TABELA: POSICIONAMENTOS
-- =============================================
CREATE TABLE IF NOT EXISTS posicionamentos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Dados das 3 etapas (JSON)
    canvas_data JSONB DEFAULT '{}'::jsonb,
    ikigai_data JSONB DEFAULT '{}'::jsonb,
    declaracao TEXT
);

-- =============================================
-- TABELA: CONTENT PIE (Temas e Intensidades)
-- =============================================
CREATE TABLE IF NOT EXISTS content_pie (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    posts_por_dia INT DEFAULT 3,
    temas JSONB DEFAULT '[]'::jsonb -- [{nome: string, percentual: number}]
);

-- =============================================
-- TABELA: POSTS PLANEJADOS (Feed)
-- =============================================
CREATE TABLE IF NOT EXISTS posts_planejados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    data_publicacao DATE,
    tema VARCHAR(255) NOT NULL,
    objetivo VARCHAR(100) NOT NULL,
    formato VARCHAR(50) NOT NULL,
    sub_formato VARCHAR(255) NOT NULL,
    gancho TEXT,
    conteudo TEXT,
    cta TEXT,
    status VARCHAR(50) DEFAULT 'planejado', -- planejado, em_producao, aprovado, publicado
    link_publicado TEXT
);

-- =============================================
-- TABELA: MÉTRICAS DE POSTS (Indicadores)
-- =============================================
CREATE TABLE IF NOT EXISTS metricas_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    post_id UUID REFERENCES posts_planejados(id) ON DELETE CASCADE,
    data_coleta DATE NOT NULL,
    
    -- Métricas orgânicas
    curtidas INT DEFAULT 0,
    comentarios INT DEFAULT 0,
    salvamentos INT DEFAULT 0,
    compartilhamentos INT DEFAULT 0,
    seguidores INT DEFAULT 0,
    visitas_perfil INT DEFAULT 0,
    
    -- Score calculado automaticamente
    score DECIMAL(10,2) GENERATED ALWAYS AS (
        (curtidas * 0.10) + 
        (comentarios * 0.15) + 
        (salvamentos * 1.00) + 
        (compartilhamentos * 2.00) + 
        (seguidores * 10.00)
    ) STORED,
    
    -- Categoria calculada automaticamente
    categoria VARCHAR(50) GENERATED ALWAYS AS (
        CASE 
            WHEN ((curtidas * 0.10) + (comentarios * 0.15) + (salvamentos * 1.00) + (compartilhamentos * 2.00) + (seguidores * 10.00)) <= 50 THEN 'RUIM'
            WHEN ((curtidas * 0.10) + (comentarios * 0.15) + (salvamentos * 1.00) + (compartilhamentos * 2.00) + (seguidores * 10.00)) <= 100 THEN 'ÓTIMO'
            WHEN ((curtidas * 0.10) + (comentarios * 0.15) + (salvamentos * 1.00) + (compartilhamentos * 2.00) + (seguidores * 10.00)) > 150 AND visitas_perfil >= 150 THEN 'SUPER EXCELENTE'
            ELSE 'EXCELENTE'
        END
    ) STORED,
    
    -- Tráfego pago
    investimento DECIMAL(10,2),
    publico VARCHAR(100),
    ganho_seguidores_impulsionamento INT,
    custo_por_seguidor DECIMAL(10,2)
);

-- =============================================
-- TABELA: CAMPANHAS DE TRÁFEGO PAGO (Magic Metrics)
-- =============================================
CREATE TABLE IF NOT EXISTS campanhas_trafego (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    nome VARCHAR(255) NOT NULL,
    data_analise DATE NOT NULL,
    
    -- Checklist estruturado (JSON)
    checklist_itens JSONB DEFAULT '[]'::jsonb 
    -- [{categoria: string, item: string, checked: boolean, observacao: string}]
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX idx_posts_data_publicacao ON posts_planejados(data_publicacao);
CREATE INDEX idx_posts_status ON posts_planejados(status);
CREATE INDEX idx_posts_tema ON posts_planejados(tema);
CREATE INDEX idx_metricas_post_id ON metricas_posts(post_id);
CREATE INDEX idx_metricas_data_coleta ON metricas_posts(data_coleta);
CREATE INDEX idx_campanhas_data_analise ON campanhas_trafego(data_analise);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posicionamentos_updated_at BEFORE UPDATE ON posicionamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pie_updated_at BEFORE UPDATE ON content_pie
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_planejados_updated_at BEFORE UPDATE ON posts_planejados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanhas_trafego_updated_at BEFORE UPDATE ON campanhas_trafego
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir Content Pie inicial (vazio, usuário criará temas)
INSERT INTO content_pie (posts_por_dia, temas) 
VALUES (3, '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- =============================================
-- POLÍTICAS RLS (Row Level Security) - DESABILITADO
-- =============================================
-- Como o app é interno e todos têm acesso total, RLS está desabilitado
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE posicionamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_pie DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts_planejados DISABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_trafego DISABLE ROW LEVEL SECURITY;
