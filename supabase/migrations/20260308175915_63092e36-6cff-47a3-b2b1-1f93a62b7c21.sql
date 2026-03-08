ALTER TABLE public.generated_forms
  ADD COLUMN IF NOT EXISTS pdf_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS webhook_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS webhook_received_at timestamptz DEFAULT NULL;