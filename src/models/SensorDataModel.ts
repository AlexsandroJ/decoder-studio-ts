import { ISensorData } from "../types";

class SensorDataModel {
  private readings: Map<string, ISensorData> = new Map();

  insert(reading: ISensorData): ISensorData {
    this.readings.set(reading.id, reading);
    return reading;
  }

  insertMany(readings: ISensorData[]): ISensorData[] {
    readings.forEach((r) => this.readings.set(r.id, r));
    return readings;
  }

  findById(id: string): ISensorData | undefined {
    return this.readings.get(id);
  }

  findBySensorId(sensorId: string): ISensorData[] {
    return [...this.readings.values()].filter((r) => r.sensorId === sensorId);
  }

  findByType(sensorType: string): ISensorData[] {
    return [...this.readings.values()].filter((r) => r.sensorType === sensorType);
  }

  findAll(limit = 100): ISensorData[] {
    return [...this.readings.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  clear(): void {
    this.readings.clear();
  }

  count(): number {
    return this.readings.size;
  }
}

export default new SensorDataModel();
