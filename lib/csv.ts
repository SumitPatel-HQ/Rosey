import Papa from "papaparse";

export interface CsvLeadRow {
  name: string;
  email: string;
  company?: string;
  industry?: string;
  tags?: string;
}

export function parseCsv(csvText: string): CsvLeadRow[] {
  const result = Papa.parse<CsvLeadRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter((e) => e.type !== "FieldMismatch");
    if (criticalErrors.length > 0) {
      throw new Error(`CSV parsing error: ${criticalErrors[0].message}`);
    }
  }

  return result.data.filter((row) => row.name && row.email);
}
