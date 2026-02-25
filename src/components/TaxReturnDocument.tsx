import { formatNaira, formatDate } from '@/lib/format';

interface TaxReturnDocumentProps {
  data: any;
}

export function TaxReturnDocument({ data }: TaxReturnDocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const gains = Array.isArray(data.capitalGains) ? data.capitalGains : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const formType = profile?.filingType === 'Business' ? 'Form H' : 'Form A';

  // Categorize incomes into earned vs investment
  const earnedTypes = ['Employment', 'Freelance', 'Business', 'Other'];
  const investmentTypes = ['Investment', 'Rental', 'Crypto'];
  const earnedIncomes = incomes.filter((r: any) => earnedTypes.includes(r.type));
  const investmentIncomes = incomes.filter((r: any) => investmentTypes.includes(r.type));

  const totalEarned = earnedIncomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalInvestment = investmentIncomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalIncome = totalEarned + totalInvestment;
  const totalGains = gains.reduce((s: number, r: any) => s + (Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0))) || 0, 0);
  const grossIncome = totalIncome + totalGains;

  // Categorize deductions for Part D
  const pensionDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('pension'));
  const nhisDeductions = deductions.filter((d: any) => d.type?.toLowerCase().includes('health') || d.type?.toLowerCase().includes('nhis'));
  const insuranceDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('life') || d.type?.toLowerCase().includes('insurance'));
  const mortgageDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('mortgage'));
  const otherDeds = deductions.filter((d: any) =>
    !d.type?.toLowerCase().includes('pension') &&
    !d.type?.toLowerCase().includes('health') &&
    !d.type?.toLowerCase().includes('nhis') &&
    !d.type?.toLowerCase().includes('life') &&
    !d.type?.toLowerCase().includes('insurance') &&
    !d.type?.toLowerCase().includes('mortgage')
  );
  const totalDeductions = deductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // CRA computation (Nigerian Tax Act 2026)
  const craBase = Math.max(grossIncome * 0.01, 200000);
  const craTwentyPercent = grossIncome * 0.20;
  const cra = craBase + craTwentyPercent;
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, grossIncome - totalDeductions - cra);

  // 2026 Progressive tax brackets
  const brackets2026 = [
    { lower: 0, upper: 800000, rate: 0 },
    { lower: 800000, upper: 3200000, rate: 15 },
    { lower: 3200000, upper: 12000000, rate: 18 },
    { lower: 12000000, upper: 25000000, rate: 21 },
    { lower: 25000000, upper: Infinity, rate: 25 },
  ];

  const computedBrackets = brackets2026.map(b => {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, b.upper) - b.lower);
    const taxInBracket = taxableInBracket * (b.rate / 100);
    return { ...b, taxableInBracket, taxInBracket };
  });
  const computedTax = computation?.taxOwed ?? computedBrackets.reduce((s, b) => s + b.taxInBracket, 0);

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm" id="tax-return-document">
      {/* ══════ Official Header ══════ */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500">Federal Republic of Nigeria</p>
          <h1 className="text-sm md:text-lg font-bold uppercase tracking-wide">
            {profile?.stateOfResidence === 'Lagos' ? 'Lagos State Internal Revenue Service (LIRS)' :
             profile?.stateOfResidence === 'FCT Abuja' ? 'FCT Internal Revenue Service (FCT-IRS)' :
             'Federal Inland Revenue Service (FIRS)'}
          </h1>
          <div className="border-t border-b border-gray-400 py-2 my-2">
            <h2 className="text-xs md:text-base font-bold uppercase">
              Personal Income Tax Return Form ({formType})
            </h2>
            <p className="text-xs">For Year Ended 31st December {data.taxYear}</p>
          </div>
          <p className="text-[10px] text-gray-500 italic">Please complete this form in CAPITAL LETTERS</p>
        </div>
      </div>

      {/* ══════ PART A: Personal Details ══════ */}
      <FormSection partLabel="A" title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <FormField label="Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <FormField label="Filing Type" value={profile?.filingType || '—'} />
          <FormField label="State of Residence" value={profile?.stateOfResidence || '—'} />
          <FormField label="Residency Status" value={profile?.isResident ? 'Resident' : 'Non-Resident'} />
          <FormField label="Tax Year" value={String(data.taxYear)} />
          <FormField label="Form Type" value={formType} />
        </div>
      </FormSection>

      {/* ══════ PART B: Statement of Income ══════ */}
      <FormSection partLabel="B" title={`Statement of Income for the Year Ended 31st December ${data.taxYear}`}>
        {/* (i)-(iv) Earned Income */}
        <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3">Earned Income</p>
        {earnedIncomes.length > 0 ? (
          <IncomeTable
            items={earnedIncomes.map((r: any, i: number) => ({
              sn: i + 1,
              label: incomeSubLabel(r.type),
              description: r.description || '—',
              frequency: r.frequency,
              amount: r.amount,
            }))}
            totalLabel="Aggregate Earned Income (X)"
            total={totalEarned}
          />
        ) : (
          <p className="text-gray-400 italic px-3 text-xs mb-3">No earned income declared.</p>
        )}

        {/* (v)-(viii) Investment Income */}
        <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3 mt-4">Investment Income</p>
        {investmentIncomes.length > 0 ? (
          <IncomeTable
            items={investmentIncomes.map((r: any, i: number) => ({
              sn: i + 1,
              label: incomeSubLabel(r.type),
              description: r.description || '—',
              frequency: r.frequency,
              amount: r.amount,
            }))}
            totalLabel="Aggregate Investment Income (Y)"
            total={totalInvestment}
          />
        ) : (
          <p className="text-gray-400 italic px-3 text-xs mb-3">No investment income declared.</p>
        )}

        {/* Total Income */}
        <div className="border-t-2 border-black mx-3 mt-2 pt-2 flex justify-between font-bold text-sm">
          <span>TOTAL INCOME (X + Y)</span>
          <span className="font-mono">{formatNaira(totalIncome)}</span>
        </div>
      </FormSection>

      {/* ══════ PART C: Capital Gains ══════ */}
      <FormSection partLabel="C" title="Capital Gains on Disposal of Assets">
        {gains.length > 0 ? (
          <>
            {/* Desktop */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left px-3 py-1.5">S/N</th>
                    <th className="text-left px-3 py-1.5">Asset Type</th>
                    <th className="text-right px-3 py-1.5">Proceeds (₦)</th>
                    <th className="text-right px-3 py-1.5">Cost Basis (₦)</th>
                    <th className="text-right px-3 py-1.5">Fees (₦)</th>
                    <th className="text-right px-3 py-1.5">Net Gain (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {gains.map((r: any, i: number) => {
                    const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
                    return (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="px-3 py-1.5">{i + 1}</td>
                        <td className="px-3 py-1.5">{r.assetType}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.proceeds)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.costBasis)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.fees)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{formatNaira(gain)}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={5} className="px-3 py-1.5 text-right">Total Capital Gains</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalGains)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="sm:hidden space-y-2 px-3">
              {gains.map((r: any, i: number) => {
                const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
                return <MobileRow key={i} index={i + 1} label={r.assetType} sublabel={`Proceeds: ${formatNaira(r.proceeds)}`} amount={gain} />;
              })}
              <TotalRow label="Total Capital Gains" amount={totalGains} />
            </div>
          </>
        ) : (
          <p className="text-gray-400 italic px-3 text-xs">No capital gains declared.</p>
        )}
      </FormSection>

      {/* ══════ PART D: Allowances – Life Assurance, NHIS, Pension ══════ */}
      <FormSection partLabel="D" title="Allowances for Life Assurance, Gratuities, NHIS and Pension Contribution">
        {deductions.length > 0 ? (
          <>
            {/* Desktop */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left px-3 py-1.5">S/N</th>
                    <th className="text-left px-3 py-1.5">Category</th>
                    <th className="text-left px-3 py-1.5">Type</th>
                    <th className="text-left px-3 py-1.5">Description</th>
                    <th className="text-right px-3 py-1.5">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  <DeductionGroup label="Pension Contributions" items={pensionDeds} startIndex={1} />
                  <DeductionGroup label="NHIS / Health Insurance" items={nhisDeductions} startIndex={pensionDeds.length + 1} />
                  <DeductionGroup label="Life Assurance / Insurance" items={insuranceDeds} startIndex={pensionDeds.length + nhisDeductions.length + 1} />
                  <DeductionGroup label="Mortgage Interest Relief" items={mortgageDeds} startIndex={pensionDeds.length + nhisDeductions.length + insuranceDeds.length + 1} />
                  <DeductionGroup label="Other Reliefs" items={otherDeds} startIndex={pensionDeds.length + nhisDeductions.length + insuranceDeds.length + mortgageDeds.length + 1} />
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={4} className="px-3 py-1.5 text-right">Total Statutory Deductions</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalDeductions)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="sm:hidden space-y-2 px-3">
              {deductions.map((r: any, i: number) => (
                <MobileRow key={i} index={i + 1} label={r.type} sublabel={r.description} amount={r.amount} />
              ))}
              <TotalRow label="Total Statutory Deductions" amount={totalDeductions} />
            </div>
          </>
        ) : (
          <p className="text-gray-400 italic px-3 text-xs">No deductions or reliefs claimed.</p>
        )}
        <p className="text-[10px] text-gray-400 italic px-3 mt-2">
          Note: Certificate/Receipt as evidence of payment must be attached.
        </p>
      </FormSection>

      {/* ══════ PART E: Consolidated Relief Allowance (CRA) & Tax Computation ══════ */}
      <FormSection partLabel="E" title="Consolidated Relief Allowance (CRA) & Tax Computation">
        {/* CRA Breakdown */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">CRA Computation</p>
          <LineItem label="Gross Income (Total Income + Capital Gains)" value={formatNaira(grossIncome)} />
          <LineItem label="(i) 1% of Gross Income" value={formatNaira(grossIncome * 0.01)} />
          <LineItem label="(ii) ₦200,000 statutory minimum" value={formatNaira(200000)} />
          <LineItem label="Higher of (i) and (ii)" value={formatNaira(craBase)} bold />
          <LineItem label="(iii) 20% of Gross Income" value={formatNaira(craTwentyPercent)} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>Consolidated Relief Allowance (CRA)</span>
            <span className="font-mono">{formatNaira(cra)}</span>
          </div>
        </div>

        {/* Income Summary */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Taxable Income Computation</p>
          <LineItem label="Gross Income" value={formatNaira(grossIncome)} />
          <LineItem label="Less: Statutory Deductions (Part D)" value={`(${formatNaira(totalDeductions)})`} />
          <LineItem label="Less: Consolidated Relief Allowance" value={`(${formatNaira(cra)})`} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>Taxable Income</span>
            <span className="font-mono">{formatNaira(taxableIncome)}</span>
          </div>
        </div>

        {/* Progressive Tax Table (2026 brackets) */}
        <div className="px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
            Progressive Tax Rates — Nigerian Tax Act 2026
          </p>
          {/* Desktop */}
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
                    <td className="px-2 py-1.5 text-right font-mono">{formatNaira(b.taxInBracket)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={3} className="px-2 py-2 text-right text-sm">Total Tax Payable</td>
                  <td className="px-2 py-2 text-right font-mono text-sm">{formatNaira(computedTax)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="sm:hidden space-y-2">
            {computedBrackets.map((b, i) => (
              <div key={i} className={`border-b border-gray-100 pb-2 ${b.taxableInBracket > 0 ? 'bg-green-50/50 rounded px-2 py-1' : ''}`}>
                <div className="flex justify-between text-xs">
                  <span>{formatNaira(b.lower)} – {b.upper === Infinity ? '∞' : formatNaira(b.upper)}</span>
                  <span className="font-semibold">{b.rate}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
                  <span>Taxable: {formatNaira(b.taxableInBracket)}</span>
                  <span className="font-mono">Tax: {formatNaira(b.taxInBracket)}</span>
                </div>
              </div>
            ))}
            <TotalRow label="Total Tax Payable" amount={computedTax} />
          </div>
        </div>
      </FormSection>

      {/* ══════ Declaration ══════ */}
      <FormSection partLabel="" title="Declaration">
        <div className="px-3 space-y-3">
          <p className="text-xs leading-relaxed">
            I hereby declare that the information supplied in this form to the best of my knowledge and belief contains
            a correct and complete statement of the amount of income from all sources. I understand that I may have to
            pay financial penalties and face prosecution if I give false information.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Signature / Thumb print of Returnee</p>
              <div className="border-b border-black w-full" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Date</p>
              <div className="border-b border-black w-full" />
            </div>
          </div>
        </div>
      </FormSection>

      {/* ══════ Penalty Notice ══════ */}
      <div className="border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700 mb-6 rounded">
        <strong>PENALTY FOR DEFAULT:</strong> In accordance with the relevant laws, making false statements and returns
        or unlawful refusal/neglect to pay accurate tax will attract fine or imprisonment or both.
      </div>

      {/* ══════ Footer ══════ */}
      <div className="border-t-2 border-black pt-4 text-[10px] text-gray-500 space-y-1">
        <div className="flex flex-col sm:flex-row justify-between gap-1">
          <span>Generated by TaxWise on {formatDate(data.generatedAt)}</span>
          <span>For filing preparation purposes only.</span>
        </div>
        <p className="italic">
          This is not an official FIRS/LIRS document. Please submit through the FIRS e-filing portal,
          LIRS eTax portal (etax.lirs.net), or your nearest tax office.
        </p>
      </div>
    </div>
  );
}

/* ══════════════ Sub-components ══════════════ */

function incomeSubLabel(type: string): string {
  const map: Record<string, string> = {
    Employment: '(ii) Employment — Salary, Commissions, Bonuses, Allowances',
    Freelance: '(i) Trade, Business, Profession, Vocation',
    Business: '(i) Trade, Business, Profession, Vocation',
    Investment: '(v) Dividends & Investment Income',
    Rental: '(vii) Rents',
    Crypto: '(vi) Interest & Digital Assets',
    Other: '(viii) Other Profits & Income',
  };
  return map[type] || `(viii) ${type}`;
}

function FormSection({ partLabel, title, children }: { partLabel: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 mb-3 flex items-baseline gap-2">
        {partLabel && (
          <span className="text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded-sm leading-none">
            PART {partLabel}
          </span>
        )}
        <h3 className="text-[10px] md:text-xs font-bold uppercase">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col px-3">
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
      <span className="font-medium text-xs border-b border-dotted border-gray-300 pb-1 mt-0.5">{value}</span>
    </div>
  );
}

function LineItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 text-xs ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function TotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
      <span>{label}</span>
      <span className="font-mono">{formatNaira(amount)}</span>
    </div>
  );
}

function MobileRow({ index, label, sublabel, amount }: { index: number; label: string; sublabel?: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2">
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-[10px] text-gray-400 mt-0.5">{index}.</span>
        <div className="min-w-0">
          <p className="font-medium text-xs truncate">{label}</p>
          {sublabel && <p className="text-[10px] text-gray-500 truncate">{sublabel}</p>}
        </div>
      </div>
      <span className="font-mono text-xs text-right flex-shrink-0 ml-2">{formatNaira(amount)}</span>
    </div>
  );
}

interface IncomeTableItem {
  sn: number;
  label: string;
  description: string;
  frequency: string;
  amount: number;
}

function IncomeTable({ items, totalLabel, total }: { items: IncomeTableItem[]; totalLabel: string; total: number }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="text-left px-3 py-1.5">S/N</th>
              <th className="text-left px-3 py-1.5">Source of Income</th>
              <th className="text-left px-3 py-1.5">Frequency</th>
              <th className="text-left px-3 py-1.5">Description</th>
              <th className="text-right px-3 py-1.5">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.sn} className="border-b border-gray-200">
                <td className="px-3 py-1.5">{r.sn}</td>
                <td className="px-3 py-1.5">{r.label}</td>
                <td className="px-3 py-1.5">{r.frequency}</td>
                <td className="px-3 py-1.5">{r.description}</td>
                <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-400 font-semibold">
              <td colSpan={4} className="px-3 py-1.5 text-right">{totalLabel}</td>
              <td className="px-3 py-1.5 text-right font-mono">{formatNaira(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="sm:hidden space-y-2 px-3">
        {items.map((r) => (
          <MobileRow key={r.sn} index={r.sn} label={r.label} sublabel={r.frequency} amount={r.amount} />
        ))}
        <div className="flex justify-between pt-2 border-t border-gray-400 font-semibold text-xs">
          <span>{totalLabel}</span>
          <span className="font-mono">{formatNaira(total)}</span>
        </div>
      </div>
    </>
  );
}

function DeductionGroup({ label, items, startIndex }: { label: string; items: any[]; startIndex: number }) {
  if (items.length === 0) return null;
  return (
    <>
      <tr className="bg-gray-50/50">
        <td colSpan={5} className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase">{label}</td>
      </tr>
      {items.map((r: any, i: number) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="px-3 py-1.5">{startIndex + i}</td>
          <td className="px-3 py-1.5">{label}</td>
          <td className="px-3 py-1.5">{r.type}</td>
          <td className="px-3 py-1.5">{r.description || '—'}</td>
          <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
        </tr>
      ))}
    </>
  );
}
