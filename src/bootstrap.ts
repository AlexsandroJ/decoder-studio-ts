// src/bootstrap.ts
import { DecodingRuleService } from "./models/DecodingRuleModel";
import { DEFAULT_DECODING_RULES } from "./config/decodingRules";

export async function bootstrap(): Promise<void> {
  console.log("🔄 Inicializando aplicação (Bootstrap)...");

  try {
    // 1. Usa o SERVIÇO para contar, não o modelo direto
    const existingCount = await DecodingRuleService.count();
    
    if (existingCount === 0) {
      console.log("📦 Nenhuma regra encontrada. Carregando regras padrão...");
      
      // 2. Usa o SERVIÇO para inserir em massa
      await DecodingRuleService.insertMany(DEFAULT_DECODING_RULES);
      
      console.log(`✅ ${DEFAULT_DECODING_RULES.length} regras de decodificação carregadas com sucesso!`);
    } else {
      console.log(`✅ ${existingCount} regras de decodificação já existem no banco. Pulando seed.`);
    }
  } catch (error) {
    console.error("❌ Erro crítico durante o bootstrap:", error);
    throw error; // Propaga o erro para o server.ts encerrar a aplicação com segurança
  }
}