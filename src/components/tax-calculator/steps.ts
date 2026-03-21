import type { Step, TaxFormData } from './types';

const isMultiple = (d: TaxFormData) => d.incomeType === 'multiple';
const hasBizOrFreelance = (d: TaxFormData) =>
  d.hasBusiness || d.hasFreelance || d.incomeType === 'business' || d.incomeType === 'freelance';

export const STEPS: Step[] = [
  // ─── STEP 1: INTRO ───
  {
    id: 'intro',
    question: "Let's calculate your tax for this year 🇳🇬\n\nHow do you make your money?",
    type: 'options',
    field: 'incomeType',
    options: [
      { label: '💼 I work for a company (salary)', value: 'salary' },
      { label: '🏪 I run a business', value: 'business' },
      { label: '💻 I do freelance / contract work', value: 'freelance' },
      { label: '📊 Multiple income sources', value: 'multiple' },
      { label: '🤷 Not sure', value: 'unsure' },
    ],
    shouldShow: () => true,
  },
  {
    id: 'unsure_help',
    question: "No worries! Income can come from:\n\n• **Salary job** – working for a company\n• **Business** – shop, POS, pharmacy, etc.\n• **Side gigs** – designing, coding, selling online\n\nWhich sounds like you?",
    type: 'options',
    field: 'incomeType',
    options: [
      { label: '💼 Salary', value: 'salary' },
      { label: '🏪 Business', value: 'business' },
      { label: '💻 Freelance', value: 'freelance' },
      { label: '📊 Multiple sources', value: 'multiple' },
    ],
    shouldShow: (d) => d.incomeType === 'unsure',
  },

  // ─── SALARY ───
  {
    id: 'salary_confirm',
    question: "Do you earn a salary from a company?",
    type: 'yesno',
    field: 'hasSalary',
    shouldShow: (d) => isMultiple(d),
  },
  {
    id: 'salary_amount',
    question: "How much do you earn?",
    example: "e.g. ₦500,000 monthly salary",
    type: 'currency-frequency',
    field: 'salaryAmount',
    frequencyField: 'salaryFrequency',
    shouldShow: (d) => d.hasSalary || (!isMultiple(d) && d.incomeType === 'salary'),
  },
  {
    id: 'salary_extras',
    question: "Do you receive any extra money apart from your salary?\n\nLike allowance, bonus, or benefits like a car or accommodation?",
    type: 'yesno',
    field: 'hasExtras',
    shouldShow: (d) => d.hasSalary || (!isMultiple(d) && d.incomeType === 'salary'),
  },
  {
    id: 'salary_extras_amount',
    question: "How much do you receive in extras per year?",
    example: "Total of all allowances, bonuses, and benefits",
    type: 'currency',
    field: 'extrasAmount',
    shouldShow: (d) => d.hasExtras,
  },

  // ─── BUSINESS ───
  {
    id: 'business_confirm',
    question: "Do you run a business or sell anything?",
    type: 'yesno',
    field: 'hasBusiness',
    shouldShow: (d) => isMultiple(d),
  },
  {
    id: 'business_profit',
    question: "How much **profit** did your business make this year?\n\n⚠️ This should be profit after expenses, not total sales.",
    example: "e.g. A shop owner making ₦3,000,000 profit in a year",
    type: 'currency',
    field: 'businessProfit',
    shouldShow: (d) => d.hasBusiness || (!isMultiple(d) && d.incomeType === 'business'),
  },

  // ─── FREELANCE ───
  {
    id: 'freelance_confirm',
    question: "Did you do any freelance, consulting, or side jobs?",
    example: "e.g. building websites, design, writing, advising companies",
    type: 'yesno',
    field: 'hasFreelance',
    shouldShow: (d) => isMultiple(d),
  },
  {
    id: 'freelance_amount',
    question: "How much did you earn in total from freelance this year?",
    type: 'currency',
    field: 'freelanceIncome',
    shouldShow: (d) => d.hasFreelance || (!isMultiple(d) && d.incomeType === 'freelance'),
  },

  // ─── CONTRACT ───
  {
    id: 'contract_confirm',
    question: "Did you complete any major contracts or projects?",
    example: "e.g. building project, supplying goods, tech project",
    type: 'yesno',
    field: 'hasContract',
    shouldShow: (d) => isMultiple(d) || d.incomeType === 'freelance',
  },
  {
    id: 'contract_amount',
    question: "How much did you earn from contracts this year?",
    type: 'currency',
    field: 'contractIncome',
    shouldShow: (d) => d.hasContract,
  },

  // ─── OTHER INCOME ───
  {
    id: 'other_income',
    question: "Did you receive any of these extra payments?\n\n• Commission (e.g. agent work)\n• Bonus\n• Allowances\n• Director fees\n• Profit share",
    type: 'yesno',
    field: 'hasOtherIncome',
    shouldShow: () => true,
  },
  {
    id: 'other_income_amount',
    question: "How much did you receive in total from these?",
    type: 'currency',
    field: 'otherIncomeAmount',
    shouldShow: (d) => d.hasOtherIncome,
  },

  // ─── PASSIVE INCOME ───
  {
    id: 'passive_income',
    question: "Did you make money without actively working?\n\nLike rent from property, dividends from shares, interest from savings, or royalties?",
    type: 'yesno',
    field: 'hasPassiveIncome',
    shouldShow: () => true,
  },
  {
    id: 'passive_rent',
    question: "How much rent income did you receive this year?",
    example: "e.g. ₦2,400,000 from renting out a flat",
    type: 'currency',
    field: 'rentIncome',
    shouldShow: (d) => d.hasPassiveIncome,
  },
  {
    id: 'passive_dividend',
    question: "How much in dividends did you receive?\n\n💡 This is already taxed at source, so we'll note it but won't tax it again.",
    example: "e.g. dividends from Dangote Cement, MTN shares",
    type: 'currency',
    field: 'dividendIncome',
    shouldShow: (d) => d.hasPassiveIncome,
  },
  {
    id: 'passive_interest',
    question: "How much interest did you earn from savings or investments?\n\n💡 Also already taxed at source.",
    example: "e.g. interest from fixed deposits, savings accounts",
    type: 'currency',
    field: 'interestIncome',
    shouldShow: (d) => d.hasPassiveIncome,
  },
  {
    id: 'passive_royalty',
    question: "Any royalty income?",
    example: "e.g. music royalties, content licensing",
    type: 'currency',
    field: 'royaltyIncome',
    shouldShow: (d) => d.hasPassiveIncome,
  },

  // ─── DEDUCTIONS ───
  {
    id: 'pension',
    question: "Does your employer deduct pension from your salary?",
    example: "Usually about 8% of your basic salary",
    type: 'yesno',
    field: 'hasPension',
    shouldShow: () => true,
  },
  {
    id: 'pension_amount',
    question: "How much pension is deducted?",
    example: "e.g. ₦40,000 monthly",
    type: 'currency-frequency',
    field: 'pensionAmount',
    frequencyField: 'pensionFrequency',
    shouldShow: (d) => d.hasPension,
  },
  {
    id: 'nhf',
    question: "Do you contribute to NHF (National Housing Fund)?",
    example: "Usually 2.5% of your basic salary",
    type: 'yesno',
    field: 'hasNhf',
    shouldShow: () => true,
  },
  {
    id: 'nhf_amount',
    question: "How much NHF do you pay per year?",
    type: 'currency',
    field: 'nhfAmount',
    shouldShow: (d) => d.hasNhf,
  },
  {
    id: 'nhis',
    question: "Do you pay for health insurance (NHIS or through your employer)?",
    type: 'yesno',
    field: 'hasNhis',
    shouldShow: () => true,
  },
  {
    id: 'nhis_amount',
    question: "How much do you pay for health insurance per year?",
    type: 'currency',
    field: 'nhisAmount',
    shouldShow: (d) => d.hasNhis,
  },
  {
    id: 'life_assurance',
    question: "Do you pay for any life insurance?",
    type: 'yesno',
    field: 'hasLifeAssurance',
    shouldShow: () => true,
  },
  {
    id: 'life_assurance_amount',
    question: "How much do you pay for life insurance per year?",
    type: 'currency',
    field: 'lifeAssuranceAmount',
    shouldShow: (d) => d.hasLifeAssurance,
  },

  // ─── RENT RELIEF ───
  {
    id: 'rent_relief',
    question: "Do you pay rent for where you live?",
    type: 'yesno',
    field: 'paysRent',
    shouldShow: () => true,
  },
  {
    id: 'rent_relief_amount',
    question: "How much rent do you pay per year?",
    example: "e.g. ₦1,500,000 yearly rent",
    type: 'currency',
    field: 'yearlyRent',
    shouldShow: (d) => d.paysRent,
  },

  // ─── FAMILY ───
  {
    id: 'children',
    question: "Do you have children you take care of financially?",
    example: "Children in school or fully dependent on you",
    type: 'yesno',
    field: 'hasChildren',
    shouldShow: () => true,
  },
  {
    id: 'children_count',
    question: "How many children?",
    type: 'number',
    field: 'childrenCount',
    shouldShow: (d) => d.hasChildren,
  },
  {
    id: 'dependents',
    question: "Do you support any family members financially?",
    example: "e.g. sending money to parents or siblings",
    type: 'yesno',
    field: 'hasDependents',
    shouldShow: () => true,
  },
  {
    id: 'dependents_amount',
    question: "How much do you send them in a year total?",
    type: 'currency',
    field: 'dependentsAmount',
    shouldShow: (d) => d.hasDependents,
  },

  // ─── BUSINESS ADJUSTMENTS ───
  {
    id: 'business_loss',
    question: "Did your business make a loss this year?",
    type: 'yesno',
    field: 'hasBusinessLoss',
    shouldShow: hasBizOrFreelance,
  },
  {
    id: 'business_loss_amount',
    question: "How much was the loss?",
    type: 'currency',
    field: 'businessLossAmount',
    shouldShow: (d) => d.hasBusinessLoss,
  },
  {
    id: 'equipment_bought',
    question: "Did you buy any major equipment for your business?",
    example: "e.g. generator, laptop, delivery van, machines",
    type: 'yesno',
    field: 'boughtEquipment',
    shouldShow: hasBizOrFreelance,
  },
  {
    id: 'equipment_cost',
    question: "How much did you spend on equipment?",
    type: 'currency',
    field: 'equipmentCost',
    shouldShow: (d) => d.boughtEquipment,
  },
  {
    id: 'equipment_sold',
    question: "Did you sell any business equipment this year?",
    type: 'yesno',
    field: 'soldEquipment',
    shouldShow: hasBizOrFreelance,
  },
  {
    id: 'equipment_sale_proceeds',
    question: "How much did you sell it for?",
    type: 'currency',
    field: 'equipmentSaleProceeds',
    shouldShow: (d) => d.soldEquipment,
  },
];
