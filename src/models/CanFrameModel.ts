import { ICanFrame } from "../types";

class CanFrameModel {
  private frames: Map<string, ICanFrame> = new Map();

  insert(frame: ICanFrame): ICanFrame {
    this.frames.set(frame.id, frame);
    return frame;
  }

  insertMany(frames: ICanFrame[]): ICanFrame[] {
    frames.forEach((f) => this.frames.set(f.id, f));
    return frames;
  }

  findById(id: string): ICanFrame | undefined {
    return this.frames.get(id);
  }

  findByCanId(canId: string): ICanFrame[] {
    return [...this.frames.values()].filter((f) => f.canId === canId);
  }

  findAll(limit = 100): ICanFrame[] {
    return [...this.frames.values()]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  clear(): void {
    this.frames.clear();
  }

  count(): number {
    return this.frames.size;
  }
}

export default new CanFrameModel();
