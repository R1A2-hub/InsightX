export interface SampleDatasetPreset {
  id: string;
  name: string;
  filename: string;
  description: string;
  rows: Record<string, unknown>[];
}

export function getSampleDatasets(): SampleDatasetPreset[] {
  const fullSalesRows: Record<string, unknown>[] = [
    // Jan 2025
    { order_date: '2025-01-05', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 14, unit_price: 58000, total_sales: 812000, total_cost: 616000 },
    { order_date: '2025-01-11', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'South', qty: 85, unit_price: 1200, total_sales: 102000, total_cost: 59500 },
    { order_date: '2025-01-16', product_name: '4K Monitor', product_category: 'Electronics', region: 'West', qty: 18, unit_price: 24500, total_sales: 441000, total_cost: 333000 },
    { order_date: '2025-01-22', product_name: 'Ergonomic Chair', product_category: 'Furniture', region: 'East', qty: 20, unit_price: 14000, total_sales: 280000, total_cost: 196000 },
    { order_date: '2025-01-27', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'North', qty: 45, unit_price: 3800, total_sales: 171000, total_cost: 108000 },

    // Feb 2025
    { order_date: '2025-02-04', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 16, unit_price: 58000, total_sales: 928000, total_cost: 704000 },
    { order_date: '2025-02-09', product_name: 'Standing Desk', product_category: 'Furniture', region: 'South', qty: 15, unit_price: 26000, total_sales: 390000, total_cost: 277500 },
    { order_date: '2025-02-14', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'West', qty: 95, unit_price: 1200, total_sales: 114000, total_cost: 66500 },
    { order_date: '2025-02-19', product_name: '4K Monitor', product_category: 'Electronics', region: 'North', qty: 19, unit_price: 24500, total_sales: 465500, total_cost: 351500 },
    { order_date: '2025-02-25', product_name: 'USB-C Hub', product_category: 'Accessories', region: 'East', qty: 60, unit_price: 2200, total_sales: 132000, total_cost: 78000 },

    // Mar 2025
    { order_date: '2025-03-03', product_name: 'Laptop', product_category: 'Electronics', region: 'South', qty: 17, unit_price: 58000, total_sales: 986000, total_cost: 748000 },
    { order_date: '2025-03-08', product_name: '4K Monitor', product_category: 'Electronics', region: 'North', qty: 22, unit_price: 24500, total_sales: 539000, total_cost: 407000 },
    { order_date: '2025-03-15', product_name: 'Ergonomic Chair', product_category: 'Furniture', region: 'West', qty: 24, unit_price: 14000, total_sales: 336000, total_cost: 235200 },
    { order_date: '2025-03-21', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'North', qty: 52, unit_price: 3800, total_sales: 197600, total_cost: 124800 },
    { order_date: '2025-03-28', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'East', qty: 75, unit_price: 1200, total_sales: 90000, total_cost: 52500 },

    // Apr 2025
    { order_date: '2025-04-04', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 19, unit_price: 58000, total_sales: 1102000, total_cost: 836000 },
    { order_date: '2025-04-10', product_name: 'Standing Desk', product_category: 'Furniture', region: 'North', qty: 18, unit_price: 26000, total_sales: 468000, total_cost: 333000 },
    { order_date: '2025-04-16', product_name: '4K Monitor', product_category: 'Electronics', region: 'South', qty: 20, unit_price: 24500, total_sales: 490000, total_cost: 370000 },
    { order_date: '2025-04-22', product_name: 'USB-C Hub', product_category: 'Accessories', region: 'West', qty: 80, unit_price: 2200, total_sales: 176000, total_cost: 104000 },
    { order_date: '2025-04-27', product_name: 'Wireless Mouse', product_category: '', region: 'South', qty: 70, unit_price: 1200, total_sales: 84000, total_cost: 49000 },

    // May 2025
    { order_date: '2025-05-05', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 21, unit_price: 58000, total_sales: 1218000, total_cost: 924000 },
    { order_date: '2025-05-11', product_name: '4K Monitor', product_category: 'Electronics', region: 'West', qty: 23, unit_price: 24500, total_sales: 563500, total_cost: 425500 },
    { order_date: '2025-05-17', product_name: 'Ergonomic Chair', product_category: 'Furniture', region: 'South', qty: 25, unit_price: 14000, total_sales: 350000, total_cost: 245000 },
    { order_date: '2025-05-23', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'East', qty: 60, unit_price: 3800, total_sales: 228000, total_cost: 144000 },
    { order_date: '2025-05-29', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'North', qty: 90, unit_price: 1200, total_sales: 108000, total_cost: 63000 },

    // Jun 2025
    { order_date: '2025-06-03', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 22, unit_price: 58000, total_sales: 1276000, total_cost: 968000 },
    { order_date: '2025-06-09', product_name: 'Standing Desk', product_category: 'Furniture', region: 'West', qty: 20, unit_price: 26000, total_sales: 520000, total_cost: 370000 },
    { order_date: '2025-06-14', product_name: '4K Monitor', product_category: 'Electronics', region: 'South', qty: 22, unit_price: 24500, total_sales: 539000, total_cost: 407000 },
    { order_date: '2025-06-20', product_name: 'USB-C Hub', product_category: 'Accessories', region: 'North', qty: 85, unit_price: 2200, total_sales: 187000, total_cost: 110500 },
    { order_date: '2025-06-26', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'East', qty: null, unit_price: 1200, total_sales: 96000, total_cost: 56000 },

    // Jul 2025
    { order_date: '2025-07-04', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 23, unit_price: 58000, total_sales: 1334000, total_cost: 1012000 },
    { order_date: '2025-07-10', product_name: '4K Monitor', product_category: 'Electronics', region: 'North', qty: 25, unit_price: 24500, total_sales: 612500, total_cost: 462500 },
    { order_date: '2025-07-15', product_name: 'Ergonomic Chair', product_category: 'Furniture', region: 'South', qty: 28, unit_price: 14000, total_sales: 392000, total_cost: 274400 },
    { order_date: '2025-07-21', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'West', qty: 65, unit_price: 3800, total_sales: 247000, total_cost: 156000 },
    { order_date: '2025-07-28', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'South', qty: 105, unit_price: 1200, total_sales: 126000, total_cost: 73500 },
    // Exact duplicate row to demonstrate deduplication
    { order_date: '2025-07-28', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'South', qty: 105, unit_price: 1200, total_sales: 126000, total_cost: 73500 },

    // Aug 2025 (Enterprise bulk spike in North for IQR anomaly detection)
    { order_date: '2025-08-05', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 58, unit_price: 58000, total_sales: 3364000, total_cost: 2494000 },
    { order_date: '2025-08-12', product_name: '4K Monitor', product_category: 'Electronics', region: 'North', qty: 42, unit_price: 24500, total_sales: 1029000, total_cost: 777000 },
    { order_date: '2025-08-18', product_name: 'Standing Desk', product_category: 'Furniture', region: 'South', qty: 24, unit_price: 26000, total_sales: 624000, total_cost: 444000 },
    { order_date: '2025-08-22', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'West', qty: 75, unit_price: 3800, total_sales: 285000, total_cost: 180000 },
    { order_date: '2025-08-27', product_name: 'USB-C Hub', product_category: 'Accessories', region: 'East', qty: 90, unit_price: 2200, total_sales: 198000, total_cost: 117000 },

    // Sep 2025
    { order_date: '2025-09-04', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 25, unit_price: 58000, total_sales: 1450000, total_cost: 1100000 },
    { order_date: '2025-09-10', product_name: '4K Monitor', product_category: 'Electronics', region: 'South', qty: 26, unit_price: 24500, total_sales: 637000, total_cost: 481000 },
    { order_date: '2025-09-16', product_name: 'Ergonomic Chair', product_category: 'Furniture', region: 'West', qty: 30, unit_price: 14000, total_sales: 420000, total_cost: 294000 },
    { order_date: '2025-09-21', product_name: 'Mechanical Keyboard', product_category: 'Accessories', region: 'North', qty: 70, unit_price: 3800, total_sales: 266000, total_cost: 168000 },
    { order_date: '2025-09-28', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'East', qty: 110, unit_price: 1200, total_sales: 132000, total_cost: 77000 },

    // Oct 2025
    { order_date: '2025-10-03', product_name: 'Laptop', product_category: 'Electronics', region: 'North', qty: 27, unit_price: 58000, total_sales: 1566000, total_cost: 1188000 },
    { order_date: '2025-10-09', product_name: 'Standing Desk', product_category: 'Furniture', region: 'South', qty: 25, unit_price: 26000, total_sales: 650000, total_cost: 462500 },
    { order_date: '2025-10-15', product_name: '4K Monitor', product_category: 'Electronics', region: 'West', qty: 28, unit_price: 24500, total_sales: 686000, total_cost: 518000 },
    { order_date: '2025-10-21', product_name: 'USB-C Hub', product_category: 'Accessories', region: 'North', qty: 100, unit_price: 2200, total_sales: 220000, total_cost: 130000 },
    { order_date: '2025-10-27', product_name: 'Wireless Mouse', product_category: 'Accessories', region: 'South', qty: 120, unit_price: 1200, total_sales: 144000, total_cost: 84000 },
  ];

  const noCostRows = fullSalesRows.slice(0, 25).map((r) => ({
    sale_date: r.order_date,
    item: r.product_name,
    category: r.product_category,
    zone: r.region,
    units_sold: r.qty ?? 80,
    selling_price: r.unit_price,
  }));

  return [
    {
      id: 'sample-enterprise',
      name: 'Apex Tech SMB Sales (Complete Dataset)',
      filename: 'apex_tech_sales_2025.csv',
      description: '10 months of multi-region B2B/SMB tech sales with Date, Product, Category, Region, Quantity, Selling_Price, Revenue, and Cost.',
      rows: fullSalesRows,
    },
    {
      id: 'sample-no-cost',
      name: 'Velocity Retail Orders (Derived Revenue, No Cost)',
      filename: 'velocity_retail_no_cost.csv',
      description: 'Demonstrates automatic Revenue derivation (Quantity × Selling_Price) and transparent "Profit Unavailable" guardrails when Cost is absent.',
      rows: noCostRows,
    },
  ];
}
