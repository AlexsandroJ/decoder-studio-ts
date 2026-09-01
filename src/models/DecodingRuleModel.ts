import { IDecodingRule } from "../types";

import mongoose, { Schema, Document } from 'mongoose';

// ════════════════════════════════════════════════════════
//  SCHEMA
// ════════════════════════════════════════════════════════

const decodingRuleSchema = new Schema<IDecodingRule>(
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
    signalName: {
      type: String,
      required: true,
      trim: true
    },
    startBit: {
      type: Number,
      required: true,
      min: 0,
      max: 63
    },
    bitLength: {
      type: Number,
      required: true,
      min: 1,
      max: 64
    },
    byteOrder: {
      type: String,
      enum: ['big', 'little'],
      default: 'big'
    },
    signed: {
      type: Boolean,
      default: false
    },
    factor: {
      type: Number,
      default: 1
    },
    offset: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: ''
    },
    minValue: {
      type: Number
    },
    maxValue: {
      type: Number
    }
  },
  {
    timestamps: true,
    collection: 'decoding_rules'
  }
);

// ════════════════════════════════════════════════════════
//  MODELO E SERVIÇO
// ════════════════════════════════════════════════════════

const DecodingRuleModel = mongoose.model<IDecodingRule>('DecodingRule', decodingRuleSchema);

export const DecodingRuleService = {
  async insert(rule: Partial<IDecodingRule>): Promise<IDecodingRule> {
    return await DecodingRuleModel.create(rule);
  },

  async insertMany(rules: Partial<IDecodingRule>[]): Promise<IDecodingRule[]> {
    return await DecodingRuleModel.insertMany(rules, { ordered: false });
  },

  async findById(id: string): Promise<IDecodingRule | null> {
    return await DecodingRuleModel.findOne({ id }).lean();
  },

  async findByCanId(canId: string): Promise<IDecodingRule[]> {
    return await DecodingRuleModel.find({ canId })
      .sort({ startBit: 1 })
      .lean();
  },

  async findAll(): Promise<IDecodingRule[]> {
    return await DecodingRuleModel.find()
      .sort()
      .lean();      
  },

  async update(id: string, updates: Partial<IDecodingRule>): Promise<IDecodingRule | null> {
    return await DecodingRuleModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true }
    ).lean();
  },

  async delete(id: string): Promise<boolean> {
    const result = await DecodingRuleModel.deleteOne({ id });
    return result.deletedCount > 0;
  },

  async clear(): Promise<void> {
    await DecodingRuleModel.deleteMany({});
  },

  async count(): Promise<number> {
    return await DecodingRuleModel.countDocuments();
  }
};

export default DecodingRuleModel;
