import { DatasetAnalysisBundle } from '../schemas/analytics';

export interface IDatasetRepository {
  save(bundle: DatasetAnalysisBundle): Promise<void>;
  getById(datasetId: string): Promise<DatasetAnalysisBundle | null>;
  getActive(): Promise<DatasetAnalysisBundle | null>;
  setActive(datasetId: string): Promise<DatasetAnalysisBundle | null>;
  listAll(): Promise<
    Array<{
      datasetId: string;
      filename: string;
      uploadedAt: string;
      cleanedRowCount: number;
      columnCount: number;
      totalRevenue: number | null;
      currencySymbol: string;
    }>
  >;
  deleteById(datasetId: string): Promise<boolean>;
}

export class InMemoryDatasetRepository implements IDatasetRepository {
  private store = new Map<string, DatasetAnalysisBundle>();
  private activeId: string | null = null;

  async save(bundle: DatasetAnalysisBundle): Promise<void> {
    this.store.set(bundle.datasetId, bundle);
    this.activeId = bundle.datasetId;
  }

  async getById(datasetId: string): Promise<DatasetAnalysisBundle | null> {
    return this.store.get(datasetId) ?? null;
  }

  async getActive(): Promise<DatasetAnalysisBundle | null> {
    if (!this.activeId) return null;
    return this.store.get(this.activeId) ?? null;
  }

  async setActive(datasetId: string): Promise<DatasetAnalysisBundle | null> {
    if (!this.store.has(datasetId)) return null;
    this.activeId = datasetId;
    return this.store.get(datasetId) ?? null;
  }

  async listAll() {
    return Array.from(this.store.values())
      .map((b) => ({
        datasetId: b.datasetId,
        filename: b.quality.filename,
        uploadedAt: b.quality.uploadedAt,
        cleanedRowCount: b.quality.cleanedRowCount,
        columnCount: b.quality.columnCount,
        totalRevenue: b.kpis.totalRevenue,
        currencySymbol: b.kpis.currencySymbol,
      }))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  async deleteById(datasetId: string): Promise<boolean> {
    const deleted = this.store.delete(datasetId);
    if (this.activeId === datasetId) {
      const remaining = Array.from(this.store.keys());
      this.activeId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
    }
    return deleted;
  }
}

export const datasetRepository: IDatasetRepository = new InMemoryDatasetRepository();
