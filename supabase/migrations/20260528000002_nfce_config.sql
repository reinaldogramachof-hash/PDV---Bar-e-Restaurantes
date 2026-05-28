-- Criação da tabela nfce_configs
CREATE TABLE public.nfce_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    cnpj VARCHAR(14),
    token_homologacao VARCHAR(255),
    token_producao VARCHAR(255),
    csc_id VARCHAR(6),
    csc_token VARCHAR(255),
    ambiente VARCHAR(15) NOT NULL DEFAULT 'homologacao',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id)
);

ALTER TABLE public.nfce_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own empresa nfce config" ON public.nfce_configs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.usuarios WHERE empresa_id = nfce_configs.empresa_id
        )
    );

CREATE POLICY "Users with master/gerente role can edit nfce config" ON public.nfce_configs
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.usuarios WHERE empresa_id = nfce_configs.empresa_id AND role IN ('master', 'gerente')
        )
    );

-- Criação da tabela nfce_logs
CREATE TABLE public.nfce_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    ref VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    ambiente VARCHAR(15) NOT NULL,
    numero VARCHAR(20),
    serie VARCHAR(3),
    chave VARCHAR(44),
    xml_url TEXT,
    danfe_url TEXT,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.nfce_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own empresa nfce logs" ON public.nfce_logs
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM public.usuarios WHERE empresa_id = nfce_logs.empresa_id
        )
    );

CREATE POLICY "Users can insert nfce logs in their own empresa" ON public.nfce_logs
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.usuarios WHERE empresa_id = nfce_logs.empresa_id
        )
    );

CREATE POLICY "Users can update nfce logs in their own empresa" ON public.nfce_logs
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM public.usuarios WHERE empresa_id = nfce_logs.empresa_id
        )
    );
