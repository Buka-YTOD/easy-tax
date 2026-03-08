import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { mapToFormSchema, type SchemaMissingFields } from '@/lib/formSchemaMapper';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaryData: any;
}

function SchemaSection({ title, num, children }: { title: string; num?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-border">
        {num && (
          <span className="text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 rounded">{num}</span>
        )}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SchemaField({ label, value, fieldNum, missing }: { label: string; value: string | number | null; fieldNum?: number; missing?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 px-2 py-1 rounded text-sm hover:bg-muted/50">
      {fieldNum && (
        <span className="text-[10px] font-mono text-muted-foreground w-5 shrink-0">{fieldNum}.</span>
      )}
      <span className="text-muted-foreground text-xs min-w-[140px] shrink-0">{label}</span>
      {missing ? (
        <span className="text-destructive text-xs italic flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Not collected
        </span>
      ) : (
        <span className="font-mono text-xs font-medium text-foreground break-all">
          {value === null || value === '' ? <span className="text-muted-foreground/50">—</span> : String(value)}
        </span>
      )}
    </div>
  );
}

function MissingFieldsAlert({ fields }: { fields: SchemaMissingFields[] }) {
  if (fields.length === 0) return null;
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-sm font-semibold text-destructive">Missing Form Fields ({fields.length})</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        These fields are required by the LIRS form but not yet collected from the user. The API will leave them blank.
      </p>
      <ul className="space-y-1">
        {fields.map((f) => (
          <li key={f.field} className="text-xs flex items-center gap-2">
            <span className="font-mono text-muted-foreground">#{f.formNumber}</span>
            <span className="text-foreground">{f.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ApiSchemaDialog({ open, onOpenChange, summaryData }: Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { selectedTaxYear } = useAppContext();

  const { schema, missingFields } = useMemo(
    () => (summaryData ? mapToFormSchema(summaryData) : { variant: 'lagos_non_artisan' as const, schema: null, missingFields: [] }),
    [summaryData]
  );

  if (!schema) return null;

  const jsonString = JSON.stringify(schema, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lirs-form-a-schema-${selectedTaxYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pp = schema.personalParticulars;
  const sp = schema.spouseInformation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>LIRS Form A — API Request Schema</DialogTitle>
            <Badge variant="outline" className="text-[10px]">{schema.meta.state}</Badge>
          </div>
          <DialogDescription>
            Structured payload mapping to the official LIRS Form A (Non-Artisans). Tax Year {schema.meta.taxYear}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {missingFields.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{missingFields.length} missing fields</Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">{schema.meta.formType}</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download JSON
            </Button>
          </div>
        </div>

        <Tabs defaultValue="visual" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="visual">Form View</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="flex-1 min-h-0">
            <ScrollArea className="h-[50vh] rounded-lg border p-4">
              <MissingFieldsAlert fields={missingFields} />

              <SchemaSection title="Personal Particulars" num="A">
                <SchemaField fieldNum={1} label="Full Name" value={pp.field1_fullName} />
                <SchemaField fieldNum={2} label="Title" value={pp.field2_title} missing={!pp.field2_title} />
                <SchemaField fieldNum={3} label="Marital Status" value={pp.field3_maritalStatus} />
                <SchemaField fieldNum={4} label="Date of Birth" value={pp.field4_dateOfBirth} />
                <SchemaField fieldNum={5} label="Residential Address" value={pp.field5_residentialAddress} />
                <SchemaField fieldNum={6} label="Nationality" value={pp.field6_nationality} />
                <SchemaField fieldNum={7} label="Business/Employment Address" value={pp.field7_businessOrEmploymentAddress} />
                <SchemaField fieldNum={8} label="Occupation" value={pp.field8_occupation} />
                <SchemaField fieldNum={9} label="Residence as 1st Jan" value={pp.field9_residenceAsAt1stJan} />
              </SchemaSection>

              <SchemaSection title="Spouse Information" num="B">
                <SchemaField fieldNum={10} label="Spouse Name" value={sp.field10_spouseName} />
                <SchemaField fieldNum={11} label="Spouse Date of Birth" value={sp.field11_spouseDateOfBirth} missing={!sp.field11_spouseDateOfBirth && pp.field3_maritalStatus === 'MARRIED'} />
                <SchemaField fieldNum={12} label="Spouse Occupation" value={sp.field12_spouseOccupation} missing={!sp.field12_spouseOccupation && pp.field3_maritalStatus === 'MARRIED'} />
                <SchemaField fieldNum={13} label="Spouse Business Address" value={sp.field13_spouseBusinessAddress} missing={!sp.field13_spouseBusinessAddress && pp.field3_maritalStatus === 'MARRIED'} />
              </SchemaSection>

              <SchemaSection title="Children Information" num="C">
                <SchemaField fieldNum={14} label="Number of Children" value={schema.childrenInformation.field14_numberOfChildren} />
              </SchemaSection>

              <SchemaSection title="Income & Tax (Previous Years)" num="D">
                {schema.incomeAndTaxPreviousYears.field15_yearData.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic px-2 py-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    Historical year data not yet collected
                  </div>
                ) : (
                  schema.incomeAndTaxPreviousYears.field15_yearData.map((y) => (
                    <div key={y.year} className="flex gap-4 px-2 py-1 text-xs">
                      <span className="font-mono">{y.year}</span>
                      <span>Income: ₦{y.income.toLocaleString()}</span>
                      <span>Tax: ₦{y.taxPaid.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </SchemaSection>

              <SchemaSection title="Computed Tax Data" num="E">
                <SchemaField label="Total Income" value={`₦${schema.computedData.totalIncome.toLocaleString()}`} />
                <SchemaField label="Taxable Income" value={`₦${schema.computedData.taxableIncome.toLocaleString()}`} />
                <SchemaField label="Tax Owed" value={`₦${schema.computedData.taxOwed.toLocaleString()}`} />
                <SchemaField label="Monthly PAYE" value={`₦${schema.computedData.monthlyPAYE.toLocaleString()}`} />
                {schema.computedData.cra && (
                  <>
                    <SchemaField label="CRA (Statutory)" value={`₦${schema.computedData.cra.statutory.toLocaleString()}`} />
                    <SchemaField label="CRA (20%)" value={`₦${schema.computedData.cra.twentyPercent.toLocaleString()}`} />
                    <SchemaField label="CRA (Total)" value={`₦${schema.computedData.cra.total.toLocaleString()}`} />
                  </>
                )}
              </SchemaSection>

              <SchemaSection title="Income Breakdown" num="F">
                {schema.computedData.incomeBreakdown.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic px-2">No income records</div>
                ) : (
                  schema.computedData.incomeBreakdown.map((inc, i) => (
                    <div key={i} className="flex items-baseline gap-3 px-2 py-1 text-xs">
                      <Badge variant="outline" className="text-[10px] shrink-0">{inc.type}</Badge>
                      <span className="font-mono">₦{inc.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">{inc.frequency}</span>
                    </div>
                  ))
                )}
              </SchemaSection>

              {schema.supportingData.benefitsInKind.length > 0 && (
                <SchemaSection title="Benefits in Kind" num="G">
                  {schema.supportingData.benefitsInKind.map((b, i) => (
                    <div key={i} className="flex items-baseline gap-3 px-2 py-1 text-xs">
                      <Badge variant="outline" className="text-[10px] shrink-0">{b.category}</Badge>
                      <span className="font-mono">₦{b.annualValue.toLocaleString()}</span>
                    </div>
                  ))}
                </SchemaSection>
              )}

              {schema.supportingData.capitalGains.length > 0 && (
                <SchemaSection title="Capital Gains" num="H">
                  {schema.supportingData.capitalGains.map((g, i) => (
                    <div key={i} className="flex items-baseline gap-3 px-2 py-1 text-xs">
                      <Badge variant="outline" className="text-[10px] shrink-0">{g.assetType}</Badge>
                      <span className="font-mono">Gain: ₦{g.gain.toLocaleString()}</span>
                    </div>
                  ))}
                </SchemaSection>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="json" className="flex-1 min-h-0">
            <ScrollArea className="h-[50vh] rounded-lg border bg-muted p-4">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                {jsonString}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
