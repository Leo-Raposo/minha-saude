import { ParsedPdfResult } from '../types/health';

/**
 * Structured mock PDF parser service.
 * Designed to be swapped with a real backend OCR / LLM / pdf.js extractor
 * without changing any UI component.
 */
export const pdfParserService = {
  async parseBloodTestPdf(
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<ParsedPdfResult> {
    // Simulate realistic staged reading progress
    const steps = [18, 36, 58, 76, 92, 100];
    for (const pct of steps) {
      await new Promise((resolve) => setTimeout(resolve, 160));
      onProgress?.(pct);
    }

    const lower = file.name.toLowerCase();
    const detectedLab = lower.includes('sabin')
      ? 'Sabin Diagnóstico'
      : lower.includes('dasa') || lower.includes('exame')
        ? 'Exame / DASA'
        : 'Laboratório Clínico';

    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const detectedDate = `${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}`;

    return {
      fileName: file.name,
      detectedLab,
      detectedDate,
      isoDate,
      markers: [
        {
          id: 'draft-hdl',
          biomarkerId: 'hdl',
          name: 'Colesterol HDL',
          category: 'Lipídios',
          value: 42,
          unit: 'mg/dL',
          lo: 40,
          hi: 90,
          min: 20,
          max: 100,
          selected: true,
        },
        {
          id: 'draft-ldl',
          biomarkerId: 'ldl',
          name: 'Colesterol LDL',
          category: 'Lipídios',
          value: 70,
          unit: 'mg/dL',
          lo: 40,
          hi: 100,
          min: 20,
          max: 160,
          selected: true,
        },
        {
          id: 'draft-glicose',
          biomarkerId: 'glicose',
          name: 'Glicose em Jejum',
          category: 'Metabólico',
          value: 84,
          unit: 'mg/dL',
          lo: 70,
          hi: 99,
          min: 55,
          max: 130,
          selected: true,
        },
        {
          id: 'draft-hba1c',
          biomarkerId: 'hba1c',
          name: 'Hemoglobina Glicada (HbA1c)',
          category: 'Metabólico',
          value: 5.5,
          unit: '%',
          lo: 4.0,
          hi: 5.6,
          min: 3.8,
          max: 7.0,
          selected: true,
        },
        {
          id: 'draft-vitd',
          biomarkerId: 'vitd',
          name: 'Vitamina D (25-OH)',
          category: 'Vitaminas',
          value: 38,
          unit: 'ng/mL',
          lo: 30,
          hi: 60,
          min: 10,
          max: 90,
          selected: true,
        },
        {
          id: 'draft-egfr',
          biomarkerId: 'egfr',
          name: 'Taxa de Filtração Glomerular (eGFR)',
          category: 'Renal e Hepático',
          value: 91,
          unit: 'mL/min/1,73m²',
          lo: 90,
          hi: 130,
          min: 45,
          max: 135,
          selected: true,
        },
      ],
    };
  },
};
