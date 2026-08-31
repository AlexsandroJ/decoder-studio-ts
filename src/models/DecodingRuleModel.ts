import { IDecodingRule } from "../types";

class DecodingRuleModel {
  private rules: Map<string, IDecodingRule> = new Map();

  insert(rule: IDecodingRule): IDecodingRule {
    this.rules.set(rule.id, rule);
    return rule;
  }

  insertMany(rules: IDecodingRule[]): IDecodingRule[] {
    rules.forEach((r) => this.rules.set(r.id, r));
    return rules;
  }

  findById(id: string): IDecodingRule | undefined {
    return this.rules.get(id);
  }

  findByCanId(canId: string): IDecodingRule[] {
    return [...this.rules.values()].filter((r) => r.canId === canId);
  }

  findAll(): IDecodingRule[] {
    return [...this.rules.values()];
  }

  delete(id: string): boolean {
    return this.rules.delete(id);
  }

  clear(): void {
    this.rules.clear();
  }
}

export default new DecodingRuleModel();
