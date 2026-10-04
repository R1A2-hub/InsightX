import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  CanonicalColumn,
  CleaningAction,
  ColumnMapping,
  DataQualityReport,
} from '../schemas/analytics';

export interface NormalizedRow {
  Date: string | null;
  Month: string | null; // YYYY-MM
  Product: string;
  Category: string;
  Region: string;
  Quantity: number | null;
  Selling_Price: number | null;
  Revenue: number | null;
  Cost: number | null;
  Profit: number | null;
  raw: Record<string, string | number | boolean | null>;
}

export interface ProcessedDataset {
  rows: NormalizedRow[];
  quality: DataQualityReport;
  currencySymbol: string;
}

const COLUMN_ALIASES: Record<CanonicalColumn, string[]> = {
  Quantity: ['quantity', 'qty', 'units', 'units_sold', 'order_qty', 'item_qty', 'total_quantity', 'volume'],
  Selling_Price: ['selling_price', 'price', 'unit_price', 'rate', 'mrp', 'sale_price', 'sellingprice', 'unitprice'],
  Revenue: ['revenue', 'sales', 'total_sales', 'gross_sales', 'amount', 'turnover', 'totalsales', 'net_sales', 'sales_amount'],
  Cost: ['cost', 'total_cost', 'expense', 'cogs', 'cost_price', 'total_expense', 'totalcost', 'expenses'],
  Product: ['product', 'product_name', 'item', 'item_name', 'sku', 'product_title', 'productname', 'itemname'],
  Category: ['category', 'product_category', 'cat', 'department', 'item_category', 'productcategory', 'sub_category'],
  Region: ['region', 'area', 'zone', 'territory', 'state', 'location', 'branch', 'city_zone'],
  Date: ['date', 'order_date', 'sale_date', 'transaction_date', 'invoice_date', 'orderdate', 'saledate', 'billing_date'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export class DatasetValidationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'DatasetValidationError';
    this.statusCode = statusCode;
  }
}

export function normalizeColumnHeader(header: string): CanonicalColumn | null {
  const cleaned = header
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES) as [CanonicalColumn, string[]][]) {
    if (aliases.includes(cleaned)) {
      return canonical;
    }
  }
  return null;
}

