import DecodingRuleModel from "./models/DecodingRuleModel";
import { allDecodingRules } from "./config/decodingRules";

/**
 * Bootstrap da aplicação:
 * - Carrega regras de decodificação padrão
 * - Inicializa dados em memória
 * - Roda ANTES do servidor começar a aceitar requisições
 */
export function bootstrap(): void {
  console.log("\n🚀 Inicializando aplicação...");

  // 1. Carrega regras de decodificação
  const countBefore = DecodingRuleModel.findAll().length;
  
  if (countBefore === 0) {
    const loaded = DecodingRuleModel.insertMany(allDecodingRules);
    console.log(`   ✅ ${loaded.length} regras de decodificação carregadas`);
    
    // Log detalhado por CAN ID
    const grouped = new Map<string, number>();
    loaded.forEach((r) => {
      grouped.set(r.canId, (grouped.get(r.canId) ?? 0) + 1);
    });
    grouped.forEach((count, canId) => {
      console.log(`      📡 ${canId}: ${count} sinais`);
    });
  } else {
    console.log(`   ⏭️  ${countBefore} regras já existentes (skip)`);
  }

  console.log("✅ Bootstrap concluído\n");
}