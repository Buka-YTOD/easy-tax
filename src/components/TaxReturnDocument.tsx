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

  const totalIncome = incomes.reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const totalGains = gains.reduce((s: number, r: any) => s + (r.gain || 0), 0);
  const totalDeductions = deductions.reduce((s: number, r: any) => s + (r.amount || 0), 0);

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black text-sm" id="tax-return-document">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-4 md:mb-6">
        <div className="text-center">
          <h1 className="text-base md:text-xl font-bold uppercase tracking-wide">Federal Republic of Nigeria</h1>
          <p className="text-xs md:text-sm text-gray-600">Federal Inland Revenue Service (FIRS)</p>
          <h2 className="text-sm md:text-lg font-bold mt-2 uppercase">{formType} — Annual Tax Return</h2>
          <p className="text-xs md:text-sm mt-1">Tax Year: <strong>{data.taxYear}</strong></p>
        </div>
      </div>

      {/* Section 1: Taxpayer Information */}
      <Section title="Section 1 — Taxpayer Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 px-3">
          <FieldRow label="Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <FieldRow label="Filing Type" value={profile?.filingType || '—'} />
          <FieldRow label="State of Residence" value={profile?.stateOfResidence || '—'} />
          <FieldRow label="Residency Status" value={profile?.isResident ? 'Resident' : 'Non-Resident'} />
        </div>
      </Section>

      {/* Section 2: Income */}
      <Section title="Section 2 — Income Declaration">
        {incomes.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left px-3 py-1.5 font-semibold">S/N</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Type</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Frequency</th>
                    <th className="text-left px-3 py-1.5 font-semibold">Description</th>
                    <th className="text-right px-3 py-1.5 font-semibold">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((r: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="px-3 py-1.5">{i + 1}</td>
                      <td className="px-3 py-1.5">{r.type}</td>
                      <td className="px-3 py-1.5">{r.frequency}</td>
                      <td className="px-3 py-1.5">{r.description || '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black font-bold">
                    <td colSpan={4} className="px-3 py-1.5 text-right">Total Income</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2 px-3">
              {incomes.map((r: any, i: number) => (
                <MobileRow key={i} index={i + 1} label={r.type} sublabel={r.frequency} amount={r.amount} />
              ))}
              <div className="flex justify-between pt-2 border-t-2 border-black font-bold">
                <span>Total Income</span>
                <span className="font-mono">{formatNaira(totalIncome)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 px-3 italic">No income records declared.</p>
        )}
      </Section>

      {/* Section 3: Capital Gains */}
      {gains.length > 0 && (
        <Section title="Section 3 — Capital Gains">
          <div className="hidden sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left px-3 py-1.5 font-semibold">S/N</th>
                  <th className="text-left px-3 py-1.5 font-semibold">Asset Type</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Proceeds (₦)</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Cost Basis (₦)</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Fees (₦)</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Net Gain (₦)</th>
                </tr>
              </thead>
              <tbody>
                {gains.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-3 py-1.5">{i + 1}</td>
                    <td className="px-3 py-1.5">{r.assetType}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.proceeds)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.costBasis)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.fees)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.gain)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={5} className="px-3 py-1.5 text-right">Total Capital Gains</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalGains)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2 px-3">
            {gains.map((r: any, i: number) => (
              <MobileRow key={i} index={i + 1} label={r.assetType} sublabel={`Proceeds: ${formatNaira(r.proceeds)}`} amount={r.gain} />
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold">
              <span>Total Capital Gains</span>
              <span className="font-mono">{formatNaira(totalGains)}</span>
            </div>
          </div>
        </Section>
      )}

      {/* Section 4: Deductions */}
      {deductions.length > 0 && (
        <Section title={`Section ${gains.length > 0 ? '4' : '3'} — Reliefs & Deductions`}>
          <div className="hidden sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left px-3 py-1.5 font-semibold">S/N</th>
                  <th className="text-left px-3 py-1.5 font-semibold">Type</th>
                  <th className="text-left px-3 py-1.5 font-semibold">Description</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Amount (₦)</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-3 py-1.5">{i + 1}</td>
                    <td className="px-3 py-1.5">{r.type}</td>
                    <td className="px-3 py-1.5">{r.description || '—'}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={3} className="px-3 py-1.5 text-right">Total Deductions</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-2 px-3">
            {deductions.map((r: any, i: number) => (
              <MobileRow key={i} index={i + 1} label={r.type} sublabel={r.description} amount={r.amount} />
            ))}
            <div className="flex justify-between pt-2 border-t-2 border-black font-bold">
              <span>Total Deductions</span>
              <span className="font-mono">{formatNaira(totalDeductions)}</span>
            </div>
          </div>
        </Section>
      )}

      {/* Tax Computation Summary */}
      {computation && (
        <Section title="Tax Computation Summary">
          <div className="px-3 space-y-1.5">
            <SummaryRow label="Gross Income" value={formatNaira(computation.totalIncome)} />
            <SummaryRow label="Less: Allowable Deductions" value={formatNaira(totalDeductions)} />
            <SummaryRow label="Taxable Income" value={formatNaira(computation.taxableIncome)} bold />
            <div className="flex justify-between py-1.5 border-t-2 border-black font-bold text-base">
              <span>Tax Payable</span>
              <span className="font-mono">{formatNaira(computation.taxOwed)}</span>
            </div>
          </div>

          {computation.breakdownJson?.brackets && (
            <div className="mt-4 px-3">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Progressive Tax Breakdown</p>
              <div className="hidden sm:block">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left px-2 py-1">Bracket</th>
                      <th className="text-right px-2 py-1">Rate</th>
                      <th className="text-right px-2 py-1">Taxable (₦)</th>
                      <th className="text-right px-2 py-1">Tax (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computation.breakdownJson.brackets.map((b: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-1">{formatNaira(b.lower)} – {formatNaira(b.upper)}</td>
                        <td className="px-2 py-1 text-right">{b.rate}%</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNaira(b.taxableInBracket)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatNaira(b.taxInBracket)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2">
                {computation.breakdownJson.brackets.map((b: any, i: number) => (
                  <div key={i} className="border-b border-gray-100 pb-2">
                    <div className="flex justify-between text-xs">
                      <span>{formatNaira(b.lower)} – {formatNaira(b.upper)}</span>
                      <span className="font-semibold">{b.rate}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>Taxable: {formatNaira(b.taxableInBracket)}</span>
                      <span className="font-mono">Tax: {formatNaira(b.taxInBracket)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Footer */}
      <div className="border-t-2 border-black pt-4 mt-6 md:mt-8 text-xs text-gray-500">
        <div className="flex flex-col sm:flex-row justify-between gap-1">
          <span>Generated by TaxWise on {formatDate(data.generatedAt)}</span>
          <span>This document is for filing preparation purposes only.</span>
        </div>
        <p className="mt-2 italic">
          This is not an official FIRS document. Please submit through the FIRS e-filing portal or your nearest tax office.
        </p>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 md:mb-6">
      <h3 className="text-xs md:text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 border-b border-gray-200 ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function MobileRow({ index, label, sublabel, amount }: { index: number; label: string; sublabel?: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2">
      <div className="flex items-start gap-2 min-w-0">
        <span className="text-xs text-gray-400 mt-0.5">{index}.</span>
        <div className="min-w-0">
          <p className="font-medium truncate">{label}</p>
          {sublabel && <p className="text-xs text-gray-500 truncate">{sublabel}</p>}
        </div>
      </div>
      <span className="font-mono text-right flex-shrink-0 ml-2">{formatNaira(amount)}</span>
    </div>
  );
}
