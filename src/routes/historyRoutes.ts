import { Router } from 'express';
import chatController from '../controllers/chatController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

// Apply JWT protection to all routes in this file
router.use(authenticateToken);

router.get('/sessions', chatController.getSessions.bind(chatController));
router.get('/:sessionId', chatController.getHistory.bind(chatController));
router.delete('/:sessionId', chatController.deleteSession.bind(chatController));

export default router;
