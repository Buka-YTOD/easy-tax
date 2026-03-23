import { formatNaira, formatDate } from '@/lib/format';

interface FormH1DocumentProps {
  data: any;
}

/**
 * LIRS Form H1 — Employer's Annual Declaration of Emoluments
 *
 * Official LIRS structure:
 *  Page 1: Employer Particulars
 *  Page 2: Schedule of Employees & 5-Class Emolument Table
 *  Page 3: Benefits in Kind Schedule
 *  Page 4: Statutory Deductions & CRA/PAYE Computation
 *  Page 5: Employer's Declaration & Official Use
 */
export function FormH1Document({ data }: FormH1DocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const gains = Array.isArray(data.capitalGains) ? data.capitalGains : [];
  const benefitsInKind = Array.isArray(data.benefitsInKind) ? data.benefitsInKind : [];
  const capitalAllowances = Array.isArray(data.capitalAllowances) ? data.capitalAllowances : [];

  // ── 5 Classes of Emoluments ──
  const classifyIncome = (type: string, description?: string) => {
    const desc = (description || '').toLowerCase();
    const t = (type || '').toLowerCase();
    if (t === 'employment' && !desc) return 'basic';
    if (desc.includes('housing') || desc.includes('rent allow')) return 'housing';
    if (desc.includes('transport') || desc.includes('motor') || desc.includes('vehicle')) return 'transport';
    if (desc.includes('leave') || desc.includes('vacation')) return 'leave';
    if (desc.includes('basic') || desc.includes('salary') || desc.includes('wage')) return 'basic';
    if (['Employment'].includes(type)) return 'basic';
    return 'other';
  };

  const emolumentClasses = { basic: 0, housing: 0, transport: 0, leave: 0, other: 0 };
  const employmentIncomes = incomes.filter((r: any) =>
    ['Employment', 'Business', 'Freelance'].includes(r.type)
  );
  const nonEmploymentIncomes = incomes.filter((r: any) =>
    !['Employment', 'Business', 'Freelance'].includes(r.type)
  );

  employmentIncomes.forEach((r: any) => {
    const cls = classifyIncome(r.type, r.description);
    emolumentClasses[cls as keyof typeof emolumentClasses] += r.amount || 0;
  });
  // Business/Freelance income goes to "other" class
  nonEmploymentIncomes.forEach((r: any) => {
    emolumentClasses.other += r.amount || 0;
  });

  const totalEmoluments = Object.values(emolumentClasses).reduce((a, b) => a + b, 0);
  const totalBIK = benefitsInKind.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);
  const totalAllowances = capitalAllowances.reduce((s: number, a: any) => s + (a.allowanceAmount || 0), 0);
  const totalGains = gains.reduce((s: number, r: any) =>
    s + Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0)), 0
  );

  // Deduction categories
  const pensionDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('pension'));
  const nhfDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('nhf') || d.type?.toLowerCase().includes('housing fund'));
  const nhisDeductions = deductions.filter((d: any) => d.type?.toLowerCase().includes('health') || d.type?.toLowerCase().includes('nhis'));
  const otherDeds = deductions.filter((d: any) =>
    !d.type?.toLowerCase().includes('pension') &&
    !d.type?.toLowerCase().includes('nhf') &&
    !d.type?.toLowerCase().includes('housing fund') &&
    !d.type?.toLowerCase().includes('health') &&
    !d.type?.toLowerCase().includes('nhis')
  );
  const totalPension = pensionDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalNHF = nhfDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalNHIS = nhisDeductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalStatutoryDeductions = deductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // Gross = emoluments + BIK + capital gains
  const grossIncome = totalEmoluments + totalBIK + totalGains;

  // CRA
  const craBase = Math.max(grossIncome * 0.01, 200000);
  const craTwentyPercent = grossIncome * 0.20;
  const cra = craBase + craTwentyPercent;
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, grossIncome - totalStatutoryDeductions - totalAllowances - cra);

  // 2026 Progressive brackets
  const brackets = [
    { lower: 0, upper: 800000, rate: 0 },
    { lower: 800000, upper: 3200000, rate: 15 },
    { lower: 3200000, upper: 12000000, rate: 18 },
    { lower: 12000000, upper: 25000000, rate: 21 },
    { lower: 25000000, upper: Infinity, rate: 25 },
  ];
  const computedBrackets = brackets.map(b => {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, b.upper) - b.lower);
    return { ...b, taxableInBracket, tax: taxableInBracket * (b.rate / 100) };
  });
  const computedTax = computation?.taxOwed ?? computedBrackets.reduce((s, b) => s + b.tax, 0);

  const revenueService = profile?.stateOfResidence === 'Lagos'
    ? 'Lagos State Internal Revenue Service (LIRS)'
    : profile?.stateOfResidence === 'FCT Abuja'
    ? 'FCT Internal Revenue Service (FCT-IRS)'
    : `${profile?.stateOfResidence || ''} State Board of Internal Revenue`;

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm" id="form-h1-document">
      {/* ══════════════════════════════════════════════════════════
          OFFICIAL HEADER
         ══════════════════════════════════════════════════════════ */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500">Federal Republic of Nigeria</p>
          <h1 className="text-sm md:text-lg font-bold uppercase tracking-wide">{revenueService}</h1>
          <div className="border-t border-b border-gray-400 py-2 my-2">
            <h2 className="text-xs md:text-base font-bold uppercase">
              Form H1 — Employer's Annual Declaration of Emoluments &amp; Tax Deducted
            </h2>
            <p className="text-xs">
              Personal Income Tax Act (PITA) — For Year Ended 31st December {data.taxYear}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            To be completed and filed by every employer for each employee in their service during the year of assessment
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SECTION 1: PARTICULARS OF EMPLOYER
         ══════════════════════════════════════════════════════════ */}
      <H1Section num="1" title="Particulars of Employer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <H1Field label="(a) Name of Employer / Business" value={profile?.employerName || data.fullName || '—'} />
          <H1Field label="(b) Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <H1Field label="(c) PAYE Registration Number" value="—" />
          <H1Field label="(d) Registered Address" value={profile?.employerAddress || profile?.residentialAddress || '—'} />
          <H1Field label="(e) Nature of Business / Industry" value={profile?.occupation || '—'} />
          <H1Field label="(f) State of Operation" value={profile?.stateOfResidence || '—'} />
          <H1Field label="(g) Tax Year / Period" value={`January – December ${data.taxYear}`} />
          <H1Field label="(h) Number of Employees" value="1" />
          <H1Field label="(i) Employer Category" value={profile?.isResident ? 'Resident Employer' : 'Non-Resident Employer'} />
        </div>
      </H1Section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 2: SCHEDULE OF EMPLOYEES — 5-CLASS EMOLUMENT TABLE
         ══════════════════════════════════════════════════════════ */}
      <H1Section num="2" title="Schedule of Employees and Emoluments Paid">
        <p className="text-[10px] text-gray-500 italic px-3 mb-3">
          Classify each employee's annual emoluments into the five (5) classes below. Attach additional schedules if necessary.
        </p>

        {/* Desktop 5-class table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400">
                <th rowSpan={2} className="border border-gray-300 px-2 py-1.5 text-left text-[10px] w-8">S/N</th>
                <th rowSpan={2} className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Name of Employee</th>
                <th rowSpan={2} className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">TIN</th>
                <th colSpan={5} className="border border-gray-300 px-2 py-1 text-center text-[10px] font-bold bg-gray-200">
                  Classes of Emoluments (₦)
                </th>
                <th rowSpan={2} className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Total<br/>Emoluments (₦)</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="border border-gray-300 px-2 py-1 text-right text-[9px]">Class 1<br/>Basic Salary</th>
                <th className="border border-gray-300 px-2 py-1 text-right text-[9px]">Class 2<br/>Housing</th>
                <th className="border border-gray-300 px-2 py-1 text-right text-[9px]">Class 3<br/>Transport</th>
                <th className="border border-gray-300 px-2 py-1 text-right text-[9px]">Class 4<br/>Leave</th>
                <th className="border border-gray-300 px-2 py-1 text-right text-[9px]">Class 5<br/>Other Allowances</th>
              </tr>
            </thead>
            <tbody>
              {/* Employee row */}
              <tr className="border-b border-gray-200">
                <td className="border border-gray-200 px-2 py-2 text-center">1</td>
                <td className="border border-gray-200 px-2 py-2 font-medium">{data.fullName || '—'}</td>
                <td className="border border-gray-200 px-2 py-2">{profile?.tin || '—'}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.basic)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.housing)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.transport)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.leave)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.other)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono font-bold">{formatNaira(totalEmoluments)}</td>
              </tr>
              {/* Empty rows for additional employees */}
              {[2, 3, 4].map(n => (
                <tr key={n} className="border-b border-gray-200 text-gray-300">
                  <td className="border border-gray-200 px-2 py-2 text-center">{n}</td>
                  <td className="border border-gray-200 px-2 py-2">—</td>
                  <td className="border border-gray-200 px-2 py-2">—</td>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <td key={i} className="border border-gray-200 px-2 py-2 text-right">—</td>
                  ))}
                </tr>
              ))}
              {/* Totals */}
              <tr className="border-t-2 border-black font-bold bg-gray-50">
                <td colSpan={3} className="border border-gray-300 px-2 py-2 text-right text-[10px] uppercase">Grand Total</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.basic)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.housing)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.transport)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.leave)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(emolumentClasses.other)}</td>
                <td className="border border-gray-300 px-2 py-2 text-right font-mono">{formatNaira(totalEmoluments)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked 5-class view */}
        <div className="sm:hidden px-3 space-y-3">
          <div className="border border-gray-300 rounded p-3">
            <p className="font-medium text-xs mb-2">{data.fullName || '—'} <span className="text-gray-400 font-normal">TIN: {profile?.tin || '—'}</span></p>
            <div className="space-y-1.5">
              <EmolumentMobileRow label="Class 1 — Basic Salary" amount={emolumentClasses.basic} />
              <EmolumentMobileRow label="Class 2 — Housing" amount={emolumentClasses.housing} />
              <EmolumentMobileRow label="Class 3 — Transport" amount={emolumentClasses.transport} />
              <EmolumentMobileRow label="Class 4 — Leave" amount={emolumentClasses.leave} />
              <EmolumentMobileRow label="Class 5 — Other" amount={emolumentClasses.other} />
              <div className="flex justify-between pt-2 border-t border-black font-bold text-xs">
                <span>Total Emoluments</span>
                <span className="font-mono">{formatNaira(totalEmoluments)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemised breakdown below the table */}
        <div className="mt-4 px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Detailed Breakdown of Emoluments</p>
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left px-2 py-1.5 text-[10px]">S/N</th>
                  <th className="text-left px-2 py-1.5 text-[10px]">Description</th>
                  <th className="text-left px-2 py-1.5 text-[10px]">Type</th>
                  <th className="text-left px-2 py-1.5 text-[10px]">Class</th>
                  <th className="text-left px-2 py-1.5 text-[10px]">Frequency</th>
                  <th className="text-right px-2 py-1.5 text-[10px]">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((r: any, i: number) => {
                  const cls = classifyIncome(r.type, r.description);
                  const classLabel = { basic: '1', housing: '2', transport: '3', leave: '4', other: '5' }[cls] || '5';
                  return (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-2 py-1.5">{i + 1}</td>
                      <td className="px-2 py-1.5">{r.description || emolumentLabel(r.type)}</td>
                      <td className="px-2 py-1.5">{r.type}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="bg-gray-200 text-[9px] font-bold px-1.5 py-0.5 rounded">{classLabel}</span>
                      </td>
                      <td className="px-2 py-1.5">{r.frequency}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                    </tr>
                  );
                })}
                {incomes.length === 0 && (
                  <tr><td colSpan={6} className="px-2 py-3 text-center text-gray-400 italic">No emoluments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2">
            {incomes.map((r: any, i: number) => (
              <div key={i} className="flex justify-between border-b border-gray-100 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{r.description || emolumentLabel(r.type)}</p>
                  <p className="text-[10px] text-gray-500">{r.type} · {r.frequency}</p>
                </div>
                <span className="font-mono text-xs ml-2 shrink-0">{formatNaira(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </H1Section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 3: BENEFITS IN KIND
         ══════════════════════════════════════════════════════════ */}
      <H1Section num="3" title="Benefits in Kind Provided to Employees">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Particulars of all benefits in kind provided to employees — accommodation, motor vehicle, domestic staff, etc.
        </p>
        {benefitsInKind.length > 0 ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs border border-gray-300">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">S/N</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Employee Name</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Nature of Benefit</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Description</th>
                    <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Annual Value (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitsInKind.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                      <td className="border border-gray-200 px-2 py-1.5">{data.fullName || '—'}</td>
                      <td className="border border-gray-200 px-2 py-1.5">{b.category}</td>
                      <td className="border border-gray-200 px-2 py-1.5">{b.description || '—'}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(b.annualValue)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black font-bold bg-gray-50">
                    <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-right text-[10px] uppercase">Total Benefits in Kind</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalBIK)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 px-3">
              {benefitsInKind.map((b: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-200 py-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{b.category}</p>
                    <p className="text-[10px] text-gray-500">{b.description || '—'}</p>
                  </div>
                  <span className="font-mono text-xs ml-2 shrink-0">{formatNaira(b.annualValue)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-xs">
                <span>Total BIK</span>
                <span className="font-mono">{formatNaira(totalBIK)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic px-3 py-2">No benefits in kind declared for this period.</p>
        )}
      </H1Section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 4: STATUTORY DEDUCTIONS & TAX-FREE ITEMS
         ══════════════════════════════════════════════════════════ */}
      <H1Section num="4" title="Statutory Deductions — Tax-Free Items">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Employee's contributions under the Pension Reform Act, National Housing Fund Act, and NHIS
        </p>
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300">
                <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Employee</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Pension (8%)</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">NHF (2.5%)</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">NHIS (5%)</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Other Reliefs</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Total Deductions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="border border-gray-200 px-2 py-1.5 font-medium">{data.fullName || '—'}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(totalPension)}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(totalNHF)}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(totalNHIS)}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">
                  {formatNaira(otherDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0))}
                </td>
                <td className="border border-gray-200 px-2 py-1.5 text-right font-mono font-bold">{formatNaira(totalStatutoryDeductions)}</td>
              </tr>
              <tr className="border-t-2 border-black font-bold bg-gray-50">
                <td className="border border-gray-300 px-2 py-1.5 text-right text-[10px] uppercase">Total</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalPension)}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalNHF)}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalNHIS)}</td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">
                  {formatNaira(otherDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0))}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalStatutoryDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sm:hidden px-3 space-y-1.5">
          <EmolumentMobileRow label="Pension (8%)" amount={totalPension} />
          <EmolumentMobileRow label="NHF (2.5%)" amount={totalNHF} />
          <EmolumentMobileRow label="NHIS (5%)" amount={totalNHIS} />
          <EmolumentMobileRow label="Other Reliefs" amount={otherDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0)} />
          <div className="flex justify-between pt-2 border-t border-black font-bold text-xs">
            <span>Total Deductions</span>
            <span className="font-mono">{formatNaira(totalStatutoryDeductions)}</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 italic px-3 mt-2">
          Attach PFA statements, NHF receipts, and NHIS evidence of contributions.
        </p>
      </H1Section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 5: CRA & PAYE COMPUTATION
         ══════════════════════════════════════════════════════════ */}
      <H1Section num="5" title="Tax Computation — CRA & PAYE per Employee">
        {/* Computation summary table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400">
                <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Employee</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Total<br/>Emoluments</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Benefits<br/>in Kind</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Gross<br/>Income</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Statutory<br/>Deductions</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">CRA</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Taxable<br/>Income</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Annual<br/>PAYE Tax</th>
                <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Monthly<br/>PAYE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="border border-gray-200 px-2 py-2 font-medium">{data.fullName || '—'}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(totalEmoluments)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(totalBIK)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(grossIncome)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(totalStatutoryDeductions)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(cra)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono font-bold">{formatNaira(taxableIncome)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono font-bold">{formatNaira(computedTax)}</td>
                <td className="border border-gray-200 px-2 py-2 text-right font-mono">{formatNaira(computedTax / 12)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sm:hidden px-3 space-y-1.5">
          <EmolumentMobileRow label="Total Emoluments" amount={totalEmoluments} />
          <EmolumentMobileRow label="Benefits in Kind" amount={totalBIK} />
          <EmolumentMobileRow label="Gross Income" amount={grossIncome} bold />
          <EmolumentMobileRow label="Statutory Deductions" amount={totalStatutoryDeductions} />
          <EmolumentMobileRow label="CRA" amount={cra} />
          <EmolumentMobileRow label="Taxable Income" amount={taxableIncome} bold />
          <EmolumentMobileRow label="Annual PAYE Tax" amount={computedTax} bold />
          <EmolumentMobileRow label="Monthly PAYE" amount={computedTax / 12} />
        </div>

        {/* CRA detail */}
        <div className="px-3 mt-4 space-y-1">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Consolidated Relief Allowance (CRA) Workings</p>
          <H1Line label="Gross Income" value={formatNaira(grossIncome)} />
          <H1Line label="(a) 1% of Gross Income" value={formatNaira(grossIncome * 0.01)} />
          <H1Line label="(b) ₦200,000 statutory minimum" value={formatNaira(200000)} />
          <H1Line label="Higher of (a) and (b)" value={formatNaira(craBase)} bold />
          <H1Line label="(c) 20% of Gross Income" value={formatNaira(craTwentyPercent)} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>CRA = Higher of (a)/(b) + (c)</span>
            <span className="font-mono">{formatNaira(cra)}</span>
          </div>
        </div>

        {/* Progressive tax table */}
        <div className="px-3 mt-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">PAYE Tax — Nigerian Tax Act 2026 Rates</p>
          <div className="hidden sm:block">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left px-2 py-1.5">Income Bracket</th>
                  <th className="text-right px-2 py-1.5">Rate</th>
                  <th className="text-right px-2 py-1.5">Taxable in Bracket (₦)</th>
                  <th className="text-right px-2 py-1.5">Tax (₦)</th>
                </tr>
              </thead>
              <tbody>
                {computedBrackets.map((b, i) => (
                  <tr key={i} className={`border-b border-gray-100 ${b.taxableInBracket > 0 ? 'bg-green-50/50' : ''}`}>
                    <td className="px-2 py-1.5">
                      {formatNaira(b.lower)} – {b.upper === Infinity ? '∞' : formatNaira(b.upper)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold">{b.rate}%</td>
                    <td className="px-2 py-1.5 text-right font-mono">{formatNaira(b.taxableInBracket)}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{formatNaira(b.tax)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={3} className="px-2 py-2 text-right text-sm">Annual PAYE Tax</td>
                  <td className="px-2 py-2 text-right font-mono text-sm">{formatNaira(computedTax)}</td>
                </tr>
                <tr className="font-semibold text-gray-600">
                  <td colSpan={3} className="px-2 py-1.5 text-right text-xs">Monthly PAYE Deduction</td>
                  <td className="px-2 py-1.5 text-right font-mono text-xs">{formatNaira(computedTax / 12)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2">
            {computedBrackets.map((b, i) => (
              <div key={i} className={`border-b border-gray-100 pb-2 ${b.taxableInBracket > 0 ? 'bg-green-50/50 rounded px-2 py-1' : ''}`}>
                <div className="flex justify-between text-xs">
                  <span>{formatNaira(b.lower)} – {b.upper === Infinity ? '∞' : formatNaira(b.upper)}</span>
                  <span className="font-semibold">{b.rate}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>Taxable: {formatNaira(b.taxableInBracket)}</span>
                  <span className="font-mono">Tax: {formatNaira(b.tax)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
              <span>Annual PAYE Tax</span>
              <span className="font-mono">{formatNaira(computedTax)}</span>
            </div>
          </div>
        </div>
      </H1Section>

      {/* ══════════════════════════════════════════════════════════
          SECTION 6: CAPITAL ALLOWANCES (if any)
         ══════════════════════════════════════════════════════════ */}
      {capitalAllowances.length > 0 && (
        <H1Section num="6" title="Capital Allowances Claimed">
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">S/N</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Asset Description</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Cost (₦)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Rate (%)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Allowance (₦)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center text-[10px]">Year Acquired</th>
                </tr>
              </thead>
              <tbody>
                {capitalAllowances.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                    <td className="border border-gray-200 px-2 py-1.5">{a.assetDescription}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(a.cost)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right">{a.ratePercent}%</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(a.allowanceAmount)}</td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center">{a.yearAcquired || '—'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold bg-gray-50">
                  <td colSpan={4} className="border border-gray-300 px-2 py-1.5 text-right text-[10px] uppercase">Total Capital Allowances</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalAllowances)}</td>
                  <td className="border border-gray-300 px-2 py-1.5" />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden px-3 space-y-2">
            {capitalAllowances.map((a: any, i: number) => (
              <div key={i} className="flex justify-between border-b border-gray-200 py-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{a.assetDescription}</p>
                  <p className="text-[10px] text-gray-500">Cost: {formatNaira(a.cost)} · {a.ratePercent}%</p>
                </div>
                <span className="font-mono text-xs ml-2 shrink-0">{formatNaira(a.allowanceAmount)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-xs">
              <span>Total Allowances</span>
              <span className="font-mono">{formatNaira(totalAllowances)}</span>
            </div>
          </div>
        </H1Section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECTION 7: CAPITAL GAINS (if any)
         ══════════════════════════════════════════════════════════ */}
      {gains.length > 0 && (
        <H1Section num={capitalAllowances.length > 0 ? "7" : "6"} title="Capital Gains on Disposal of Chargeable Assets">
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">S/N</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-left text-[10px]">Asset Type</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Proceeds (₦)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Cost Basis (₦)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Fees (₦)</th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right text-[10px]">Net Gain (₦)</th>
                </tr>
              </thead>
              <tbody>
                {gains.map((r: any, i: number) => {
                  const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
                  return (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="border border-gray-200 px-2 py-1.5">{i + 1}</td>
                      <td className="border border-gray-200 px-2 py-1.5">{r.assetType}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(r.proceeds)}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(r.costBasis)}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right font-mono">{formatNaira(r.fees)}</td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right font-mono font-bold">{formatNaira(gain)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-black font-bold bg-gray-50">
                  <td colSpan={5} className="border border-gray-300 px-2 py-1.5 text-right text-[10px] uppercase">Total Capital Gains</td>
                  <td className="border border-gray-300 px-2 py-1.5 text-right font-mono">{formatNaira(totalGains)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden px-3 space-y-2">
            {gains.map((r: any, i: number) => {
              const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
              return (
                <div key={i} className="flex justify-between border-b border-gray-200 py-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{r.assetType}</p>
                    <p className="text-[10px] text-gray-500">Proceeds: {formatNaira(r.proceeds)}</p>
                  </div>
                  <span className="font-mono text-xs ml-2 shrink-0">{formatNaira(gain)}</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-xs">
              <span>Total Capital Gains</span>
              <span className="font-mono">{formatNaira(totalGains)}</span>
            </div>
          </div>
        </H1Section>
      )}

      {/* ══════════════════════════════════════════════════════════
          EMPLOYER'S DECLARATION
         ══════════════════════════════════════════════════════════ */}
      <H1Section num={String(5 + (capitalAllowances.length > 0 ? 1 : 0) + (gains.length > 0 ? 1 : 0) + 1)} title="Employer's Declaration">
        <div className="px-3 space-y-3">
          <p className="text-xs leading-relaxed">
            I/We hereby declare that the information contained in this annual return is, to the best of my/our knowledge
            and belief, correct and complete. I/We undertake to deduct and remit PAYE tax monthly as computed herein in
            accordance with the Personal Income Tax Act (PITA) and the Pay-As-You-Earn Regulations.
          </p>
          <p className="text-xs leading-relaxed">
            The total number of employees covered by this return is <strong>1</strong> and the total annual PAYE tax
            deductible is <strong>{formatNaira(computedTax)}</strong> ({formatNaira(computedTax / 12)} per month).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Name & Designation of Signatory</p>
              <div className="border-b border-black w-full" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Signature & Company Stamp</p>
              <div className="border-b border-black w-full" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Date</p>
              <div className="border-b border-black w-full" />
            </div>
          </div>
        </div>
      </H1Section>

      {/* ══════ Official Use Box ══════ */}
      <div className="border border-gray-400 px-4 py-3 mb-5">
        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">For Official Use Only</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-4">Received By</p>
            <div className="border-b border-gray-400 w-full" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-4">Date Received</p>
            <div className="border-b border-gray-400 w-full" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase mb-4">Assessment File No.</p>
            <div className="border-b border-gray-400 w-full" />
          </div>
        </div>
      </div>

      {/* ══════ Penalty Notice ══════ */}
      <div className="border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700 mb-6 rounded">
        <strong>PENALTY FOR DEFAULT:</strong> Failure to file this Form H1 on or before 31st January of each year of
        assessment shall attract penalties and interest as stipulated under the Personal Income Tax Act (PITA). Employers
        who fail to deduct and remit PAYE tax may be liable for the tax in addition to penalties.
      </div>

      {/* ══════ Footer ══════ */}
      <div className="border-t-2 border-black pt-4 text-[10px] text-gray-500 space-y-1">
        <div className="flex flex-col sm:flex-row justify-between gap-1">
          <span>Generated by Tax Ease on {formatDate(data.generatedAt)}</span>
          <span>For filing preparation purposes only.</span>
        </div>
        <p className="italic">
          This is not an official FIRS/LIRS document. Please submit through the FIRS TaxProMax portal,
          LIRS eTax portal (etax.lirs.net), or your nearest tax office.
        </p>
      </div>
    </div>
  );
}

/* ══════════════ Sub-components ══════════════ */

function emolumentLabel(type: string): string {
  const map: Record<string, string> = {
    Employment: 'Salary, Wages, Commissions & Bonuses',
    Business: 'Business / Trade Income',
    Freelance: 'Professional / Freelance Income',
    Investment: 'Investment Income',
    Rental: 'Rental Income',
    Crypto: 'Digital Assets / Crypto Income',
    Other: 'Other Income',
  };
  return map[type] || type;
}

function H1Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 print:break-inside-avoid pdf-keep-together">
      <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 mb-3 flex items-baseline gap-2">
        <span className="text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded-sm leading-none">{num}</span>
        <h3 className="text-[10px] md:text-xs font-bold uppercase">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function H1Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col px-3">
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      <span className="font-medium text-xs border-b border-dotted border-gray-300 pb-1 mt-0.5">{value}</span>
    </div>
  );
}

function H1Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 text-xs ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function EmolumentMobileRow({ label, amount, bold }: { label: string; amount: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-gray-200 py-1.5 ${bold ? 'font-bold' : ''}`}>
      <span className="text-xs">{label}</span>
      <span className="font-mono text-xs">{formatNaira(amount)}</span>
    </div>
  );
}
