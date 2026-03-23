import { formatNaira, formatDate } from '@/lib/format';

interface TaxReturnDocumentProps {
  data: any;
}

/**
 * LIRS Form A — Personal Income Tax Return
 * Official 6-part structure: A (Personal Particulars), B (Statement of Income),
 * C (Benefits in Kind), D (Statement of Assets), E (Capital Allowances),
 * F (Personal Reliefs & Tax Computation)
 */
export function TaxReturnDocument({ data }: TaxReturnDocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const gains = Array.isArray(data.capitalGains) ? data.capitalGains : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const benefitsInKind = Array.isArray(data.benefitsInKind) ? data.benefitsInKind : [];
  const assetDeclarations = Array.isArray(data.assetDeclarations) ? data.assetDeclarations : [];
  const capitalAllowances = Array.isArray(data.capitalAllowances) ? data.capitalAllowances : [];

  // Income categorisation per LIRS Form A structure
  const tradeIncomes = incomes.filter((r: any) => ['Freelance', 'Business'].includes(r.type));
  const employmentIncomes = incomes.filter((r: any) => r.type === 'Employment');
  const dividendIncomes = incomes.filter((r: any) => r.type === 'Investment');
  const rentalIncomes = incomes.filter((r: any) => r.type === 'Rental');
  const interestIncomes = incomes.filter((r: any) => r.type === 'Crypto');
  const otherIncomes = incomes.filter((r: any) => r.type === 'Other');

  const sumAmount = (arr: any[]) => arr.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalIncome = sumAmount(incomes);
  const totalGains = gains.reduce((s: number, r: any) => s + Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0)), 0);
  const grossIncome = totalIncome + totalGains;

  // Deduction categories
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
  const totalDeductions = sumAmount(deductions);

  // BIK total
  const totalBIK = benefitsInKind.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);

  // Capital allowances total
  const totalAllowances = capitalAllowances.reduce((s: number, a: any) => s + (a.allowanceAmount || 0), 0);

  // CRA computation (Nigerian Tax Act 2026)
  const assessableIncome = grossIncome + totalBIK;
  const craBase = Math.max(assessableIncome * 0.01, 200000);
  const craTwentyPercent = assessableIncome * 0.20;
  const cra = craBase + craTwentyPercent;
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, assessableIncome - totalDeductions - totalAllowances - cra);

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

  const revenueService = profile?.stateOfResidence === 'Lagos'
    ? 'Lagos State Internal Revenue Service (LIRS)'
    : profile?.stateOfResidence === 'FCT Abuja'
    ? 'FCT Internal Revenue Service (FCT-IRS)'
    : `${profile?.stateOfResidence || ''} State Board of Internal Revenue`;

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm" id="tax-return-document">
      {/* ══════ Official Header ══════ */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500">Federal Republic of Nigeria</p>
          <h1 className="text-sm md:text-lg font-bold uppercase tracking-wide">{revenueService}</h1>
          <div className="border-t border-b border-gray-400 py-2 my-2">
            <h2 className="text-xs md:text-base font-bold uppercase">
              Form A — Personal Income Tax Return
            </h2>
            <p className="text-xs">
              Personal Income Tax Act (PITA) — For Year of Assessment {data.taxYear}
            </p>
          </div>
          <p className="text-[10px] text-gray-500 italic">
            Please complete this form in BLOCK LETTERS and return to the relevant tax authority
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PART A: PERSONAL PARTICULARS OF TAXPAYER
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="A" title="Personal Particulars of Taxpayer">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          <FormField label="1. Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <FormField label="2. Full Name" value={data.fullName || '—'} />
          <FormField label="3. Sex" value={profile?.sex || '—'} />
          <FormField label="4. Date of Birth" value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : '—'} />
          <FormField label="5. Marital Status" value={profile?.maritalStatus || '—'} />
          <FormField label="6. Name of Spouse" value={profile?.spouseName || '—'} />
          <FormField label="7. Number of Children" value={String(profile?.numChildren ?? 0)} />
          <FormField label="8. Occupation / Profession" value={profile?.occupation || '—'} />
          <FormField label="9. Residential Address" value={profile?.residentialAddress || '—'} />
          <FormField label="10. State of Residence" value={profile?.stateOfResidence || '—'} />
          <FormField label="11. Local Government Area" value={profile?.lga || '—'} />
          <FormField label="12. Residency Status" value={profile?.isResident ? 'Resident' : 'Non-Resident'} />
          <FormField label="13. Name of Employer" value={profile?.employerName || 'Self-Employed'} />
          <FormField label="14. Address of Employer" value={profile?.employerAddress || '—'} />
          <FormField label="15. Employer TIN" value={profile?.employerTin || '—'} />
          <FormField label="16. Filing Type" value={profile?.filingType || 'Individual'} />
        </div>
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════
          PART B: STATEMENT OF INCOME
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="B" title={`Statement of Income for the Year Ended 31st December ${data.taxYear}`}>
        {/* (i) Trade, Business, Profession or Vocation */}
        <IncomeGroup
          romanNum="i"
          label="Trade, Business, Profession or Vocation"
          items={tradeIncomes}
        />
        {/* (ii) Employment — Salary, Wages, Fees, Allowances */}
        <IncomeGroup
          romanNum="ii"
          label="Employment — Salary, Wages, Fees, Allowances"
          items={employmentIncomes}
        />
        {/* (iii) Gain or Profit from Disposal of Short-Term Assets */}
        {gains.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3">(iii) Capital Gains on Disposal of Chargeable Assets</p>
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
                  <tr className="border-t border-gray-400 font-semibold">
                    <td colSpan={5} className="px-3 py-1.5 text-right">Total Capital Gains</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalGains)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 px-3">
              {gains.map((r: any, i: number) => {
                const gain = Math.max(0, (r.proceeds || 0) - (r.costBasis || 0) - (r.fees || 0));
                return <MobileRow key={i} index={i + 1} label={r.assetType} sublabel={`Proceeds: ${formatNaira(r.proceeds)}`} amount={gain} />;
              })}
            </div>
          </div>
        )}
        {/* (iv) Dividends & Investment Income */}
        <IncomeGroup romanNum="iv" label="Dividends, Interest & Investment Income" items={dividendIncomes} />
        {/* (v) Rent */}
        <IncomeGroup romanNum="v" label="Rent from Property" items={rentalIncomes} />
        {/* (vi) Interest & Digital Assets */}
        <IncomeGroup romanNum="vi" label="Interest, Royalties & Digital Assets" items={interestIncomes} />
        {/* (vii) Any other income */}
        <IncomeGroup romanNum="vii" label="Any Other Income / Profits" items={otherIncomes} />

        {/* TOTAL INCOME */}
        <div className="border-t-2 border-black mx-3 mt-3 pt-2 flex justify-between font-bold text-sm">
          <span>TOTAL INCOME FROM ALL SOURCES</span>
          <span className="font-mono">{formatNaira(totalIncome)}</span>
        </div>
        {totalGains > 0 && (
          <div className="mx-3 mt-1 flex justify-between font-bold text-sm">
            <span>ADD: Capital Gains</span>
            <span className="font-mono">{formatNaira(totalGains)}</span>
          </div>
        )}
        <div className="border-t border-black mx-3 mt-1 pt-2 flex justify-between font-bold text-base">
          <span>GROSS INCOME</span>
          <span className="font-mono">{formatNaira(grossIncome)}</span>
        </div>
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════
          PART C: BENEFITS IN KIND (BIK)
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="C" title="Benefits in Kind Enjoyed by Taxpayer">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          State the annual value of benefits in kind provided by the employer or enjoyed by the taxpayer
        </p>
        {benefitsInKind.length > 0 ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left px-3 py-1.5">S/N</th>
                    <th className="text-left px-3 py-1.5">Nature of Benefit</th>
                    <th className="text-left px-3 py-1.5">Description</th>
                    <th className="text-right px-3 py-1.5">Annual Value (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitsInKind.map((b: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{b.category}</td>
                      <td className="px-3 py-1.5">{b.description || '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(b.annualValue)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={3} className="px-3 py-1.5 text-right">Total Benefits in Kind</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalBIK)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 px-3">
              {benefitsInKind.map((b: any, i: number) => (
                <MobileRow key={i} index={i + 1} label={b.category} sublabel={b.description} amount={b.annualValue} />
              ))}
              <TotalRow label="Total Benefits in Kind" amount={totalBIK} />
            </div>
          </>
        ) : (
          <EmptySection label="No benefits in kind declared." />
        )}
        <BIKCategories />
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════
          PART D: STATEMENT OF ASSETS & LIABILITIES
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="D" title="Statement of Assets and Liabilities">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          State all assets owned as at 31st December {data.taxYear}
        </p>
        {assetDeclarations.length > 0 ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left px-3 py-1.5">S/N</th>
                    <th className="text-left px-3 py-1.5">Type of Asset</th>
                    <th className="text-left px-3 py-1.5">Description</th>
                    <th className="text-left px-3 py-1.5">Location</th>
                    <th className="text-left px-3 py-1.5">Date Acquired</th>
                    <th className="text-right px-3 py-1.5">Cost (₦)</th>
                    <th className="text-right px-3 py-1.5">Current Value (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {assetDeclarations.map((a: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{a.assetType}</td>
                      <td className="px-3 py-1.5">{a.description || '—'}</td>
                      <td className="px-3 py-1.5">{a.location || '—'}</td>
                      <td className="px-3 py-1.5">{a.dateAcquired ? formatDate(a.dateAcquired) : '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(a.cost)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(a.currentValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 px-3">
              {assetDeclarations.map((a: any, i: number) => (
                <MobileRow key={i} index={i + 1} label={`${a.assetType}: ${a.description || ''}`} sublabel={a.location} amount={a.currentValue} />
              ))}
            </div>
          </>
        ) : (
          <EmptySection label="No assets declared." />
        )}
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════
          PART E: CAPITAL ALLOWANCES
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="E" title="Capital Allowances on Assets Used in Business">
        <p className="text-[10px] text-gray-500 italic px-3 mb-2">
          Capital allowances claimable on qualifying capital expenditure under the relevant schedule
        </p>
        {capitalAllowances.length > 0 ? (
          <>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    <th className="text-left px-3 py-1.5">S/N</th>
                    <th className="text-left px-3 py-1.5">Asset Description</th>
                    <th className="text-left px-3 py-1.5">Year Acquired</th>
                    <th className="text-right px-3 py-1.5">Cost (₦)</th>
                    <th className="text-right px-3 py-1.5">Rate (%)</th>
                    <th className="text-right px-3 py-1.5">Allowance (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {capitalAllowances.map((a: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{a.assetDescription}</td>
                      <td className="px-3 py-1.5">{a.yearAcquired || '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(a.cost)}</td>
                      <td className="px-3 py-1.5 text-right">{a.ratePercent}%</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(a.allowanceAmount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={5} className="px-3 py-1.5 text-right">Total Capital Allowances</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalAllowances)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2 px-3">
              {capitalAllowances.map((a: any, i: number) => (
                <MobileRow key={i} index={i + 1} label={a.assetDescription} sublabel={`Rate: ${a.ratePercent}%`} amount={a.allowanceAmount} />
              ))}
              <TotalRow label="Total Capital Allowances" amount={totalAllowances} />
            </div>
          </>
        ) : (
          <EmptySection label="No capital allowances claimed." />
        )}
      </FormSection>

      {/* ══════════════════════════════════════════════════════════════
          PART F: PERSONAL RELIEFS, CRA & TAX COMPUTATION
         ══════════════════════════════════════════════════════════════ */}
      <FormSection partLabel="F" title="Personal Reliefs, CRA & Tax Computation">
        {/* (a) Statutory Deductions / Personal Reliefs */}
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3">(a) Personal Reliefs & Statutory Deductions</p>
          {deductions.length > 0 ? (
            <>
              <div className="hidden sm:block">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 bg-gray-50">
                      <th className="text-left px-3 py-1.5">S/N</th>
                      <th className="text-left px-3 py-1.5">Category</th>
                      <th className="text-left px-3 py-1.5">Description</th>
                      <th className="text-right px-3 py-1.5">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <DeductionGroupRows label="Pension Fund Contribution" items={pensionDeds} startIndex={1} />
                    <DeductionGroupRows label="NHIS / Health Insurance" items={nhisDeductions} startIndex={pensionDeds.length + 1} />
                    <DeductionGroupRows label="Life Assurance Premium" items={insuranceDeds} startIndex={pensionDeds.length + nhisDeductions.length + 1} />
                    <DeductionGroupRows label="Mortgage Interest Relief" items={mortgageDeds} startIndex={pensionDeds.length + nhisDeductions.length + insuranceDeds.length + 1} />
                    <DeductionGroupRows label="Other Reliefs" items={otherDeds} startIndex={pensionDeds.length + nhisDeductions.length + insuranceDeds.length + mortgageDeds.length + 1} />
                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={3} className="px-3 py-1.5 text-right">Total Statutory Deductions</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalDeductions)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2 px-3">
                {deductions.map((r: any, i: number) => (
                  <MobileRow key={i} index={i + 1} label={r.type} sublabel={r.description} amount={r.amount} />
                ))}
                <TotalRow label="Total Statutory Deductions" amount={totalDeductions} />
              </div>
            </>
          ) : (
            <EmptySection label="No statutory deductions claimed." />
          )}
          <p className="text-[10px] text-gray-400 italic px-3 mt-2">
            Note: Certificates/receipts as evidence of payment must be attached.
          </p>
        </div>

        {/* (b) CRA Computation */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">(b) Consolidated Relief Allowance (CRA) — Nigerian Tax Act 2026</p>
          <LineItem label="Assessable Income (Gross Income + BIK)" value={formatNaira(assessableIncome)} />
          <LineItem label="(i) 1% of Assessable Income" value={formatNaira(assessableIncome * 0.01)} />
          <LineItem label="(ii) ₦200,000 statutory minimum" value={formatNaira(200000)} />
          <LineItem label="Higher of (i) and (ii)" value={formatNaira(craBase)} bold />
          <LineItem label="(iii) 20% of Assessable Income" value={formatNaira(craTwentyPercent)} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>CRA = Higher of (i)/(ii) + (iii)</span>
            <span className="font-mono">{formatNaira(cra)}</span>
          </div>
        </div>

        {/* (c) Taxable Income Computation */}
        <div className="px-3 space-y-1 mb-4">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">(c) Chargeable Income</p>
          <LineItem label="Assessable Income" value={formatNaira(assessableIncome)} />
          <LineItem label="Less: Statutory Deductions (a)" value={`(${formatNaira(totalDeductions)})`} />
          {totalAllowances > 0 && (
            <LineItem label="Less: Capital Allowances (Part E)" value={`(${formatNaira(totalAllowances)})`} />
          )}
          <LineItem label="Less: Consolidated Relief Allowance (b)" value={`(${formatNaira(cra)})`} />
          <div className="flex justify-between py-1.5 border-t border-b border-gray-300 font-bold text-xs">
            <span>Chargeable / Taxable Income</span>
            <span className="font-mono">{formatNaira(taxableIncome)}</span>
          </div>
        </div>

        {/* (d) Progressive Tax Table */}
        <div className="px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">(d) Tax Payable — Progressive Tax Rates (2026)</p>
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
                  <td colSpan={3} className="px-2 py-2 text-right text-sm">TOTAL TAX PAYABLE</td>
                  <td className="px-2 py-2 text-right font-mono text-sm">{formatNaira(computedTax)}</td>
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
            <TotalRow label="TOTAL TAX PAYABLE" amount={computedTax} />
          </div>
        </div>
      </FormSection>

      {/* ══════ Declaration ══════ */}
      <FormSection partLabel="" title="Declaration">
        <div className="px-3 space-y-3">
          <p className="text-xs leading-relaxed">
            I, the undersigned, do hereby declare that the information supplied in this return is, to the best of my
            knowledge and belief, correct and complete. I understand that I may be liable to financial penalties and/or
            prosecution if I give false information or make incorrect returns.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Signature / Thumb Print</p>
              <div className="border-b border-black w-full" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase mb-6">Full Name (Block Letters)</p>
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
        <strong>PENALTY FOR DEFAULT:</strong> In accordance with the Personal Income Tax Act (PITA), making false
        statements and returns or unlawful refusal/neglect to pay accurate tax will attract fine or imprisonment or both.
      </div>

      {/* ══════ Footer ══════ */}
      <div className="border-t-2 border-black pt-4 text-[10px] text-gray-500 space-y-1">
        <div className="flex flex-col sm:flex-row justify-between gap-1">
          <span>Generated by Tax Ease on {formatDate(data.generatedAt)}</span>
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

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════ */

function FormSection({ partLabel, title, children }: { partLabel: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 pdf-keep-together">
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

function EmptySection({ label }: { label: string }) {
  return <p className="text-gray-400 italic px-3 text-xs mb-3">{label}</p>;
}

/** Renders a group of income items with a roman numeral header */
function IncomeGroup({ romanNum, label, items }: { romanNum: string; label: string; items: any[] }) {
  if (items.length === 0) return null;
  const total = items.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 px-3">({romanNum}) {label}</p>
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="text-left px-3 py-1.5">S/N</th>
              <th className="text-left px-3 py-1.5">Description</th>
              <th className="text-left px-3 py-1.5">Frequency</th>
              <th className="text-right px-3 py-1.5">Amount (₦)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="px-3 py-1.5">{i + 1}</td>
                <td className="px-3 py-1.5">{r.description || r.type}</td>
                <td className="px-3 py-1.5">{r.frequency}</td>
                <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-400 font-semibold">
              <td colSpan={3} className="px-3 py-1.5 text-right">Sub-total</td>
              <td className="px-3 py-1.5 text-right font-mono">{formatNaira(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="sm:hidden space-y-2 px-3">
        {items.map((r: any, i: number) => (
          <MobileRow key={i} index={i + 1} label={r.description || r.type} sublabel={r.frequency} amount={r.amount} />
        ))}
        <div className="flex justify-between pt-1 border-t border-gray-400 font-semibold text-xs">
          <span>Sub-total</span>
          <span className="font-mono">{formatNaira(total)}</span>
        </div>
      </div>
    </div>
  );
}

function DeductionGroupRows({ label, items, startIndex }: { label: string; items: any[]; startIndex: number }) {
  if (items.length === 0) return null;
  return (
    <>
      <tr className="bg-gray-50/50">
        <td colSpan={4} className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase">{label}</td>
      </tr>
      {items.map((r: any, i: number) => (
        <tr key={i} className="border-b border-gray-200">
          <td className="px-3 py-1.5">{startIndex + i}</td>
          <td className="px-3 py-1.5">{r.type}</td>
          <td className="px-3 py-1.5">{r.description || '—'}</td>
          <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
        </tr>
      ))}
    </>
  );
}

/** Reference list of BIK categories per LIRS standards */
function BIKCategories() {
  return (
    <div className="px-3 mt-3 text-[10px] text-gray-400">
      <p className="font-bold mb-1">Standard BIK categories:</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
        <span>• Accommodation</span>
        <span>• Motor Vehicle</span>
        <span>• Utilities (water, electricity)</span>
        <span>• Domestic Staff</span>
        <span>• Entertainment</span>
        <span>• Furniture & Fittings</span>
        <span>• Meals / Food</span>
        <span>• Telephone</span>
        <span>• Others</span>
      </div>
    </div>
  );
}
