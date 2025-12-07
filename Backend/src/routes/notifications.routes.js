import express from 'express';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/notificaction.controller.js';
import { injectEntityIds } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', injectEntityIds, getNotifications);
router.get('/unread-count', injectEntityIds, getUnreadCount);
router.put('/mark-all-read', injectEntityIds, markAllAsRead);
router.put('/:id/read', injectEntityIds, markAsRead);

export default router;



