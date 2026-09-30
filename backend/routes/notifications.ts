import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const notifs = db.getNotificationsByUserId(user.id);
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  res.json({
    notifications: notifs,
    unreadCount,
  });
});

notificationsRouter.post('/:id/read', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  db.markNotificationAsRead(req.params.id, user.id);
  res.json({ message: 'Marked as read.' });
});

notificationsRouter.post('/read-all', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  db.markAllNotificationsAsRead(user.id);
  res.json({ message: 'All notifications marked as read.' });
});
