import { ICanFrame } from "../types";

import mongoose, { Schema, Document, Model } from 'mongoose';

// ════════════════════════════════════════════════════════
//  SCHEMA
// ════════════════════════════════════════════════════════

const canFrameSchema = new Schema<ICanFrame>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    canId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    dlc: {
      type: Number,
      default: 8,
      min: 0,
      max: 64
    },
    data: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    timestamp: {
      type: Number,
      required: true,
      index: true
    },
    interface: {
      type: String,
      enum: ['mqtt', 'http', 'websocket', 'can-bus', 'serial'],
      default: 'http'
    }
  },
  {
    timestamps: true,
    collection: 'can_frames'
  }
);

// ═══════════════════════════════════════════════════════
//  MODELO E SERVIÇO
// ════════════════════════════════════════════════════════

const CanFrameModel = mongoose.model<ICanFrame>('CanFrame', canFrameSchema);

export const CanFrameService = {
  async insert(frame: Partial<ICanFrame>): Promise<ICanFrame> {
    return await CanFrameModel.create(frame);
  },

  async insertMany(frames: Partial<ICanFrame>[]): Promise<ICanFrame[]> {
    return await CanFrameModel.insertMany(frames, { ordered: false });
  },

  async findById(id: string): Promise<ICanFrame | null> {
    return await CanFrameModel.findOne({ id }).lean();
  },

  async findByCanId(canId: string, limit = 100): Promise<ICanFrame[]> {
    return await CanFrameModel.find({ canId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByDevice(deviceId: string, limit = 100): Promise<ICanFrame[]> {
    return await CanFrameModel.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async findByTimeRange(start: number, end: number): Promise<ICanFrame[]> {
    return await CanFrameModel.find({
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 }).lean();
  },

  async findAll(limit = 100): Promise<ICanFrame[]> {
    return await CanFrameModel.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  },

  async clear(): Promise<void> {
    await CanFrameModel.deleteMany({});
  },

  async count(): Promise<number> {
    return await CanFrameModel.countDocuments();
  }
};

export default CanFrameModel;