export function parseRawFileBuffer(
  buffer: Buffer,
  filename: string
): Record<string, unknown>[] {
  if (!filename) {
    throw new DatasetValidationError('Filename is missing.');
  }

  const lower = filename.toLowerCase().trim();
  if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx')) {
    throw new DatasetValidationError(
      `Unsupported file extension in "${filename}". Please upload a valid .csv or .xlsx file.`
    );
  }

  if (!buffer || buffer.length === 0) {
    throw new DatasetValidationError('The uploaded file is empty (0 bytes).');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new DatasetValidationError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB maximum limit.`
    );
  }

  try {
    if (lower.endsWith('.csv')) {
      const text = buffer.toString('utf-8').trim();
      if (!text) {
        throw new DatasetValidationError('The uploaded CSV file contains no content.');
      }
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
      });

      if (parsed.errors && parsed.errors.length > 0 && (!parsed.data || parsed.data.length === 0)) {
        throw new DatasetValidationError(`Unreadable CSV file: ${parsed.errors[0].message}`);
      }

      if (!parsed.data || parsed.data.length === 0) {
        throw new DatasetValidationError('The uploaded CSV file has headers but 0 data rows.');
      }
      return parsed.data;
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new DatasetValidationError('The uploaded Excel workbook contains no sheets.');
      }
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: null,
        raw: false,
      });
      if (!jsonData || jsonData.length === 0) {
        throw new DatasetValidationError('The uploaded Excel sheet contains no rows.');
      }
      return jsonData;
    }
  } catch (err) {
    if (err instanceof DatasetValidationError) {
      throw err;
    }
    throw new DatasetValidationError(
      `Unreadable or corrupted file "${filename}": ${err instanceof Error ? err.message : 'Unknown parse error'}`
    );
  }
}

function parseNumericSafe(val: unknown): { value: number | null; wasInvalid: boolean; wasMissing: boolean; detectedCurrency?: string } {
  if (val === null || val === undefined) {
    return { value: null, wasInvalid: false, wasMissing: true };
  }
  if (typeof val === 'number') {
    if (Number.isFinite(val)) {
      return { value: val, wasInvalid: false, wasMissing: false };
    }
    return { value: null, wasInvalid: true, wasMissing: false };
  }
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a' || str === '-') {
    return { value: null, wasInvalid: false, wasMissing: true };
  }

  let detectedCurrency: string | undefined;
  if (str.includes('₹') || str.toLowerCase().includes('inr') || str.toLowerCase().includes('rs')) {
    detectedCurrency = '₹';
  } else if (str.includes('$')) {
    detectedCurrency = '$';
  }

  const cleaned = str.replace(/[₹$€£,\s]/g, '').replace(/^(rs\.?|inr)/i, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num) || cleaned === '') {
    return { value: null, wasInvalid: true, wasMissing: false, detectedCurrency };
  }
  return { value: num, wasInvalid: false, wasMissing: false, detectedCurrency };
}

function parseDateSafe(val: unknown): { isoDate: string | null; month: string | null; wasInvalid: boolean; wasMissing: boolean } {
  if (val === null || val === undefined) {
    return { isoDate: null, month: null, wasInvalid: false, wasMissing: true };
  }
  if (val instanceof Date) {
    if (isNaN(val.getTime())) {
      return { isoDate: null, month: null, wasInvalid: true, wasMissing: false };
    }
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return { isoDate: `${y}-${m}-${d}`, month: `${y}-${m}`, wasInvalid: false, wasMissing: false };
  }

  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a') {
    return { isoDate: null, month: null, wasInvalid: false, wasMissing: true };
  }

  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const first = parseInt(dmyMatch[1], 10);
    const second = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const day = first > 12 ? first : second > 12 ? second : first;
    const monthNum = first > 12 ? second : second > 12 ? first : second;
    if (monthNum >= 1 && monthNum <= 12 && day >= 1 && day <= 31) {
      const m = String(monthNum).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      return { isoDate: `${year}-${m}-${d}`, month: `${year}-${m}`, wasInvalid: false, wasMissing: false };
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1990 && parsed.getFullYear() <= 2100) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return { isoDate: `${y}-${m}-${d}`, month: `${y}-${m}`, wasInvalid: false, wasMissing: false };
  }

  return { isoDate: null, month: null, wasInvalid: true, wasMissing: false };
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function processAndCleanDataset(
  rawRows: Record<string, unknown>[],
  filename: string,
  fileSizeBytes = 0
): ProcessedDataset {
  if (!rawRows || rawRows.length === 0) {
    throw new DatasetValidationError('Dataset contains 0 rows.');
  }

  const rawHeaders = Object.keys(rawRows[0] || {}).filter((h) => h.trim() !== '');
  if (rawHeaders.length === 0) {
    throw new DatasetValidationError('No column headers detected in the uploaded file.');
  }

  const headerToCanonical: Record<string, CanonicalColumn | null> = {};
  const canonicalToHeader: Partial<Record<CanonicalColumn, string>> = {};

  for (const header of rawHeaders) {
    const canonical = normalizeColumnHeader(header);
    if (canonical && !canonicalToHeader[canonical]) {
      headerToCanonical[header] = canonical;
      canonicalToHeader[canonical] = header;
    } else {
      headerToCanonical[header] = null;
    }
  }

  const hasRevenueCol = Boolean(canonicalToHeader.Revenue);
  const hasQtyAndPrice = Boolean(canonicalToHeader.Quantity && canonicalToHeader.Selling_Price);

  if (!hasRevenueCol && !hasQtyAndPrice) {
    throw new DatasetValidationError(
      `Missing usable financial columns. Detected columns: [${rawHeaders.join(', ')}]. Please include either a Revenue/Sales column or both Quantity and Selling_Price columns.`
    );
  }

  const cleaningActions: CleaningAction[] = [];
  const missingValuesByColumn: Record<string, number> = {};
  for (const h of rawHeaders) {
    missingValuesByColumn[h] = 0;
  }

  // Deduplicate
  const seenSignatures = new Set<string>();
  const dedupedRawRows: Record<string, unknown>[] = [];
  let duplicateRowsRemoved = 0;

  for (const row of rawRows) {
    const sig = rawHeaders.map((h) => String(row[h] ?? '').trim()).join('||');
    if (seenSignatures.has(sig)) {
      duplicateRowsRemoved++;
    } else {
      seenSignatures.add(sig);
      dedupedRawRows.push(row);
    }
  }

  if (duplicateRowsRemoved > 0) {
    cleaningActions.push({
      step: 'Deduplication',
      description: `Removed ${duplicateRowsRemoved} exact duplicate row(s).`,
      affectedRows: duplicateRowsRemoved,
    });
  }

  let invalidDatesCount = 0;
  let invalidNumericCount = 0;
  let unknownCategoriesCount = 0;
  let detectedCurrency = '₹';

  const numericCanonicalCols: CanonicalColumn[] = ['Quantity', 'Selling_Price', 'Revenue', 'Cost'];
  const validNumericPools: Record<CanonicalColumn, number[]> = {
    Quantity: [],
    Selling_Price: [],
    Revenue: [],
    Cost: [],
    Product: [],
    Category: [],
    Region: [],
    Date: [],
  };

  for (const row of dedupedRawRows) {
    for (const h of rawHeaders) {
      const val = row[h];
      if (val === null || val === undefined || String(val).trim() === '') {
        missingValuesByColumn[h] = (missingValuesByColumn[h] || 0) + 1;
      }
    }

    for (const numCol of numericCanonicalCols) {
      const h = canonicalToHeader[numCol];
      if (h) {
        const parsed = parseNumericSafe(row[h]);
        if (parsed.detectedCurrency) {
          detectedCurrency = parsed.detectedCurrency;
        }
        if (parsed.value !== null) {
          validNumericPools[numCol].push(parsed.value);
        }
      }
    }
  }

  const medians: Partial<Record<CanonicalColumn, number>> = {};
  for (const numCol of numericCanonicalCols) {
    if (canonicalToHeader[numCol] && validNumericPools[numCol].length > 0) {
      medians[numCol] = calculateMedian(validNumericPools[numCol]);
    }
  }

  const imputedNumericCounts: Partial<Record<CanonicalColumn, number>> = {};
  const categoricalUnknownCounts: Partial<Record<CanonicalColumn, number>> = {};
  let booleanNormalizedCount = 0;

  const normalizedRows: NormalizedRow[] = [];
  const validDates: string[] = [];

  for (const row of dedupedRawRows) {
    const cleanedRaw: Record<string, string | number | boolean | null> = {};

    for (const h of rawHeaders) {
      const rawVal = row[h];
      if (typeof rawVal === 'string') {
        const lowerVal = rawVal.trim().toLowerCase();
        if (['true', 'false', 'yes', 'no'].includes(lowerVal)) {
          cleanedRaw[h] = lowerVal === 'true' || lowerVal === 'yes';
          booleanNormalizedCount++;
        } else {
          cleanedRaw[h] = rawVal.trim();
        }
      } else if (typeof rawVal === 'number' || typeof rawVal === 'boolean') {
        cleanedRaw[h] = rawVal;
      } else {
        cleanedRaw[h] = null;
      }
    }

    let isoDate: string | null = null;
    let month: string | null = null;
    if (canonicalToHeader.Date) {
      const dRes = parseDateSafe(row[canonicalToHeader.Date]);
      if (dRes.wasInvalid) invalidDatesCount++;
      isoDate = dRes.isoDate;
      month = dRes.month;
      if (isoDate) validDates.push(isoDate);
    }

    const getCatValue = (col: 'Product' | 'Category' | 'Region'): string => {
      const h = canonicalToHeader[col];
      if (!h) return 'Unknown';
      const v = row[h];
      const s = v === null || v === undefined ? '' : String(v).trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a') {
        unknownCategoriesCount++;
        categoricalUnknownCounts[col] = (categoricalUnknownCounts[col] || 0) + 1;
        return 'Unknown';
      }
      return s;
    };

    const product = getCatValue('Product');
    const category = getCatValue('Category');
    const region = getCatValue('Region');

    const getNumValue = (col: 'Quantity' | 'Selling_Price' | 'Revenue' | 'Cost'): number | null => {
      const h = canonicalToHeader[col];
      if (!h) return null;
      const nRes = parseNumericSafe(row[h]);
      if (nRes.wasInvalid) {
        invalidNumericCount++;
      }
      if (nRes.value === null) {
        const med = medians[col] ?? 0;
        imputedNumericCounts[col] = (imputedNumericCounts[col] || 0) + 1;
        return med;
      }
      return nRes.value;
    };

    const quantity = getNumValue('Quantity');
    const sellingPrice = getNumValue('Selling_Price');
    let revenue = getNumValue('Revenue');
    const cost = getNumValue('Cost');

    if (revenue === null && quantity !== null && sellingPrice !== null) {
      revenue = Number((quantity * sellingPrice).toFixed(2));
    }

    let profit: number | null = null;
    if (cost !== null && revenue !== null) {
      profit = Number((revenue - cost).toFixed(2));
    }

    normalizedRows.push({
      Date: isoDate,
      Month: month,
      Product: product,
      Category: category,
      Region: region,
      Quantity: quantity,
      Selling_Price: sellingPrice,
      Revenue: revenue,
      Cost: cost,
      Profit: profit,
      raw: cleanedRaw,
    });
  }

  for (const [col, count] of Object.entries(imputedNumericCounts)) {
    if (count && count > 0) {
      const medVal = medians[col as CanonicalColumn] ?? 0;
      cleaningActions.push({
        step: 'Median Imputation',
        column: col,
        description: `Filled ${count} missing/invalid value(s) in ${col} with column median (${medVal.toLocaleString()}).`,
        affectedRows: count,
      });
    }
  }

  for (const [col, count] of Object.entries(categoricalUnknownCounts)) {
    if (count && count > 0) {
      cleaningActions.push({
        step: 'Categorical Normalization',
        column: col,
        description: `Replaced ${count} missing value(s) in ${col} with "Unknown".`,
        affectedRows: count,
      });
    }
  }

  if (invalidDatesCount > 0) {
    cleaningActions.push({
      step: 'Date Normalization',
      column: 'Date',
      description: `Detected and isolated ${invalidDatesCount} invalid date format(s) while normalizing dates to ISO YYYY-MM-DD.`,
      affectedRows: invalidDatesCount,
    });
  }

  if (booleanNormalizedCount > 0) {
    cleaningActions.push({
      step: 'Boolean Normalization',
      description: `Normalized ${booleanNormalizedCount} boolean value(s) to standard true/false.`,
      affectedRows: booleanNormalizedCount,
    });
  }

  if (!hasRevenueCol && hasQtyAndPrice) {
    cleaningActions.push({
      step: 'Derived Revenue Calculation',
      column: 'Revenue',
      description: `Calculated Revenue = Quantity × Selling_Price for all ${normalizedRows.length} rows.`,
      affectedRows: normalizedRows.length,
    });
  }

  if (canonicalToHeader.Cost) {
    cleaningActions.push({
      step: 'Derived Profit Calculation',
      column: 'Profit',
      description: `Calculated Profit = Revenue − Cost and Profit Margin % for ${normalizedRows.length} rows.`,
      affectedRows: normalizedRows.length,
    });
  }

  if (cleaningActions.length === 0) {
    cleaningActions.push({
      step: 'Schema Verification',
      description: 'All rows passed schema validation with zero missing values or duplicates.',
      affectedRows: 0,
    });
  }

  validDates.sort();
  const minDate = validDates.length > 0 ? validDates[0] : null;
  const maxDate = validDates.length > 0 ? validDates[validDates.length - 1] : null;
  const uniqueMonths = new Set(normalizedRows.map((r) => r.Month).filter(Boolean));

  const columnMappings: ColumnMapping[] = rawHeaders.map((h) => {
    const canonical = headerToCanonical[h];
    let dataType: ColumnMapping['dataType'] = 'categorical';
    if (canonical && ['Quantity', 'Selling_Price', 'Revenue', 'Cost'].includes(canonical)) {
      dataType = 'numeric';
    } else if (canonical === 'Date') {
      dataType = 'date';
    }

    const sampleValues = dedupedRawRows
      .slice(0, 3)
      .map((r) => (r[h] !== null && r[h] !== undefined ? String(r[h]) : ''))
      .filter(Boolean);

    return {
      originalName: h,
      canonicalName: canonical,
      dataType,
      missingCount: missingValuesByColumn[h] || 0,
      invalidCount: 0,
      sampleValues,
      usedForAnalytics: Boolean(canonical),
    };
  });

  const canonicalColumnsPresent = Object.keys(canonicalToHeader) as CanonicalColumn[];
  const columnsUsedForAnalytics: string[] = [...canonicalColumnsPresent];
  if (!columnsUsedForAnalytics.includes('Revenue') && hasQtyAndPrice) {
    columnsUsedForAnalytics.push('Revenue (Derived)');
  }
  if (canonicalToHeader.Cost) {
    columnsUsedForAnalytics.push('Profit (Derived)');
  }

  const totalMissingValues = Object.values(missingValuesByColumn).reduce((a, b) => a + b, 0);

  const hasCost = Boolean(canonicalToHeader.Cost);
  const hasQuantity = Boolean(canonicalToHeader.Quantity);
  const monthCount = uniqueMonths.size;

  const capabilities: DataQualityReport['capabilities'] = {
    revenue: {
      status: hasRevenueCol ? 'Directly Available' : 'Derived',
      note: hasRevenueCol
        ? `Mapped from "${canonicalToHeader.Revenue}" column`
        : 'Derived via Quantity × Selling_Price',
    },
    profit: {
      status: hasCost ? 'Derived' : 'Unavailable',
      note: hasCost
        ? 'Derived via Revenue − Cost'
        : 'Profit unavailable because Cost data is missing.',
    },
    profitMargin: {
      status: hasCost ? 'Derived' : 'Unavailable',
      note: hasCost
        ? 'Derived via (Profit / Revenue) × 100'
        : 'Profit unavailable because Cost data is missing.',
    },
    cost: {
      status: hasCost ? 'Directly Available' : 'Unavailable',
      note: hasCost
        ? `Mapped from "${canonicalToHeader.Cost}" column`
        : 'Cost column not present in dataset',
    },
    quantity: {
      status: hasQuantity ? 'Directly Available' : 'Unavailable',
      note: hasQuantity
        ? `Mapped from "${canonicalToHeader.Quantity}" column`
        : 'Quantity column not present in dataset',
    },
    growth: {
      status: monthCount >= 2 ? 'Derived' : 'Unavailable',
      note:
        monthCount >= 2
          ? 'Derived from month-over-month Revenue change'
          : 'Requires at least 2 distinct months of data',
    },
    forecast: {
      status: monthCount >= 3 ? 'Derived' : 'Unavailable',
      note:
        monthCount >= 3
          ? `Predictive trend based on ${monthCount} monthly observations`
          : `Requires minimum 3 monthly observations (found ${monthCount})`,
    },
  };

  return {
    rows: normalizedRows,
    currencySymbol: detectedCurrency,
    quality: {
      filename,
      uploadedAt: new Date().toISOString(),
      fileSizeBytes,
      rawRowCount: rawRows.length,
      cleanedRowCount: normalizedRows.length,
      columnCount: rawHeaders.length,
      detectedColumns: rawHeaders,
      canonicalColumnsPresent,
      columnsUsedForAnalytics,
      columnMappings,
      missingValuesByColumn,
      totalMissingValues,
      duplicateRowsRemoved,
      invalidDatesCount,
      invalidNumericCount,
      unknownCategoriesCount,
      dateRange: {
        minDate,
        maxDate,
        totalMonths: monthCount,
      },
      cleaningActions,
      capabilities,
    },
  };
}
