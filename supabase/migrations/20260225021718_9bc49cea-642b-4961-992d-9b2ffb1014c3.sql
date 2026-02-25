
-- Create deductions table linked to scenarios
CREATE TABLE public.deductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.return_scenarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'Other',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own deductions"
  ON public.deductions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deductions"
  ON public.deductions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deductions"
  ON public.deductions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deductions"
  ON public.deductions FOR DELETE
  USING (auth.uid() = user_id);
