export const endpoints = {
  taxProfile: (taxYear: number) => `/v1/tax-profiles/${taxYear}`,
  income: (taxYear: number) => `/v1/tax-years/${taxYear}/income`,
  incomeById: (taxYear: number, id: string) => `/v1/tax-years/${taxYear}/income/${id}`,
  capitalGains: (taxYear: number) => `/v1/tax-years/${taxYear}/capital-gains`,
  capitalGainById: (taxYear: number, id: string) => `/v1/tax-years/${taxYear}/capital-gains/${id}`,
  deductions: (taxYear: number) => `/v1/tax-years/${taxYear}/deductions`,
  deductionById: (taxYear: number, id: string) => `/v1/tax-years/${taxYear}/deductions/${id}`,
  compute: (taxYear: number) => `/v1/tax-years/${taxYear}/compute`,
  computation: (taxYear: number) => `/v1/tax-years/${taxYear}/computation`,
  filingPack: (taxYear: number) => `/v1/tax-years/${taxYear}/filing-pack`,
  classifyIncome: (taxYear: number) => `/v1/tax-years/${taxYear}/ai/classify-income`,
  aiChat: (taxYear: number) => `/v1/tax-years/${taxYear}/ai/chat`,
};
