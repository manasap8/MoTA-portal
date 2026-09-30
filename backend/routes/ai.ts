import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { AiAssistantService } from '../ai/aiAssistantService';

export const aiRouter = Router();

aiRouter.post('/query', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: { code: 'EMPTY_QUERY', message: 'Query string is required.' } });
    }

    const response = await AiAssistantService.query(query, user.role);
    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({
      error: { code: 'AI_QUERY_ERROR', message: err.message || 'AI assistant query processing failed.' },
    });
  }
});
