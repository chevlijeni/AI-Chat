import { Router } from 'express';
import chatController from '../controllers/chatController';

const router: Router = Router();

router.get('/sessions', chatController.getSessions.bind(chatController));
router.get('/:sessionId', chatController.getHistory.bind(chatController));
router.delete('/:sessionId', chatController.deleteSession.bind(chatController));

export default router;
