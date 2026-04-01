import { Router } from 'express';
import chatController from '../controllers/chatController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router: Router = Router();

// Apply JWT protection to all routes in this file
router.use(authenticateToken);

router.post('/', chatController.handleChat.bind(chatController));
router.post('/session', chatController.createSession.bind(chatController));
router.put('/:sessionId/edit/:messageId', chatController.editAndResend.bind(chatController));

export default router;
