import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { swaggerSpec } from './utils/swagger.js';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

export default app;

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to init DB', err);
  });
}
