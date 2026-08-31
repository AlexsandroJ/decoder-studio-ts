import { IUnifiedRecord } from "../types";

class UnifiedDataModel {
  private records: Map<string, IUnifiedRecord> = new Map();

  insert(record: IUnifiedRecord): IUnifiedRecord {
    this.records.set(record.id, record);
    return record;
  }

  insertMany(records: IUnifiedRecord[]): IUnifiedRecord[] {
    records.forEach((r) => this.records.set(r.id, r));
    return records;
  }

  findById(id: string): IUnifiedRecord | undefined {
    return this.records.get(id);
  }

  findBySource(source: IUnifiedRecord["source"]): IUnifiedRecord[] {
    return [...this.records.values()].filter((r) => r.source === source);
  }

  findAll(limit = 200): IUnifiedRecord[] {
    return [...this.records.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  findByTimeRange(start: number, end: number): IUnifiedRecord[] {
    return [...this.records.values()]
      .filter((r) => r.timestamp >= start && r.timestamp <= end)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  clear(): void {
    this.records.clear();
  }

  count(): number {
    return this.records.size;
  }
}

export default new UnifiedDataModel();
