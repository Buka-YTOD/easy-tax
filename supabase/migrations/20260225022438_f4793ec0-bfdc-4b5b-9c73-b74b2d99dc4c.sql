
-- Tax profiles: one per tax return
CREATE TABLE public.tax_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES public.tax_returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  state_of_residence TEXT NOT NULL DEFAULT '',
  tin TEXT NOT NULL DEFAULT '',
  filing_type TEXT NOT NULL DEFAULT 'Individual',
  is_resident BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(return_id)
);

ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax profiles" ON public.tax_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tax profiles" ON public.tax_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tax profiles" ON public.tax_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tax profiles" ON public.tax_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tax_profiles_updated_at
  BEFORE UPDATE ON public.tax_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Computations: one per scenario
CREATE TABLE public.computations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  total_income NUMERIC NOT NULL DEFAULT 0,
  taxable_income NUMERIC NOT NULL DEFAULT 0,
  tax_owed NUMERIC NOT NULL DEFAULT 0,
  breakdown_json JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(scenario_id)
);

ALTER TABLE public.computations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own computations" ON public.computations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own computations" ON public.computations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own computations" ON public.computations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own computations" ON public.computations FOR DELETE USING (auth.uid() = user_id);
