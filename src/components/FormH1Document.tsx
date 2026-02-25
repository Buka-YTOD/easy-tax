import { formatNaira, formatDate } from '@/lib/format';

interface FormH1DocumentProps {
  data: any;
}

/**
 * LIRS Form H1 — Employer's Annual Declaration of Emoluments
 * Official structure for business filers declaring employee compensation.
 */
export function FormH1Document({ data }: FormH1DocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const gains = Array.isArray(data.capitalGains) ? data.capitalGains : [];

  // Employment-related incomes (emoluments)
  const employmentIncomes = incomes.filter((r: any) =>
    ['Employment', 'Business', 'Freelance'].includes(r.type)
  );
  const otherIncomes = incomes.filter((r: any) =>
    !['Employment', 'Business', 'Freelance'].includes(r.type)
  );

  const totalEmoluments = employmentIncomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalOther = otherIncomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalIncome = incomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalDeductions = deductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalGains = gains.reduce((s: number, r: any) =>
    s + Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0)), 0
  );
  const grossIncome = totalIncome + totalGains;

  // CRA
  const craBase = Math.max(grossIncome * 0.01, 200000);
  const craTwentyPercent = grossIncome * 0.20;
  const cra = craBase + craTwentyPercent;
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, grossIncome - totalDeductions - cra);

  // 2026 Progressive brackets
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

  // Pension deductions
  const pensionDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('pension'));
  const nhfDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('nhf') || d.type?.toLowerCase().includes('housing'));
  const nhisDeductions = deductions.filter((d: any) => d.type?.toLowerCase().includes('health') || d.type?.toLowerCase().includes('nhis'));
  const otherDeds = deductions.filter((d: any) =>
    !d.type?.toLowerCase().includes('pension') &&
    !d.type?.toLowerCase().includes('nhf') &&
    !d.type?.toLowerCase().includes('housing') &&
    !d.type?.toLowerCase().includes('health') &&
    !d.type?.toLowerCase().includes('nhis')
  );
  const totalPension = pensionDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalNHF = nhfDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalNHIS = nhisDeductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm" id="form-h1-document">
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
              Form H1 — Employer's Annual Declaration of Emoluments
            </h2>
            <p className="text-xs">
              Personal Income Tax Act (PITA) — For Year Ended 31st December {data.taxYear}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            This form is to be completed by every employer for each employee in their service during the year of assessment
          </p>
        </div>
      </div>

      {/* ══════ SECTION 1: Employer / Business Particulars ══════ */}
      <H1Section sectionNum="1" title="Particulars of Employer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <H1Field label="Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <H1Field label="Business / Trading Name" value={profile?.filingType === 'Business' ? 'As Declared' : '—'} />
          <H1Field label="State of Operation" value={profile?.stateOfResidence || '—'} />
          <H1Field label="Tax Year" value={String(data.taxYear)} />
          <H1Field label="Nature of Business" value="As per records" />
          <H1Field label="Employer Category" value={profile?.isResident ? 'Resident Employer' : 'Non-Resident Employer'} />
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <H1Field label="Registered Address" value="As per company records" />
          <H1Field label="PAYE Registration Number" value="—" />
        </div>
      </H1Section>

      {/* ══════ SECTION 2: Schedule of Emoluments ══════ */}
      <H1Section sectionNum="2" title="Schedule of Emoluments Paid to Employees">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Complete for each employee — Basic salary, housing, transport, leave, and other allowances
        </p>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="text-left px-3 py-1.5">S/N</th>
                <th className="text-left px-3 py-1.5">Description / Source</th>
                <th className="text-left px-3 py-1.5">Type</th>
                <th className="text-left px-3 py-1.5">Frequency</th>
                <th className="text-right px-3 py-1.5">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {/* Employment / Business Emoluments */}
              {employmentIncomes.length > 0 && (
                <tr className="bg-gray-50/50">
                  <td colSpan={5} className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase">
                    Emoluments & Business Income
                  </td>
                </tr>
              )}
              {employmentIncomes.map((r: any, i: number) => (
                <tr key={`emp-${i}`} className="border-b border-gray-200">
                  <td className="px-3 py-1.5">{i + 1}</td>
                  <td className="px-3 py-1.5">{r.description || emolumentLabel(r.type)}</td>
                  <td className="px-3 py-1.5">{r.type}</td>
                  <td className="px-3 py-1.5">{r.frequency}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                </tr>
              ))}
              {employmentIncomes.length > 0 && (
                <tr className="border-t border-gray-400 font-semibold">
                  <td colSpan={4} className="px-3 py-1.5 text-right">Total Emoluments</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalEmoluments)}</td>
                </tr>
              )}

              {/* Other Income */}
              {otherIncomes.length > 0 && (
                <>
                  <tr className="bg-gray-50/50">
                    <td colSpan={5} className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase">
                      Other Income Sources
                    </td>
                  </tr>
                  {otherIncomes.map((r: any, i: number) => (
                    <tr key={`oth-${i}`} className="border-b border-gray-200">
                      <td className="px-3 py-1.5">{employmentIncomes.length + i + 1}</td>
                      <td className="px-3 py-1.5">{r.description || r.type}</td>
                      <td className="px-3 py-1.5">{r.type}</td>
                      <td className="px-3 py-1.5">{r.frequency}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-400 font-semibold">
                    <td colSpan={4} className="px-3 py-1.5 text-right">Total Other Income</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalOther)}</td>
                  </tr>
                </>
              )}

              {/* Grand Total */}
              <tr className="border-t-2 border-black font-bold">
                <td colSpan={4} className="px-3 py-2 text-right">GROSS TOTAL INCOME</td>
                <td className="px-3 py-2 text-right font-mono">{formatNaira(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden space-y-2 px-3">
          {incomes.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b border-gray-200 py-2">
              <div className="min-w-0">
                <p className="font-medium text-xs truncate">{r.description || r.type}</p>
                <p className="text-[10px] text-gray-500">{r.frequency}</p>
              </div>
              <span className="font-mono text-xs ml-2">{formatNaira(r.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
            <span>Gross Total Income</span>
            <span className="font-mono">{formatNaira(totalIncome)}</span>
          </div>
        </div>
      </H1Section>

      {/* ══════ SECTION 3: Capital Gains ══════ */}
      {gains.length > 0 && (
        <H1Section sectionNum="3" title="Capital Gains on Disposal of Chargeable Assets">
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
          <div className="sm:hidden space-y-2 px-3">
            {gains.map((r: any, i: number) => {
              const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
              return (
                <div key={i} className="flex items-center justify-between border-b border-gray-200 py-2">
                  <div className="min-w-0">
                    <p className="font-medium text-xs truncate">{r.assetType}</p>
                    <p className="text-[10px] text-gray-500">Proceeds: {formatNaira(r.proceeds)}</p>
                  </div>
                  <span className="font-mono text-xs ml-2">{formatNaira(gain)}</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
              <span>Total Capital Gains</span>
              <span className="font-mono">{formatNaira(totalGains)}</span>
            </div>
          </div>
        </H1Section>
      )}

      {/* ══════ SECTION 4: Statutory Deductions (Pension, NHF, NHIS) ══════ */}
      <H1Section sectionNum={gains.length > 0 ? "4" : "3"} title="Statutory Deductions — Employee's Contribution">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Contributions made under the Pension Reform Act, National Housing Fund Act, and National Health Insurance Scheme
        </p>
        <div className="hidden sm:block">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="text-left px-3 py-1.5">Category</th>
                <th className="text-left px-3 py-1.5">Details</th>
                <th className="text-right px-3 py-1.5">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <StatDeductionRow label="Pension Fund Contribution (8%)" items={pensionDeds} total={totalPension} />
              <StatDeductionRow label="National Housing Fund (NHF — 2.5%)" items={nhfDeds} total={totalNHF} />
              <StatDeductionRow label="NHIS Contribution (5%)" items={nhisDeductions} total={totalNHIS} />
              {otherDeds.length > 0 && (
                <StatDeductionRow label="Other Reliefs" items={otherDeds}
                  total={otherDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0)} />
              )}
              <tr className="border-t-2 border-black font-bold">
                <td colSpan={2} className="px-3 py-2 text-right">Total Statutory Deductions</td>
                <td className="px-3 py-2 text-right font-mono">{formatNaira(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="sm:hidden space-y-2 px-3">
          <DeductionMobileRow label="Pension (8%)" amount={totalPension} />
          <DeductionMobileRow label="NHF (2.5%)" amount={totalNHF} />
          <DeductionMobileRow label="NHIS (5%)" amount={totalNHIS} />
          {otherDeds.length > 0 && (
            <DeductionMobileRow label="Other Reliefs" amount={otherDeds.reduce((s: number, r: any) => s + (r.amount || 0), 0)} />
          )}
          <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
            <span>Total Deductions</span>
            <span className="font-mono">{formatNaira(totalDeductions)}</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 italic px-3 mt-2">
          Receipts and PFA/NHF/NHIS statements must be attached as evidence.
        </p>
      </H1Section>

      {/* ══════ SECTION 5: CRA & PAYE Computation ══════ */}
      <H1Section sectionNum={gains.length > 0 ? "5" : "4"} title="Tax Computation — CRA & PAYE">
        {/* CRA */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Consolidated Relief Allowance (CRA)</p>
          <H1Line label="Gross Income (Total Income + Capital Gains)" value={formatNaira(grossIncome)} />
          <H1Line label="(a) 1% of Gross Income" value={formatNaira(grossIncome * 0.01)} />
          <H1Line label="(b) ₦200,000 statutory minimum" value={formatNaira(200000)} />
          <H1Line label="Higher of (a) and (b)" value={formatNaira(craBase)} bold />
          <H1Line label="(c) 20% of Gross Income" value={formatNaira(craTwentyPercent)} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>CRA = Higher of (a)/(b) + (c)</span>
            <span className="font-mono">{formatNaira(cra)}</span>
          </div>
        </div>

        {/* Taxable Income */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Chargeable Income</p>
          <H1Line label="Gross Income" value={formatNaira(grossIncome)} />
          <H1Line label="Less: Statutory Deductions" value={`(${formatNaira(totalDeductions)})`} />
          <H1Line label="Less: Consolidated Relief Allowance" value={`(${formatNaira(cra)})`} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>Chargeable / Taxable Income</span>
            <span className="font-mono">{formatNaira(taxableIncome)}</span>
          </div>
        </div>

        {/* Progressive Tax Table */}
        <div className="px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">
            PAYE Tax — Nigerian Tax Act 2026 Rates
          </p>
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
                  <span className="font-mono">Tax: {formatNaira(b.taxInBracket)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold text-sm">
              <span>Annual PAYE Tax</span>
              <span className="font-mono">{formatNaira(computedTax)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 font-semibold">
              <span>Monthly PAYE</span>
              <span className="font-mono">{formatNaira(computedTax / 12)}</span>
            </div>
          </div>
        </div>
      </H1Section>

      {/* ══════ SECTION 6: Employer's Declaration ══════ */}
      <H1Section sectionNum={gains.length > 0 ? "6" : "5"} title="Employer's Declaration">
        <div className="px-3 space-y-3">
          <p className="text-xs leading-relaxed">
            I/We hereby declare that the information contained in this annual return is, to the best of my/our knowledge
            and belief, correct and complete. I/We undertake to deduct and remit PAYE tax monthly as computed herein in
            accordance with the Personal Income Tax Act (PITA) and the Pay-As-You-Earn Regulations.
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
          <span>Generated by TaxWise on {formatDate(data.generatedAt)}</span>
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
  };
  return map[type] || type;
}

function H1Section({ sectionNum, title, children }: { sectionNum: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="bg-gray-100 border border-gray-300 px-3 py-1.5 mb-3 flex items-baseline gap-2">
        <span className="text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded-sm leading-none">
          {sectionNum}
        </span>
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

function StatDeductionRow({ label, items, total }: { label: string; items: any[]; total: number }) {
  return (
    <>
      <tr className="border-b border-gray-200">
        <td className="px-3 py-1.5 font-medium">{label}</td>
        <td className="px-3 py-1.5 text-gray-500">
          {items.length > 0 ? items.map((d: any) => d.description || d.type).join(', ') : '—'}
        </td>
        <td className="px-3 py-1.5 text-right font-mono">{formatNaira(total)}</td>
      </tr>
    </>
  );
}

function DeductionMobileRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2">
      <span className="text-xs font-medium">{label}</span>
      <span className="font-mono text-xs">{formatNaira(amount)}</span>
    </div>
  );
}
