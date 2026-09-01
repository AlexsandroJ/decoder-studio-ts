import { ISensorData } from "../types";

import mongoose, { Schema, Document } from 'mongoose';

// ════════════════════════════════════════════════════════
//  SCHEMA
// ════════════════════════════════════════════════════════

const sensorDataSchema = new Schema<ISensorData>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    sensorId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    sensorType: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    value: {
      type: Schema.Types.Mixed,
      required: true
    },
    unit: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
      default: Date.now
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'sensor_data'
  }
);

// ════════════════════════════════════════════════════════
//  MODELO E SERVIÇO
// ════════════════════════════════════════════════════════

const SensorDataModel = mongoose.model<ISensorData>('SensorData', sensorDataSchema);

export const SensorDataService = {
  async insert(data: Partial<ISensorData>): Promise<ISensorData> {
    return await SensorDataModel.create(data);
  },

  async insertMany(dataArray: Partial<ISensorData>[]): Promise<ISensorData[]> {
    return await SensorDataModel.insertMany(dataArray, { ordered: false });
  },

  async findById(id: string): Promise<ISensorData | null> {
    return await SensorDataModel.findOne({ id }).lean();
  },

  async findBySensorId(sensorId: string, limit = 100): Promise<ISensorData[]> {
    return await SensorDataModel.find({ sensorId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByType(sensorType: string, limit = 100): Promise<ISensorData[]> {
    return await SensorDataModel.find({ sensorType })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByDevice(deviceId: string, limit = 100): Promise<ISensorData[]> {
    return await SensorDataModel.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findRecent(limit = 100): Promise<ISensorData[]> {
    return await SensorDataModel.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByTimeRange(start: number, end: number): Promise<ISensorData[]> {
    return await SensorDataModel.find({
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 }).lean();
  },

  async clear(): Promise<void> {
    await SensorDataModel.deleteMany({});
  },

  async count(): Promise<number> {
    return await SensorDataModel.countDocuments();
  }
};

export default SensorDataModel;
