CREATE TABLE integration_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id text NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  platform_id text NOT NULL CHECK (platform_id IN ('ifood', 'rappi', '99food', 'aiqfome')),
  merchant_id text,
  merchant_uuid text,
  client_id text,
  client_secret text,
  webhook_secret text,
  enabled boolean DEFAULT false,
  status text DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (empresa_id, platform_id)
);

ALTER TABLE integration_platforms ENABLE ROW LEVEL SECURITY;
