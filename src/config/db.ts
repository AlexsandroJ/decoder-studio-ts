import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Tipagem para as variáveis de ambiente usadas neste arquivo
interface DBEnv {
  NODE_ENV: string;
  DB_USER: string;
  DB_PASS: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
}

const env = process.env as unknown as DBEnv;

let mongoServer: MongoMemoryServer | null = null;

/**
 * Conecta ao banco de dados (Memória ou Real)
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Evita tentativas de reconexão se já estiver conectado
    if (mongoose.connection.readyState === 1) {
      console.log('ℹ️  MongoDB já está conectado.');
      return;
    }

    const useInMemoryDB = env.NODE_ENV === 'development';

    if (useInMemoryDB) {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ Conectado ao MongoDB em memória (DEV).');
    } else {
      // Fallbacks seguros para evitar 'undefined' na string de conexão
      const user = env.DB_USER || 'root';
      const pass = env.DB_PASS || 'root';
      const host = env.DB_HOST || 'localhost';
      const port = env.DB_PORT || '27017';
      const name = env.DB_NAME || 'api_db';

      // 🧠 Lógica inteligente para detectar se é Cloud ou Local
      const isCloud = host.includes('mongodb.net') || host.includes('srv');
      const protocol = isCloud ? 'mongodb+srv' : 'mongodb';

      // Cloud não usa porta na URI, Local usa
      const portString = isCloud ? '' : `:${port}`;

      const uri = `${protocol}://${user}:${pass}@${host}${portString}${name}?authSource=admin`;

      console.log(`🔄 Conectando ao MongoDB (${isCloud ? 'Cloud' : 'Local'}) em: ${host}...`);

      await mongoose.connect(uri, {
        // Opções recomendadas para produção
        serverSelectionTimeoutMS: 5000, // Falha rápida (5s) se o banco estiver fora do ar
        socketTimeoutMS: 45000,
      });

      console.log('✅ MongoDB conectado com sucesso!');

      // Listeners opcionais para monitorar o estado da conexão
      mongoose.connection.on('error', (err) => {
        console.error('❌ Erro de conexão com MongoDB:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB desconectado.');
      });
    }
  } catch (error) {
    console.error('❌ Erro fatal ao conectar ao MongoDB:', error);
    process.exit(1); // Encerra o processo da API em caso de falha crítica
  }
};

/**
 * Desconecta do banco de dados e limpa recursos
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    if (mongoServer) {
      // ⚠️ CORREÇÃO: Limpar as coleções ANTES de parar o servidor/desconectar
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }

      await mongoServer.stop();
      mongoServer = null;
      console.log('🛑 MongoDB em memória parado e dados limpos.');
    }

    // Desconecta o Mongoose se ainda houver uma conexão ativa (readyState 1)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🛑 Conexão com o MongoDB encerrada.');
    }
  } catch (error) {
    console.error('❌ Erro ao desconectar do MongoDB:', error);
  }
};