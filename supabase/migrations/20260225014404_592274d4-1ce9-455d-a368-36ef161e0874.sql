
-- Core tax return table
CREATE TABLE public.tax_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tax_year)
);

ALTER TABLE public.tax_returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own returns" ON public.tax_returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own returns" ON public.tax_returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own returns" ON public.tax_returns FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_tax_returns_updated_at BEFORE UPDATE ON public.tax_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scenarios (up to 5 per return)
CREATE TABLE public.return_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.tax_returns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Scenario 1',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.return_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scenarios" ON public.return_scenarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scenarios" ON public.return_scenarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenarios" ON public.return_scenarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenarios" ON public.return_scenarios FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_return_scenarios_updated_at BEFORE UPDATE ON public.return_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enforce max 5 scenarios per return
CREATE OR REPLACE FUNCTION public.check_scenario_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.return_scenarios WHERE return_id = NEW.return_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 scenarios per return';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_scenario_limit BEFORE INSERT ON public.return_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.check_scenario_limit();

-- Income records per scenario
CREATE TABLE public.income_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'Employment',
  amount numeric NOT NULL DEFAULT 0,
  frequency text NOT NULL DEFAULT 'Annual',
  description text,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own income" ON public.income_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON public.income_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON public.income_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON public.income_records FOR DELETE USING (auth.uid() = user_id);

-- Capital gains per scenario
CREATE TABLE public.capital_gains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'Other',
  proceeds numeric NOT NULL DEFAULT 0,
  cost_basis numeric NOT NULL DEFAULT 0,
  fees numeric NOT NULL DEFAULT 0,
  realized_at timestamptz,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_gains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own gains" ON public.capital_gains FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gains" ON public.capital_gains FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gains" ON public.capital_gains FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gains" ON public.capital_gains FOR DELETE USING (auth.uid() = user_id);

-- Documents linked to a return
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.tax_returns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  status text NOT NULL DEFAULT 'uploaded',
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generated forms (Form A, filing packs)
CREATE TABLE public.generated_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_type text NOT NULL DEFAULT 'form_a',
  summary_json jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own forms" ON public.generated_forms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own forms" ON public.generated_forms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own forms" ON public.generated_forms FOR UPDATE USING (auth.uid() = user_id);

-- System flags for detected issues
CREATE TABLE public.system_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL REFERENCES public.tax_returns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  message text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  metadata_json jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own flags" ON public.system_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own flags" ON public.system_flags FOR UPDATE USING (auth.uid() = user_id);

-- Add phone_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
