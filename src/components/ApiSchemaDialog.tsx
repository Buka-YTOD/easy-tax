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
    <div className="flex items-baseline gap-2 px-2 py-1 text-xs">
      {fieldNum !== undefined && (
        <span className="text-[10px] text-muted-foreground font-mono w-4 shrink-0">{fieldNum}.</span>
      )}
      <span className="text-muted-foreground shrink-0">{label}:</span>
      {missing || value === null || value === '' ? (
        <span className="text-destructive italic flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> Not collected
        </span>
      ) : (
        <span className="font-medium font-mono">{value}</span>
      )}
    </div>
  );
}

function MissingFieldsAlert({ fields }: { fields: SchemaMissingFields[] }) {
  if (fields.length === 0) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
      <div className="flex items-center gap-2 text-destructive text-xs font-semibold mb-1">
        <AlertTriangle className="h-3.5 w-3.5" /> {fields.length} Required Field{fields.length > 1 ? 's' : ''} Missing
      </div>
      <ul className="text-xs text-muted-foreground space-y-0.5 ml-5">
        {fields.map((f) => (
          <li key={f.field}>Field {String(f.formNumber)}: {f.description}</li>
        ))}
      </ul>
    </div>
  );
}

export function ApiSchemaDialog({ open, onOpenChange, summaryData }: Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { selectedTaxYear } = useAppContext();

  const result = useMemo(
    () => (summaryData ? mapToFormSchema(summaryData) : null),
    [summaryData]
  );

  if (!result) return null;

  const { variant, schema, missingFields } = result;
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
    a.download = `form-schema-${variant}-${selectedTaxYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const variantLabels: Record<string, string> = {
    lagos_non_artisan: 'Lagos — Non-Artisan (Abridged Form A)',
    lagos_artisan: 'Lagos — Artisan (Abridged Form A)',
    abuja_form_a: 'Abuja FCT-IRS — Form A (Comprehensive)',
  };

  // For Lagos variants, render the structured form view
  const isLagos = variant === 'lagos_non_artisan' || variant === 'lagos_artisan';
  const lagosSchema = isLagos ? (schema as any) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>API Request Schema</DialogTitle>
            <Badge variant="outline" className="text-[10px]">{variant}</Badge>
          </div>
          <DialogDescription>
            {variantLabels[variant] || variant}. Tax Year {selectedTaxYear}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {missingFields.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">{missingFields.length} missing fields</Badge>
            )}
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

        <Tabs defaultValue={isLagos ? 'visual' : 'json'} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            {isLagos && <TabsTrigger value="visual">Form View</TabsTrigger>}
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>

          {isLagos && lagosSchema && (
            <TabsContent value="visual" className="flex-1 min-h-0">
              <ScrollArea className="h-[50vh] rounded-lg border p-4">
                <MissingFieldsAlert fields={missingFields} />

                <SchemaSection title="Personal Particulars" num="A">
                  <SchemaField fieldNum={1} label="Full Name" value={lagosSchema.personalParticulars.field1_fullName} />
                  <SchemaField fieldNum={2} label="Title" value={lagosSchema.personalParticulars.field2_title} missing={!lagosSchema.personalParticulars.field2_title} />
                  <SchemaField fieldNum={3} label="Marital Status" value={lagosSchema.personalParticulars.field3_maritalStatus} />
                  <SchemaField fieldNum={4} label="Date of Birth" value={lagosSchema.personalParticulars.field4_dateOfBirth} />
                  <SchemaField fieldNum={5} label="Residential Address" value={lagosSchema.personalParticulars.field5_residentialAddress} />
                  <SchemaField fieldNum={6} label="Nationality" value={lagosSchema.personalParticulars.field6_nationality} />
                  <SchemaField fieldNum={7} label="Business/Employment Address" value={lagosSchema.personalParticulars.field7_businessOrEmploymentAddress} />
                  <SchemaField fieldNum={8} label="Occupation" value={lagosSchema.personalParticulars.field8_occupation} />
                  <SchemaField fieldNum={9} label="Residence as 1st Jan" value={lagosSchema.personalParticulars.field9_residenceAsAt1stJan} />
                </SchemaSection>

                <SchemaSection title="Spouse Information" num="B">
                  <SchemaField fieldNum={10} label="Spouse Name" value={lagosSchema.spouseInformation.field10_spouseName} />
                  <SchemaField fieldNum={11} label="Spouse DOB" value={lagosSchema.spouseInformation.field11_spouseDateOfBirth} missing={!lagosSchema.spouseInformation.field11_spouseDateOfBirth && lagosSchema.personalParticulars.field3_maritalStatus === 'MARRIED'} />
                  <SchemaField fieldNum={12} label="Spouse Occupation" value={lagosSchema.spouseInformation.field12_spouseOccupation} missing={!lagosSchema.spouseInformation.field12_spouseOccupation && lagosSchema.personalParticulars.field3_maritalStatus === 'MARRIED'} />
                  <SchemaField fieldNum={13} label="Spouse Business Address" value={lagosSchema.spouseInformation.field13_spouseBusinessAddress} missing={!lagosSchema.spouseInformation.field13_spouseBusinessAddress && lagosSchema.personalParticulars.field3_maritalStatus === 'MARRIED'} />
                </SchemaSection>

                <SchemaSection title="Children Information" num="C">
                  <SchemaField fieldNum={14} label="Number of Children" value={lagosSchema.childrenInformation.field14_numberOfChildren} />
                </SchemaSection>

                <SchemaSection title="Income & Tax (Previous Years)" num="D">
                  {lagosSchema.incomeAndTaxHistory.field15_yearData.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic px-2 py-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      Historical year data not yet collected
                    </div>
                  ) : (
                    lagosSchema.incomeAndTaxHistory.field15_yearData.map((y: any) => (
                      <div key={y.year} className="flex gap-4 px-2 py-1 text-xs">
                        <span className="font-mono">{y.year}</span>
                        <span>Income: ₦{y.income.toLocaleString()}</span>
                        <span>Tax: ₦{y.taxPaid.toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </SchemaSection>
              </ScrollArea>
            </TabsContent>
          )}

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
