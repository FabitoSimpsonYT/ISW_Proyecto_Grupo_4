import express from 'express';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  getUnreadCount 
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

export default router;

// src/routes/admin.js
import express from 'express';
import { 
  getStats, 
  getUsers, 
  updateUser, 
  deleteUser, 
  getAuditLogs,
  reassignEvent 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();