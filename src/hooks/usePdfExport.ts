import { useCallback, useState } from 'react';

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = useCallback(async (element: HTMLElement, filename: string) => {
    setIsExporting(true);
    // Inject pdf-exporting class so CSS rules activate
    element.classList.add('pdf-exporting');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [12, 10, 12, 10],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'], avoid: ['tr', '.pdf-keep-together'] },
        })
        .from(element)
        .save();
    } finally {
      element.classList.remove('pdf-exporting');
      setIsExporting(false);
    }
  }, []);

  return { exportToPdf, isExporting };
}
