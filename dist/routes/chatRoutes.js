"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = __importDefault(require("../controllers/chatController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Apply JWT protection to all routes in this file
router.use(authMiddleware_1.authenticateToken);
router.post('/', chatController_1.default.handleChat.bind(chatController_1.default));
router.post('/session', chatController_1.default.createSession.bind(chatController_1.default));
router.put('/:sessionId/edit/:messageId', chatController_1.default.editAndResend.bind(chatController_1.default));
exports.default = router;
