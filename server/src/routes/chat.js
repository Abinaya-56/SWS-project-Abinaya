import express from 'express';
import { askQuestion } from '../controllers/chat.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Ask a question
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI Answer
 *       400:
 *         description: Question missing or empty
 */
router.post('/', askQuestion);

export default router;
