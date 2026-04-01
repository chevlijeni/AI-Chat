import { Router } from 'express';
import chatController from '../controllers/chatController';

const router: Router = Router();

router.post('/', chatController.handleChat.bind(chatController));
router.post('/session', chatController.createSession.bind(chatController));
router.put('/:sessionId/edit/:messageId', chatController.editAndResend.bind(chatController));

export default router;
