
-- Step 1: Extend tax_profiles with personal particulars for Form A Part A
ALTER TABLE public.tax_profiles
  ADD COLUMN IF NOT EXISTS marital_status text NOT NULL DEFAULT 'Single',
  ADD COLUMN IF NOT EXISTS spouse_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS num_children integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS sex text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS employer_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS employer_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS employer_tin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS occupation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS residential_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lga text NOT NULL DEFAULT '';

-- Step 2: Benefits in Kind table (Form A Part C)
CREATE TABLE public.benefits_in_kind (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  description text,
  annual_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benefits_in_kind ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bik" ON public.benefits_in_kind FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bik" ON public.benefits_in_kind FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bik" ON public.benefits_in_kind FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bik" ON public.benefits_in_kind FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Assets declaration table (Form A Part D)
CREATE TABLE public.asset_declarations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  asset_type text NOT NULL DEFAULT 'Other',
  description text,
  location text NOT NULL DEFAULT '',
  date_acquired date,
  cost numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.asset_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.asset_declarations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.asset_declarations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.asset_declarations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.asset_declarations FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Capital allowances table (Form A Part E — business filers)
CREATE TABLE public.capital_allowances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id uuid NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  asset_description text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  rate_percent numeric NOT NULL DEFAULT 0,
  allowance_amount numeric NOT NULL DEFAULT 0,
  year_acquired integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capital_allowances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allowances" ON public.capital_allowances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allowances" ON public.capital_allowances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own allowances" ON public.capital_allowances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own allowances" ON public.capital_allowances FOR DELETE USING (auth.uid() = user_id);
