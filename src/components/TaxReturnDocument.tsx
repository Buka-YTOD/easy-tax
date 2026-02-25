import { formatNaira, formatDate } from '@/lib/format';

interface TaxReturnDocumentProps {
  data: any;
}

export function TaxReturnDocument({ data }: TaxReturnDocumentProps) {
  if (!data) return null;

  const profile = data.profile;
  const computation = data.computation;
  const incomes = data.incomeRecords || [];
  const gains = data.capitalGains || [];
  const deductions = data.deductions || [];
  const formType = profile?.filingType === 'Business' ? 'Form H' : 'Form A';

  const totalIncome = incomes.reduce((s: number, r: any) => s + r.amount, 0);
  const totalGains = gains.reduce((s: number, r: any) => s + r.gain, 0);
  const totalDeductions = deductions.reduce((s: number, r: any) => s + r.amount, 0);

  return (
    <div className="print:m-0 print:shadow-none bg-white text-black" id="tax-return-document">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="text-center">
          <h1 className="text-xl font-bold uppercase tracking-wide">Federal Republic of Nigeria</h1>
          <p className="text-sm text-gray-600">Federal Inland Revenue Service (FIRS)</p>
          <h2 className="text-lg font-bold mt-2 uppercase">{formType} — Annual Tax Return</h2>
          <p className="text-sm mt-1">Tax Year: <strong>{data.taxYear}</strong></p>
        </div>
      </div>

      {/* Section 1: Taxpayer Information */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
          Section 1 — Taxpayer Information
        </h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm px-3">
          <FieldRow label="Tax Identification Number (TIN)" value={profile?.tin || '—'} />
          <FieldRow label="Filing Type" value={profile?.filingType || '—'} />
          <FieldRow label="State of Residence" value={profile?.stateOfResidence || '—'} />
          <FieldRow label="Residency Status" value={profile?.isResident ? 'Resident' : 'Non-Resident'} />
        </div>
      </section>

      {/* Section 2: Income */}
      <section className="mb-6">
        <h3 className="text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
          Section 2 — Income Declaration
        </h3>
        {incomes.length > 0 ? (
          <table className="w-full text-sm border-collapse">
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
        ) : (
          <p className="text-sm text-gray-500 px-3 italic">No income records declared.</p>
        )}
      </section>

      {/* Section 3: Capital Gains */}
      {gains.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
            Section 3 — Capital Gains
          </h3>
          <table className="w-full text-sm border-collapse">
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
        </section>
      )}

      {/* Section 4: Deductions */}
      {deductions.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
            Section {gains.length > 0 ? '4' : '3'} — Reliefs & Deductions
          </h3>
          <table className="w-full text-sm border-collapse">
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
        </section>
      )}

      {/* Section 5: Tax Computation Summary */}
      {computation && (
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase bg-gray-100 px-3 py-1.5 border border-gray-300 mb-3">
            Tax Computation Summary
          </h3>
          <div className="text-sm px-3 space-y-1.5">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Gross Income</span>
              <span className="font-mono font-semibold">{formatNaira(computation.totalIncome)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Less: Allowable Deductions</span>
              <span className="font-mono">{formatNaira(totalDeductions)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Taxable Income</span>
              <span className="font-mono font-semibold">{formatNaira(computation.taxableIncome)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-t-2 border-black font-bold text-base">
              <span>Tax Payable</span>
              <span className="font-mono">{formatNaira(computation.taxOwed)}</span>
            </div>
          </div>

          {/* Bracket breakdown */}
          {computation.breakdownJson?.brackets && (
            <div className="mt-4 px-3">
              <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Progressive Tax Breakdown</p>
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
          )}
        </section>
      )}

      {/* Footer */}
      <div className="border-t-2 border-black pt-4 mt-8 text-xs text-gray-500">
        <div className="flex justify-between">
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

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
