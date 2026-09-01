import { IUnifiedRecord, IDecodedSignal, ISensorData, UnifiedSource } from "../types";

import mongoose, { Schema, Document } from 'mongoose';

// ════════════════════════════════════════════════════════
//  SCHEMA
// ════════════════════════════════════════════════════════

const decodedSignalSchema = new Schema<IDecodedSignal>(
  {
    ruleId: { type: String, required: true },
    signalName: { type: String, required: true },
    value: { type: Number, required: true },
    unit: { type: String, default: '' },
    rawHex: { type: String, required: true },
    timestamp: { type: Number, required: true }
  },
  { _id: false }
);


const sensorReadingSchema = new Schema<ISensorData>(
  {
    id: { type: String, required: true },
    sensorId: { type: String, required: true },
    sensorType: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' },
    timestamp: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { _id: false }
);


const unifiedDataSchema = new Schema<IUnifiedRecord>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    timestamp: {
      type: Number,
      required: true,
      index: true,
      default: Date.now
    },
    source: {
      type: String,
      required: true,
      index: true,
      enum: ['can', 'sensor', 'merged', 'custom'],
      default: 'can'
    },
    canSignals: {
      type: [decodedSignalSchema],
      default: []
    },
    sensorReadings: {
      type: [sensorReadingSchema],
      default: []
    },
    customData: {
      type: Schema.Types.Mixed
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    collection: 'unified_data'
  }
);

// ════════════════════════════════════════════════════════
//  MODELO E SERVIÇO
// ════════════════════════════════════════════════════════

const UnifiedDataModel = mongoose.model<IUnifiedRecord>('UnifiedData', unifiedDataSchema);

export const UnifiedDataService = {
  async insert(record: Partial<IUnifiedRecord>): Promise<IUnifiedRecord> {
    return await UnifiedDataModel.create(record);
  },

  async insertMany(records: Partial<IUnifiedRecord>[]): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.insertMany(records, { ordered: false });
  },

  async findAll(): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find()
      .sort()
      .lean();
  },


  async findById(id: string): Promise<IUnifiedRecord | null> {
    return await UnifiedDataModel.findOne({ id }).lean();
  },

  async findBySource(source: UnifiedSource, limit = 200): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find({ source })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findMerged(limit = 200): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find({ merged: true })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByDevice(deviceId: string, limit = 200): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByTimeRange(start: number, end: number): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find({
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 }).lean();
  },

  async findRecent(limit = 200): Promise<IUnifiedRecord[]> {
    return await UnifiedDataModel.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async clear(): Promise<void> {
    await UnifiedDataModel.deleteMany({});
  },

  async count(): Promise<number> {
    return await UnifiedDataModel.countDocuments();
  }
};

export default UnifiedDataModel;