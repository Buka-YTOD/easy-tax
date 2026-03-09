import { formatNaira, formatDate } from '@/lib/format';

interface AbujaFormADocumentProps {
  data: any;
}

/**
 * FCT-IRS Form A — Personal Income Tax Return
 * Official 4-part structure matching the FCT Internal Revenue Service layout:
 * Part A: Personal Details
 * Part B: Statement of Income (8 categories: Earned X + Investment Y)
 * Part C: Benefits in Kind (residential, rent, domestic staff, vehicles, other)
 * Part D: Allowances for Life Assurance, Gratuities, NHIS & Pension
 * Uses legacy PITA tax brackets (7%, 11%, 15%, 19%, 21%, 24%)
 */
export function AbujaFormADocument({ data }: AbujaFormADocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = Array.isArray(data.incomeRecords) ? data.incomeRecords : [];
  const deductions = Array.isArray(data.deductions) ? data.deductions : [];
  const benefitsInKind = Array.isArray(data.benefitsInKind) ? data.benefitsInKind : [];
  const capitalAllowances = Array.isArray(data.capitalAllowances) ? data.capitalAllowances : [];

  // Income categories per FCT-IRS Form A structure
  const tradeBusinessIncomes = incomes.filter((r: any) => ['Freelance', 'Business'].includes(r.type));
  const employmentIncomes = incomes.filter((r: any) => r.type === 'Employment');
  const pensionAnnuityIncomes = incomes.filter((r: any) => r.type === 'Pension');
  const foreignIncomes = incomes.filter((r: any) => r.type === 'Foreign');
  const dividendIncomes = incomes.filter((r: any) => r.type === 'Investment');
  const interestIncomes = incomes.filter((r: any) => r.type === 'Crypto');
  const rentalIncomes = incomes.filter((r: any) => r.type === 'Rental');
  const otherIncomes = incomes.filter((r: any) => r.type === 'Other');

  const sumAmount = (arr: any[]) => arr.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  // Earned income (i-iv)
  const earnedIncome =
    sumAmount(tradeBusinessIncomes) +
    sumAmount(employmentIncomes) +
    sumAmount(pensionAnnuityIncomes) +
    sumAmount(foreignIncomes);

  // Investment income (v-viii)
  const investmentIncome =
    sumAmount(dividendIncomes) +
    sumAmount(interestIncomes) +
    sumAmount(rentalIncomes) +
    sumAmount(otherIncomes);

  const totalIncome = earnedIncome + investmentIncome;

  // Deduction categories for Part D
  const lifePremiums = deductions.filter((d: any) =>
    d.type?.toLowerCase().includes('life') || d.type?.toLowerCase().includes('insurance')
  );
  const pensionDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('pension'));
  const nhisDeds = deductions.filter((d: any) =>
    d.type?.toLowerCase().includes('health') || d.type?.toLowerCase().includes('nhis')
  );
  const gratuityDeds = deductions.filter((d: any) => d.type?.toLowerCase().includes('gratuity'));
  const totalDeductions = deductions.reduce((s: number, d: any) => s + (d.amount || 0), 0);

  // BIK categories
  const bikAccommodation = benefitsInKind.filter((b: any) =>
    b.category?.toLowerCase().includes('accommodation') || b.category?.toLowerCase().includes('rent')
  );
  const bikDomestic = benefitsInKind.filter((b: any) =>
    b.category?.toLowerCase().includes('domestic') || b.category?.toLowerCase().includes('staff')
  );
  const bikVehicle = benefitsInKind.filter((b: any) =>
    b.category?.toLowerCase().includes('vehicle') || b.category?.toLowerCase().includes('motor')
  );
  const bikOther = benefitsInKind.filter((b: any) =>
    !b.category?.toLowerCase().includes('accommodation') &&
    !b.category?.toLowerCase().includes('rent') &&
    !b.category?.toLowerCase().includes('domestic') &&
    !b.category?.toLowerCase().includes('staff') &&
    !b.category?.toLowerCase().includes('vehicle') &&
    !b.category?.toLowerCase().includes('motor')
  );
  const totalBIK = benefitsInKind.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);

  // CRA computation (PITA)
  const grossIncome = totalIncome + totalBIK;
  const craOnePercent = grossIncome * 0.01;
  const craBase = Math.max(craOnePercent, 200000);
  const craTwentyPercent = grossIncome * 0.20;
  const cra = craBase + craTwentyPercent;
  const totalAllowances = capitalAllowances.reduce((s: number, a: any) => s + (a.allowanceAmount || 0), 0);
  const taxableIncome = computation?.taxableIncome ?? Math.max(0, grossIncome - totalDeductions - totalAllowances - cra);

  // Legacy PITA brackets per FCT-IRS guide
  const pitaBrackets = [
    { lower: 0, upper: 300000, rate: 7 },
    { lower: 300000, upper: 600000, rate: 11 },
    { lower: 600000, upper: 1100000, rate: 15 },
    { lower: 1100000, upper: 1600000, rate: 19 },
    { lower: 1600000, upper: 3200000, rate: 21 },
    { lower: 3200000, upper: Infinity, rate: 24 },
  ];
  const computedBrackets = pitaBrackets.map(b => {
    const taxableInBracket = Math.max(0, Math.min(taxableIncome, b.upper) - b.lower);
    const taxInBracket = taxableInBracket * (b.rate / 100);
    return { ...b, taxableInBracket, taxInBracket };
  });
  const computedTax = computation?.taxOwed ?? computedBrackets.reduce((s, b) => s + b.taxInBracket, 0);

  // Split full name
  const nameParts = (data.fullName || '').split(' ');
  const firstName = nameParts[0] || '';
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black" id="abuja-form-a-document">
      {/* ═══════ PAGE 1 ═══════ */}
      <div className="border border-[#1f4e78] p-4 relative mb-6" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt' }}>
        {/* Header */}
        <div className="text-center relative mb-2">
          <div className="absolute right-0 top-1 text-2xl font-bold">Form A</div>
          <p className="font-bold text-xs">FEDERAL REPUBLIC OF NIGERIA</p>
          <p className="font-bold text-sm text-[#1f4e78]">FCT INTERNAL REVENUE SERVICE</p>
          <p className="text-[8pt] font-bold text-[#7030a0]">PERSONAL INCOME TAX RETURN</p>
          <p className="text-[7pt] italic text-[#c00000]">Personal Income Tax Act</p>
          <p className="text-[7pt] italic text-[#c00000]">
            Individual Tax Return for the Year of Assessment 20{String(data.taxYear || '').slice(-2)}
          </p>
        </div>
        <div className="text-center text-[8pt] py-0.5 border-b border-black mb-1">
          Please complete this form in CAPITAL letters
        </div>

        {/* PART A: PERSONAL DETAILS */}
        <SectionHeader part="A" title="PERSONAL DETAILS" />
        <div className="border border-black mb-1">
          <div className="flex border-b border-black">
            <div className="flex-1 p-1 font-bold border-r border-black text-[9pt]">Name</div>
            <div className="p-1 text-right text-[9pt]">
              FCT-IRS TIN: <GridValue value={profile?.tin || ''} length={10} />
            </div>
          </div>
          <div className="p-1.5">
            <div className="flex gap-3">
              <NameGrid label="First Name" value={firstName} />
              <NameGrid label="Middle Name" value={middleName} />
              <NameGrid label="Surname" value={surname} />
            </div>
          </div>
        </div>
        <FieldRow label="e-mail Address" value={data.email || profile?.email || '—'} />
        <FieldRow label="Contact Telephone No(s)." value={profile?.phoneNumber || '—'} />
        <FieldRow label="Residential Address" value={profile?.residentialAddress || '—'} />
        <FieldRow label="Employer/Business Name" value={profile?.employerName || 'Self-Employed'} />
        <FieldRow label="Employer Address" value={profile?.employerAddress || '—'} />
        <FieldRow label="Marital Status" value={profile?.maritalStatus || '—'} />
        <FieldRow label="Occupation" value={profile?.occupation || '—'} />

        {/* PART B: STATEMENT OF INCOME */}
        <SectionHeader part="B" title={`STATEMENT OF INCOME FOR THE YEAR ENDED 31ST DECEMBER ${data.taxYear}`} />

        <div className="px-0.5 text-[9pt]">
          {/* Earned Income */}
          <IncomeLineItems
            roman="i"
            label="Trade, Business, Profession, Vocation etc"
            items={tradeBusinessIncomes}
          />
          <div className="ml-3 text-[7pt] italic text-gray-600 mb-0.5">
            Attach copies of Accounts for the Year Ended 31st December {data.taxYear}
          </div>

          <div className="font-bold text-[9pt] px-1 mb-0.5">(ii) Employment:</div>
          {employmentIncomes.length > 0 ? (
            employmentIncomes.map((r: any, i: number) => (
              <IncomeRow key={i} label={`    ${r.description || 'Salary'}`} amount={r.amount} indent />
            ))
          ) : (
            <IncomeRow label="    Salary" amount={0} indent />
          )}

          <IncomeLineItems roman="iii" label="Pension / Annuity / Gratuities" items={pensionAnnuityIncomes} />
          <IncomeLineItems roman="iv" label="Income received from sources outside Nigeria" items={foreignIncomes} />

          <div className="flex justify-between font-bold text-[9pt] px-1 mt-2 py-1 border-t border-black">
            <span>Aggregate Earned Income (i-iv above) (X)</span>
            <span>N {(earnedIncome).toLocaleString('en-NG')}</span>
          </div>

          {/* Investment Income */}
          <IncomeLineItems roman="v" label="Dividends from Nigerian / Foreign Companies" items={dividendIncomes} />
          <IncomeLineItems roman="vi" label="Interest" items={interestIncomes} />
          <IncomeLineItems roman="vii" label="Rents" items={rentalIncomes} />
          <IncomeLineItems roman="viii" label="Other profits / income not included above" items={otherIncomes} />

          <div className="flex justify-between font-bold text-[9pt] px-1 mt-2 py-1 border-t border-black">
            <span>Aggregate Investment Income (v-viii above) (Y)</span>
            <span>N {(investmentIncome).toLocaleString('en-NG')}</span>
          </div>
        </div>

        <div className="text-[7pt] italic px-1 mt-1">
          <b><i>Note:</i></b> <i>When any source of income have been acquired or have ceased during this year ended 31st December, {data.taxYear} (Attach particulars and dates)</i>
        </div>

        <div className="text-center font-bold py-2 text-[10pt]">
          TOTAL INCOME (X + Y) &nbsp;&nbsp;&nbsp; =N= {totalIncome.toLocaleString('en-NG')}
        </div>

        {/* Spouse & Children (if married) */}
        {profile?.maritalStatus === 'Married' && (
          <div className="border-t border-black text-[8pt]">
            <div className="font-bold px-1 py-0.5">If Married, State Spouse's and Children's details:</div>
            <table className="w-full border-collapse text-[8pt]">
              <tbody>
                <tr className="border border-black">
                  <td className="border border-black p-1">Full name: {profile?.spouseName || '—'}</td>
                  <td className="border border-black p-1">Date of Birth: —</td>
                </tr>
                <tr>
                  <td className="border border-black p-1" colSpan={2}>
                    Children: {profile?.numChildren || 0}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* PART C: BENEFITS IN KIND */}
        <SectionHeader part="C" title="BENEFITS IN KIND" />
        <table className="w-full border-collapse text-[8pt]">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold" colSpan={2}>a. Residential Address</td>
            </tr>
            <tr>
              <td className="border border-black p-1 w-1/2">
                1. As at 1st January, {data.taxYear}<br />
                <span className="text-[8pt]">{profile?.residentialAddress || '—'}</span>
              </td>
              <td className="border border-black p-1 w-1/2">
                2. Changes during the year<br />
                <span className="text-[8pt]">—</span>
              </td>
            </tr>
            {bikAccommodation.map((b: any, i: number) => (
              <tr key={`acc-${i}`}>
                <td className="border border-black p-1">
                  {i === 0 ? 'b.' : ''} Rent Paid: {b.description || b.category}
                </td>
                <td className="border border-black p-1 text-right">N {(b.annualValue || 0).toLocaleString('en-NG')}</td>
              </tr>
            ))}
            {bikAccommodation.length === 0 && (
              <>
                <tr><td className="border border-black p-1">b. Rent Paid</td><td className="border border-black p-1 text-right">N —</td></tr>
                <tr><td className="border border-black p-1">c. Rent Paid by the Employer</td><td className="border border-black p-1 text-right">N —</td></tr>
                <tr><td className="border border-black p-1">d. Rent Paid or Reimbursed by you</td><td className="border border-black p-1 text-right">N —</td></tr>
              </>
            )}
          </tbody>
        </table>

        <div className="text-[7pt] text-right mt-0.5 text-gray-500">1 of 2 &nbsp;&nbsp; FCT-IRS Form A</div>
      </div>

      {/* ═══════ PAGE 2 ═══════ */}
      <div className="border border-[#1f4e78] p-4 relative mb-6 pdf-page-break-before" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt' }}>
        {/* Continuation of Part C */}
        <table className="w-full border-collapse text-[8pt] mb-2">
          <tbody>
            <tr>
              <td className="border border-black p-1 font-bold" colSpan={3}>
                e. Name of Domestic Servants (Maids, Drivers, Gardener, Watchmen, Cooks, etc)
              </td>
            </tr>
            {bikDomestic.length > 0 ? bikDomestic.map((b: any, i: number) => (
              <tr key={`dom-${i}`}>
                <td className="border border-black p-1">{b.description || b.category}</td>
                <td className="border border-black p-1 text-right">N {(b.annualValue || 0).toLocaleString('en-NG')}</td>
              </tr>
            )) : (
              <tr><td className="border border-black p-1 text-gray-400 italic" colSpan={3}>None declared</td></tr>
            )}
          </tbody>
        </table>

        <div className="text-[7pt] italic mb-2">
          <i>Note: Please asterisk those paid for by your employer or a separate entity apart from self, and annex the details.</i>
        </div>

        {/* Vehicles */}
        <div className="font-bold text-[9pt] border border-black border-b-0 p-1">g. Vehicle(s)</div>
        <table className="w-full border-collapse text-[8pt] mb-1">
          <tbody>
            {bikVehicle.length > 0 ? bikVehicle.map((b: any, i: number) => (
              <tr key={`veh-${i}`}>
                <td className="border border-black p-1">{b.description || 'Vehicle'}</td>
                <td className="border border-black p-1 text-right">Cost N {(b.annualValue || 0).toLocaleString('en-NG')}</td>
              </tr>
            )) : (
              <tr><td className="border border-black p-1 text-gray-400 italic" colSpan={2}>None declared</td></tr>
            )}
          </tbody>
        </table>

        {/* Other BIK */}
        <div className="font-bold text-[9pt] p-1">h. Other Benefits in Kind</div>
        <table className="w-full border-collapse text-[8pt] mb-2">
          <tbody>
            {bikOther.length > 0 ? bikOther.map((b: any, i: number) => (
              <tr key={`oth-${i}`}>
                <td className="border border-black p-1 w-4/5">{i + 1}. {b.description || b.category}</td>
                <td className="border border-black p-1 text-right">Cost N {(b.annualValue || 0).toLocaleString('en-NG')}</td>
              </tr>
            )) : (
              <tr><td className="border border-black p-1 text-gray-400 italic" colSpan={2}>None declared</td></tr>
            )}
          </tbody>
        </table>

        {totalBIK > 0 && (
          <div className="flex justify-between font-bold text-[9pt] px-1 py-1 border-t-2 border-black mb-2">
            <span>Total Benefits in Kind</span>
            <span>N {totalBIK.toLocaleString('en-NG')}</span>
          </div>
        )}

        {/* PART D: ALLOWANCES */}
        <SectionHeader part="D" title="ALLOWANCES FOR LIFE ASSURANCE, GRATUITIES, NHIS AND PENSION CONTRIBUTION" subtitle="(100% of sum paid)" />
        <table className="w-full border-collapse text-[8pt]">
          <thead>
            <tr>
              <th className="border border-black p-1 text-left text-[8pt] font-normal">Name of Company (Insurance/Employer/HMO/PFA)</th>
              <th className="border border-black p-1 text-left text-[8pt] font-normal">Whether on life of Self or Spouse</th>
              <th className="border border-black p-1 text-left text-[8pt] font-normal">Capital sum paid on death (N)</th>
              <th className="border border-black p-1 text-left text-[8pt] font-normal">Premiums Paid during the year ended 31st Dec {data.taxYear} (N)</th>
            </tr>
          </thead>
          <tbody>
            {[...lifePremiums, ...pensionDeds, ...nhisDeds, ...gratuityDeds].length > 0 ? (
              [...lifePremiums, ...pensionDeds, ...nhisDeds, ...gratuityDeds].map((d: any, i: number) => (
                <tr key={i}>
                  <td className="border border-black p-1">{d.description || d.type}</td>
                  <td className="border border-black p-1">Self</td>
                  <td className="border border-black p-1 text-right">—</td>
                  <td className="border border-black p-1 text-right">{(d.amount || 0).toLocaleString('en-NG')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border border-black p-1 text-gray-400 italic" colSpan={4}>No allowances declared</td>
              </tr>
            )}
            {totalDeductions > 0 && (
              <tr className="font-bold">
                <td className="border border-black p-1" colSpan={3} style={{ textAlign: 'right' }}>Total</td>
                <td className="border border-black p-1 text-right">{totalDeductions.toLocaleString('en-NG')}</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="text-[7pt] italic mt-1 mb-2">
          <b><i>Note:</i></b> <i>Certificate/Receipt as evidence of payment must be attached</i>
        </div>

        {/* CRA & Tax Computation (appended for completeness) */}
        <div className="border border-black border-l-[3px] border-l-[#c00000] p-1 font-bold text-[9pt] mb-1">
          <span className="text-[#c00000]">TAX COMPUTATION</span>{' '}
          <span className="text-[#1f4e78]">— CRA & PITA Rates</span>
        </div>
        <div className="px-1 text-[8pt] space-y-0.5 mb-2">
          <div className="flex justify-between"><span>Gross Income (Total Income + BIK)</span><span>N {grossIncome.toLocaleString('en-NG')}</span></div>
          <div className="flex justify-between"><span>Less: Statutory Deductions (Part D)</span><span>(N {totalDeductions.toLocaleString('en-NG')})</span></div>
          {totalAllowances > 0 && (
            <div className="flex justify-between"><span>Less: Capital Allowances</span><span>(N {totalAllowances.toLocaleString('en-NG')})</span></div>
          )}
          <div className="flex justify-between"><span>Less: CRA [Higher of 1% or ₦200,000] + 20% of Gross</span><span>(N {cra.toLocaleString('en-NG')})</span></div>
          <div className="flex justify-between font-bold border-t border-b border-black py-0.5">
            <span>Chargeable / Taxable Income</span>
            <span>N {taxableIncome.toLocaleString('en-NG')}</span>
          </div>
        </div>

        <table className="w-full border-collapse text-[8pt] mb-2">
          <thead>
            <tr>
              <th className="border border-black p-1 text-left">Income Bracket</th>
              <th className="border border-black p-1 text-right">Rate</th>
              <th className="border border-black p-1 text-right">Taxable (N)</th>
              <th className="border border-black p-1 text-right">Tax (N)</th>
            </tr>
          </thead>
          <tbody>
            {computedBrackets.map((b, i) => (
              <tr key={i} className={b.taxableInBracket > 0 ? 'bg-green-50' : ''}>
                <td className="border border-black p-1">
                  {b.lower === 0 ? 'First' : 'Next'} N{(b.upper === Infinity ? '3,200,000+' : (b.upper - b.lower).toLocaleString('en-NG'))}
                </td>
                <td className="border border-black p-1 text-right font-bold">{b.rate}%</td>
                <td className="border border-black p-1 text-right font-mono">{b.taxableInBracket.toLocaleString('en-NG')}</td>
                <td className="border border-black p-1 text-right font-mono">{Math.round(b.taxInBracket).toLocaleString('en-NG')}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="border border-black p-1" colSpan={3} style={{ textAlign: 'right' }}>TOTAL TAX PAYABLE</td>
              <td className="border border-black p-1 text-right font-mono">{Math.round(computedTax).toLocaleString('en-NG')}</td>
            </tr>
          </tbody>
        </table>

        {/* PENALTY */}
        <div className="border border-black border-l-[3px] border-l-[#c00000] p-1 font-bold text-[9pt] mb-0.5">
          <span className="text-[#c00000]">PENALTY FOR DEFAULT</span>
        </div>
        <div className="border border-black border-t-0 p-1 text-[8pt] mb-2">
          Please note that in accordance with the relevant laws, making false statements and returns or unlawful refusal/neglect to pay accurate tax will attract fine or imprisonment or both.
        </div>

        {/* DECLARATION */}
        <div className="border border-black border-l-[3px] border-l-[#c00000] p-1 font-bold text-[9pt] mb-0.5">
          <span className="text-[#c00000]">DECLARATION</span>{' '}
          <span className="text-[#1f4e78]">(MUST BE COMPLETED AND SIGNED)</span>
        </div>
        <div className="border border-black border-t-0 p-2 text-[8pt] leading-relaxed mb-2">
          I <span className="font-bold uppercase border-b border-black px-1 inline-block min-w-[200px]">{data.fullName || '_______________'}</span> hereby
          declare that the information supplied in this form to the best of my knowledge and belief contains correct and complete statement of the
          amount of income from all sources. I understand that I may have to pay financial penalties and face prosecution if I give false information.
          <div className="flex gap-8 mt-4">
            <div>
              <span className="text-[7pt] text-gray-500 uppercase">Given under my hand this</span>
              <div className="border-b border-black w-20 inline-block ml-1" />
            </div>
            <div>
              <span className="text-[7pt] text-gray-500 uppercase">Day of</span>
              <div className="border-b border-black w-20 inline-block ml-1" />
            </div>
            <div>
              <span className="text-[7pt] text-gray-500 uppercase">Signature/Thumb print</span>
              <div className="border-b border-black w-32 inline-block ml-1" />
            </div>
          </div>
        </div>

        {/* GUIDE */}
        <div className="border border-black p-1 text-[7pt] leading-tight">
          <div className="font-bold underline text-center text-[8pt] mb-1">GUIDE TO COMPLETING FORM A</div>
          <div className="font-bold">GENERAL</div>
          <ul className="ml-2 list-disc list-inside mb-1">
            <li>Before completing this form, you should carefully read the entire form and the guide notes.</li>
            <li>Complete/Fill this form in CAPITAL ONLY.</li>
            <li>Proprietors of enterprises filing form A should attach audited financial statement.</li>
          </ul>
          <div className="font-bold">CONSOLIDATED RELIEF ALLOWANCE (CRA) AND RATES</div>
          <div className="mb-1">CRA is the higher of (i) and (ii) plus 20% of gross income. (i) 1% of gross income or N200,000 whichever is higher (ii) 20% of Gross Income.</div>
          <table className="text-[7pt] w-auto">
            <tbody>
              <tr><td className="pr-2">First</td><td className="pr-2">N300,000</td><td className="pr-4">7%</td><td className="pr-2">Next</td><td className="pr-2">N500,000</td><td>19%</td></tr>
              <tr><td className="pr-2">Next</td><td className="pr-2">N300,000</td><td className="pr-4">11%</td><td className="pr-2">Next</td><td className="pr-2">N1,600,000</td><td>21%</td></tr>
              <tr><td className="pr-2">Next</td><td className="pr-2">N500,000</td><td className="pr-4">15%</td><td className="pr-2">Above</td><td className="pr-2">N3,200,000</td><td>24%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-between text-[7pt] text-gray-500 mt-1">
          <span>2 of 2</span>
          <span>FCT-IRS Form A</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-500 space-y-1 mt-4">
        <div className="flex justify-between">
          <span>Generated by TaxWise on {formatDate(data.generatedAt)}</span>
          <span>For filing preparation purposes only.</span>
        </div>
        <p className="italic">
          This is not an official FCT-IRS document. Please submit through the FCT-IRS e-filing portal or your nearest tax office.
        </p>
      </div>
    </div>
  );
}

/* ═══════ Sub-components ═══════ */

function SectionHeader({ part, title, subtitle }: { part: string; title: string; subtitle?: string }) {
  return (
    <div className="border border-black border-l-[3px] border-l-[#c00000] p-1 font-bold text-[9pt] mt-1 mb-1">
      <span className="text-[#c00000]">PART {part}:</span>{' '}
      <span className="text-[#1f4e78] font-bold">{title}</span>
      {subtitle && <span className="text-[8pt] font-normal italic"> {subtitle}</span>}
    </div>
  );
}

function GridValue({ value, length }: { value: string; length: number }) {
  const chars = value.toUpperCase().split('');
  return (
    <span className="inline-flex">
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          className="inline-block w-[15px] h-[16px] border border-black text-center text-[8pt] leading-[16px] font-mono"
          style={{ borderRight: i < length - 1 ? 'none' : '1px solid black' }}
        >
          {chars[i] || ''}
        </span>
      ))}
    </span>
  );
}

function NameGrid({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <GridValue value={value} length={15} />
      <div className="text-[7pt] text-gray-500">{label}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black p-1 text-[8pt] mb-[-1px]">
      <span className="text-[8pt]">{label}: </span>
      <span className="font-medium uppercase">{value}</span>
    </div>
  );
}

function IncomeRow({ label, amount, indent }: { label: string; amount: number; indent?: boolean }) {
  return (
    <div className={`flex justify-between text-[9pt] px-1 ${indent ? 'pl-5' : ''}`}>
      <span>{label}</span>
      <span>N {(amount || 0).toLocaleString('en-NG')}</span>
    </div>
  );
}

function IncomeLineItems({ roman, label, items }: { roman: string; label: string; items: any[] }) {
  const total = items.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  return (
    <div className="mb-1">
      <div className="font-bold text-[9pt] px-1">({roman}) {label}</div>
      {items.length > 0 ? (
        items.map((r: any, i: number) => (
          <IncomeRow key={i} label={`    ${r.description || r.type}`} amount={r.amount} indent />
        ))
      ) : (
        <IncomeRow label={`    —`} amount={0} indent />
      )}
      {items.length > 1 && (
        <div className="flex justify-between text-[9pt] px-1 pl-5 font-semibold border-t border-gray-300 mt-0.5">
          <span>Sub-total</span>
          <span>N {total.toLocaleString('en-NG')}</span>
        </div>
      )}
    </div>
  );
}
