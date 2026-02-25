import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Phone, MapPin, ClipboardList, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const filingSteps = [
  { step: 1, title: 'Review your tax return document', description: 'Ensure all income, deductions, and capital gains are correctly captured above.' },
  { step: 2, title: 'Create an account on the FIRS e-filing portal', description: 'Visit taxpromax.firs.gov.ng to register or log in with your TIN.' },
  { step: 3, title: 'Select the correct form', description: 'Choose Form A (individuals) or Form H (businesses) matching your filing type.' },
  { step: 4, title: 'Enter your information', description: 'Transfer the figures from your generated document into the portal fields.' },
  { step: 5, title: 'Upload supporting documents', description: 'Attach receipts, payslips, and proof of deductions from your Document Vault.' },
  { step: 6, title: 'Submit and obtain acknowledgment', description: 'Submit your return and download the e-filing acknowledgment receipt for your records.' },
];

const taxOffices = [
  { name: 'FIRS Headquarters', address: '15 Sokode Crescent, Wuse Zone 5, Abuja', phone: '09-4617020', region: 'FCT' },
  { name: 'Lagos Integrated Tax Office', address: 'Block C, Motorways Centre, Alausa, Ikeja, Lagos', phone: '01-4617070', region: 'South-West' },
  { name: 'Port Harcourt Tax Office', address: '3 Harley Street, Old GRA, Port Harcourt', phone: '084-237812', region: 'South-South' },
  { name: 'Kano Integrated Tax Office', address: 'Audu Bako Way, Nassarawa GRA, Kano', phone: '064-631246', region: 'North-West' },
  { name: 'Enugu Tax Office', address: '2 Okpara Avenue, Enugu', phone: '042-253117', region: 'South-East' },
];

export function FilingInstructions() {
  return (
    <div className="space-y-6 print:hidden">
      {/* Step-by-step filing guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            How to File Your Tax Return
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {filingSteps.map((s) => (
              <li key={s.step} className="flex gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {s.step}
                </span>
                <div>
                  <p className="font-medium leading-tight">{s.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6">
            <Button asChild variant="outline">
              <a href="https://taxpromax.firs.gov.ng" target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4 mr-2" />
                Open FIRS TaxProMax Portal
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tax offices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            FIRS Tax Offices
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visit any of these offices to file in person or get assistance.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {taxOffices.map((o) => (
              <div key={o.name} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{o.name}</p>
                  <Badge variant="secondary" className="text-xs">{o.region}</Badge>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>{o.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{o.phone}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            For a complete list of tax offices nationwide, visit the FIRS website at firs.gov.ng.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
