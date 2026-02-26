import { formatNaira, formatDate } from '@/lib/format';

interface FormH2DocumentProps {
  data: any;
}

/**
 * LIRS Form H2 — Employee's Certificate of Pay and Tax Deducted
 *
 * Official structure:
 *  Part 1: Employer Particulars
 *  Part 2: Employee Particulars
 *  Part 3: Emoluments — 5-Class Breakdown
 *  Part 4: Benefits in Kind
 *  Part 5: Gross Emoluments & Deductions
 *  Part 6: Tax Computation (CRA + PAYE)
 *  Part 7: Certification & Signature
 */
export function FormH2Document({ data }: FormH2DocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const benefitsInKind = Array.isArray(data.benefitsInKind) ? data.benefitsInKind : [];

  // ── 5-Class emolument classification (same logic as H1) ──
  const classifyIncome = (type: string, description?: string) => {
    const desc = (description || '').toLowerCase();
    const t = (type || '').toLowerCase();
    if (desc.includes('housing') || desc.includes('rent allow')) return 'housing';
    if (desc.includes('transport') || desc.includes('motor') || desc.includes('vehicle')) return 'transport';
    if (desc.includes('leave') || desc.includes('vacation')) return 'leave';
    if (desc.includes('basic') || desc.includes('salary') || desc.includes('wage')) return 'basic';
    if (t === 'employment') return 'basic';
    return 'other';
  };

  const emolumentClasses = { basic: 0, housing: 0, transport: 0, leave: 0, other: 0 };
  incomes.forEach((r: any) => {
    const cls = classifyIncome(r.type, r.description);
    emolumentClasses[cls as keyof typeof emolumentClasses] += r.amount || 0;
  });
  const totalEmoluments = Object.values(emolumentClasses).reduce((a, b) => a + b, 0);
  const totalBIK = benefitsInKind.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);
  const grossEmoluments = totalEmoluments + totalBIK;

  // Deduction categories
  const sumByType = (filter: (d: any) => boolean) =>
    deductions.filter(filter).reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const totalPension = sumByType((d: any) => d.type?.toLowerCase().includes('pension'));
  const totalNHF = sumByType((d: any) => d.type?.toLowerCase().includes('nhf') || d.type?.toLowerCase().includes('housing fund'));
  const totalNHIS = sumByType((d: any) => d.type?.toLowerCase().includes('health') || d.type?.toLowerCase().includes('nhis'));
  const totalOtherDeds = sumByType((d: any) =>
    !d.type?.toLowerCase().includes('pension') &&
    !d.type?.toLowerCase().includes('nhf') &&
    !d.type?.toLowerCase().includes('housing fund') &&
    !d.type?.toLowerCase().includes('health') &&
    !d.type?.toLowerCase().includes('nhis')
  );
  const totalStatutoryDeductions = totalPension + totalNHF + totalNHIS + totalOtherDeds;

  // CRA
  const craBase = Math.max(grossEmoluments * 0.01, 200000);
  const craTwentyPercent = grossEmoluments * 0.20;
  const cra = craBase + craTwentyPercent;
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, grossEmoluments - totalStatutoryDeductions - cra);

  // 2026 Progressive brackets
  const brackets = [
    { lower: 0, upper: 800000, rate: 0, label: '₦0 – ₦800,000' },
    { lower: 800000, upper: 3200000, rate: 15, label: '₦800,000 – ₦3,200,000' },
    { lower: 3200000, upper: 12000000, rate: 18, label: '₦3,200,000 – ₦12,000,000' },
    { lower: 12000000, upper: 25000000, rate: 21, label: '₦12,000,000 – ₦25,000,000' },
    { lower: 25000000, upper: Infinity, rate: 25, label: '₦25,000,000 – ∞' },
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
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm print:break-before-page" id="form-h2-document">
      {/* ═══ HEADER ═══ */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500">Federal Republic of Nigeria</p>
          <h1 className="text-sm md:text-lg font-bold uppercase tracking-wide">{revenueService}</h1>
          <div className="border-t border-b border-gray-400 py-2 my-2">
            <h2 className="text-xs md:text-base font-bold uppercase">
              Form H2 — Employee's Certificate of Pay and Tax Deducted
            </h2>
            <p className="text-xs">
              Personal Income Tax Act (PITA) — For Year Ended 31st December {data.taxYear}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            To be issued by the employer to each employee in respect of emoluments paid and tax deducted during the year
          </p>
        </div>
      </div>

      {/* ═══ PART 1: EMPLOYER PARTICULARS ═══ */}
      <H2Section num="1" title="Particulars of Employer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <H2Field label="(a) Name of Employer" value={profile?.employerName || data.fullName || '—'} />
          <H2Field label="(b) Employer TIN" value={profile?.employerTin || profile?.tin || '—'} />
          <H2Field label="(c) PAYE Registration No." value="—" />
          <H2Field label="(d) Address" value={profile?.employerAddress || profile?.residentialAddress || '—'} />
          <H2Field label="(e) Nature of Business" value={profile?.occupation || '—'} />
          <H2Field label="(f) State" value={profile?.stateOfResidence || '—'} />
        </div>
      </H2Section>

      {/* ═══ PART 2: EMPLOYEE PARTICULARS ═══ */}
      <H2Section num="2" title="Particulars of Employee">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <H2Field label="(a) Full Name" value={data.fullName || '—'} />
          <H2Field label="(b) Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <H2Field label="(c) Designation / Rank" value={profile?.occupation || '—'} />
          <H2Field label="(d) Sex" value={profile?.sex || '—'} />
          <H2Field label="(e) Date of Birth" value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : '—'} />
          <H2Field label="(f) Marital Status" value={profile?.maritalStatus || '—'} />
          <H2Field label="(g) Number of Children" value={String(profile?.numChildren ?? 0)} />
          <H2Field label="(h) Residential Address" value={profile?.residentialAddress || '—'} />
          <H2Field label="(i) Date of Employment" value="—" />
          <H2Field label="(j) Date Employment Ceased (if applicable)" value="—" />
        </div>
      </H2Section>

      {/* ═══ PART 3: EMOLUMENTS — 5 CLASSES ═══ */}
      <H2Section num="3" title="Emoluments Paid During the Year">
        <p className="text-[10px] text-gray-500 italic px-3 mb-3">
          Breakdown of all emoluments paid to the employee classified into 5 official categories
        </p>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400">
                <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">Class</th>
                <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">Description</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Annual Amount (₦)</th>
                <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Monthly Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <EmolumentRow cls="1" label="Basic Salary, Wages, Commissions & Bonuses" amount={emolumentClasses.basic} />
              <EmolumentRow cls="2" label="Housing Allowance" amount={emolumentClasses.housing} />
              <EmolumentRow cls="3" label="Transport Allowance" amount={emolumentClasses.transport} />
              <EmolumentRow cls="4" label="Leave Allowance" amount={emolumentClasses.leave} />
              <EmolumentRow cls="5" label="Other Allowances & Benefits" amount={emolumentClasses.other} />
              <tr className="border-t-2 border-black font-bold bg-gray-50">
                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right text-[10px] uppercase">Total Emoluments</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{formatNaira(totalEmoluments)}</td>
                <td className="border border-gray-300 px-3 py-2 text-right font-mono">{formatNaira(Math.round(totalEmoluments / 12))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile stacked */}
        <div className="sm:hidden px-3 space-y-2">
          {[
            { cls: '1', label: 'Basic Salary', amount: emolumentClasses.basic },
            { cls: '2', label: 'Housing', amount: emolumentClasses.housing },
            { cls: '3', label: 'Transport', amount: emolumentClasses.transport },
            { cls: '4', label: 'Leave', amount: emolumentClasses.leave },
            { cls: '5', label: 'Other Allowances', amount: emolumentClasses.other },
          ].map(e => (
            <div key={e.cls} className="flex justify-between border-b border-gray-100 py-1.5">
              <span className="text-xs"><span className="bg-gray-200 text-[9px] font-bold px-1 py-0.5 rounded mr-1">{e.cls}</span>{e.label}</span>
              <span className="font-mono text-xs">{formatNaira(e.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-xs">
            <span>Total Emoluments</span>
            <span className="font-mono">{formatNaira(totalEmoluments)}</span>
          </div>
        </div>
      </H2Section>

      {/* ═══ PART 4: BENEFITS IN KIND ═══ */}
      <H2Section num="4" title="Benefits in Kind">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Annual value of all benefits in kind enjoyed by the employee
        </p>
        {benefitsInKind.length > 0 ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs border border-gray-300">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300">
                    <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">S/N</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">Nature of Benefit</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">Description</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Annual Value (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitsInKind.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="border border-gray-200 px-3 py-1.5">{i + 1}</td>
                      <td className="border border-gray-200 px-3 py-1.5">{b.category}</td>
                      <td className="border border-gray-200 px-3 py-1.5">{b.description || '—'}</td>
                      <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{formatNaira(b.annualValue)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black font-bold bg-gray-50">
                    <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right text-[10px] uppercase">Total Benefits in Kind</td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{formatNaira(totalBIK)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sm:hidden px-3 space-y-2">
              {benefitsInKind.map((b: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-gray-100 py-1.5">
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
          <p className="text-xs text-gray-400 italic px-3 py-4 text-center">No benefits in kind declared.</p>
        )}
      </H2Section>

      {/* ═══ PART 5: GROSS EMOLUMENTS & DEDUCTIONS ═══ */}
      <H2Section num="5" title="Gross Emoluments and Statutory Deductions">
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-xs border border-gray-300">
            <tbody>
              <SummaryRow label="Total Emoluments (Part 3)" value={totalEmoluments} />
              <SummaryRow label="Add: Benefits in Kind (Part 4)" value={totalBIK} />
              <SummaryRow label="Gross Emoluments" value={grossEmoluments} bold />
              <tr><td colSpan={2} className="border border-gray-200 px-3 py-1 bg-gray-100 text-[10px] uppercase font-bold text-gray-600">Less: Statutory Deductions (Tax-Free Items)</td></tr>
              <SummaryRow label="(a) Pension Contribution (Employee — 8%)" value={totalPension} />
              <SummaryRow label="(b) National Housing Fund (NHF — 2.5%)" value={totalNHF} />
              <SummaryRow label="(c) National Health Insurance (NHIS — 5%)" value={totalNHIS} />
              <SummaryRow label="(d) Other Reliefs / Deductions" value={totalOtherDeds} />
              <SummaryRow label="Total Statutory Deductions" value={totalStatutoryDeductions} bold />
              <SummaryRow label="Income After Deductions" value={Math.max(0, grossEmoluments - totalStatutoryDeductions)} bold />
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden px-3 space-y-1.5">
          <MobileSummary label="Total Emoluments" value={totalEmoluments} />
          <MobileSummary label="Add: BIK" value={totalBIK} />
          <MobileSummary label="Gross Emoluments" value={grossEmoluments} bold />
          <p className="text-[10px] font-bold text-gray-500 uppercase pt-2">Less: Statutory Deductions</p>
          <MobileSummary label="Pension (8%)" value={totalPension} />
          <MobileSummary label="NHF (2.5%)" value={totalNHF} />
          <MobileSummary label="NHIS (5%)" value={totalNHIS} />
          <MobileSummary label="Other" value={totalOtherDeds} />
          <MobileSummary label="Total Deductions" value={totalStatutoryDeductions} bold />
        </div>
      </H2Section>

      {/* ═══ PART 6: TAX COMPUTATION ═══ */}
      <H2Section num="6" title="Tax Computation — Consolidated Relief Allowance & PAYE">
        {/* CRA */}
        <div className="px-3 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Consolidated Relief Allowance (CRA)</p>
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs border border-gray-300">
              <tbody>
                <SummaryRow label="Gross Emoluments" value={grossEmoluments} />
                <SummaryRow label="(a) 1% of Gross Income" value={Math.round(grossEmoluments * 0.01)} />
                <SummaryRow label="(b) ₦200,000 Statutory Minimum" value={200000} />
                <SummaryRow label="Higher of (a) and (b)" value={craBase} />
                <SummaryRow label="(c) 20% of Gross Income" value={craTwentyPercent} />
                <SummaryRow label="CRA = Higher of (a)/(b) + (c)" value={cra} bold />
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-1.5">
            <MobileSummary label="1% of Gross" value={Math.round(grossEmoluments * 0.01)} />
            <MobileSummary label="Statutory Min" value={200000} />
            <MobileSummary label="20% of Gross" value={craTwentyPercent} />
            <MobileSummary label="CRA" value={cra} bold />
          </div>
        </div>

        {/* Taxable income */}
        <div className="px-3 mb-4">
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs border border-gray-300">
              <tbody>
                <SummaryRow label="Income After Deductions" value={Math.max(0, grossEmoluments - totalStatutoryDeductions)} />
                <SummaryRow label="Less: Consolidated Relief Allowance" value={cra} />
                <SummaryRow label="Taxable Income" value={taxableIncome} bold />
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-1.5">
            <MobileSummary label="Income After Deds" value={Math.max(0, grossEmoluments - totalStatutoryDeductions)} />
            <MobileSummary label="Less: CRA" value={cra} />
            <MobileSummary label="Taxable Income" value={taxableIncome} bold />
          </div>
        </div>

        {/* PAYE Brackets */}
        <div className="px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">PAYE Tax — Nigerian Tax Act 2026 Rates</p>
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-xs border border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="border border-gray-300 px-3 py-1.5 text-left text-[10px]">Income Bracket</th>
                  <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Rate</th>
                  <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Taxable in Bracket (₦)</th>
                  <th className="border border-gray-300 px-3 py-1.5 text-right text-[10px]">Tax (₦)</th>
                </tr>
              </thead>
              <tbody>
                {computedBrackets.map((b, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-3 py-1.5">{b.label}</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-right">{b.rate}%</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{formatNaira(b.taxableInBracket)}</td>
                    <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{formatNaira(b.tax)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold bg-gray-50">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right text-[10px] uppercase">Annual PAYE Tax</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">{formatNaira(computedTax)}</td>
                </tr>
                <tr className="font-semibold">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right text-[10px] uppercase">Monthly PAYE Deduction</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-mono">{formatNaira(Math.round(computedTax / 12))}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-1.5">
            {computedBrackets.map((b, i) => (
              <div key={i} className="flex justify-between text-xs border-b border-gray-100 py-1">
                <span>{b.rate}% ({b.label.split('–')[0].trim()}…)</span>
                <span className="font-mono">{formatNaira(b.tax)}</span>
              </div>
            ))}
            <MobileSummary label="Annual PAYE" value={computedTax} bold />
            <MobileSummary label="Monthly PAYE" value={Math.round(computedTax / 12)} bold />
          </div>
        </div>
      </H2Section>

      {/* ═══ PART 7: CERTIFICATION ═══ */}
      <H2Section num="7" title="Employer's Certification">
        <div className="px-3 space-y-6">
          <p className="text-xs leading-relaxed">
            I hereby certify that the above is a true and correct statement of all emoluments paid to and benefits
            provided for the above-named employee during the year ended 31st December {data.taxYear}, and that the
            tax shown has been correctly computed, deducted, and remitted to the relevant tax authority.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              <div>
                <div className="border-b border-black w-full h-8" />
                <p className="text-[10px] text-gray-500 mt-1">Signature of Employer / Authorized Signatory</p>
              </div>
              <div>
                <div className="border-b border-black w-full h-8" />
                <p className="text-[10px] text-gray-500 mt-1">Name (in BLOCK LETTERS)</p>
              </div>
              <div>
                <div className="border-b border-black w-full h-8" />
                <p className="text-[10px] text-gray-500 mt-1">Designation</p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="border-b border-black w-full h-8" />
                <p className="text-[10px] text-gray-500 mt-1">Date</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded h-24 flex items-center justify-center">
                <p className="text-[10px] text-gray-400 italic">Company Stamp / Seal</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300 pt-3 mt-4">
            <p className="text-[9px] text-gray-400 italic text-center">
              This certificate should be given to the employee for attachment to their personal income tax return.
              A copy should be retained by the employer and forwarded with Form H1 to the relevant tax authority.
            </p>
          </div>
        </div>
      </H2Section>

      {/* ═══ FOR OFFICIAL USE ═══ */}
      <div className="mt-6 border-2 border-gray-300 rounded p-4 print:break-inside-avoid">
        <p className="text-[10px] uppercase font-bold text-gray-500 mb-3 text-center">For Official Use Only</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="border-b border-black w-full h-8" />
            <p className="text-[10px] text-gray-500 mt-1">Received By</p>
          </div>
          <div>
            <div className="border-b border-black w-full h-8" />
            <p className="text-[10px] text-gray-500 mt-1">Date Received</p>
          </div>
          <div>
            <div className="border-b border-black w-full h-8" />
            <p className="text-[10px] text-gray-500 mt-1">Official Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function H2Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 print:break-inside-avoid pdf-keep-together">
      <div className="flex items-baseline gap-2 bg-gray-100 border border-gray-300 px-3 py-1.5 mb-3">
        <span className="bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0">{num}</span>
        <h3 className="font-bold text-[11px] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function H2Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3">
      <span className="text-[10px] text-gray-500 uppercase block">{label}</span>
      <span className="text-xs font-medium border-b border-dotted border-gray-300 pb-1 block mt-0.5">{value}</span>
    </div>
  );
}

function EmolumentRow({ cls, label, amount }: { cls: string; label: string; amount: number }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="border border-gray-200 px-3 py-1.5 text-center">
        <span className="bg-gray-200 text-[9px] font-bold px-1.5 py-0.5 rounded">{cls}</span>
      </td>
      <td className="border border-gray-200 px-3 py-1.5">{label}</td>
      <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{formatNaira(amount)}</td>
      <td className="border border-gray-200 px-3 py-1.5 text-right font-mono">{formatNaira(Math.round(amount / 12))}</td>
    </tr>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <tr className={`border-b border-gray-200 ${bold ? 'font-bold bg-gray-50 border-t-2 border-black' : ''}`}>
      <td className="border border-gray-200 px-3 py-1.5 text-xs">{label}</td>
      <td className="border border-gray-200 px-3 py-1.5 text-right font-mono text-xs">{formatNaira(value)}</td>
    </tr>
  );
}

function MobileSummary({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-xs py-1 ${bold ? 'font-bold border-t-2 border-black pt-2' : 'border-b border-gray-100'}`}>
      <span>{label}</span>
      <span className="font-mono">{formatNaira(value)}</span>
    </div>
  );
}
