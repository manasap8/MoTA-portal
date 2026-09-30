import { Router } from 'express';
import { db } from '../database/store';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { Communication } from '../types';

export const communicationsRouter = Router();

// Get communications for an application
communicationsRouter.get('/:applicationId', authenticate, (req: AuthenticatedRequest, res) => {
  const comms = db.getCommunicationsByApplicationId(req.params.applicationId);
  res.json(comms);
});

// Send a message / reply
communicationsRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { applicationId, recipientId, recipientName, recipientRole, message, linkedDeficiencyId } = req.body;

  if (!applicationId || !message || !message.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Application ID and message are required.' } });
  }

  const app = db.findApplicationById(applicationId);
  if (!app) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found.' } });
  }

  let finalRecipientId = recipientId;
  let finalRecipientName = recipientName;
  let finalRecipientRole = recipientRole;

  if (!finalRecipientId) {
    if (user.role === 'applicant') {
      finalRecipientRole = 'officer';
      finalRecipientName = 'Verification Desk';
      finalRecipientId = 'usr_officer_0';
    } else {
      const applicantUser = db.findUserByEmail(app.applicantEmail);
      finalRecipientId = applicantUser?.id || app.applicantId;
      finalRecipientName = app.applicantName;
      finalRecipientRole = 'applicant';
    }
  }

  const comm: Communication = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    applicationId: app.id,
    senderId: user.id,
    senderName: user.fullName,
    senderRole: user.role,
    recipientId: finalRecipientId,
    recipientName: finalRecipientName,
    recipientRole: finalRecipientRole,
    message: message.trim(),
    linkedDeficiencyId,
    createdAt: new Date().toISOString(),
  };

  db.addCommunication(comm);

  // Send notification to recipient
  if (finalRecipientId) {
    db.addNotification({
      id: `notif_${Date.now()}`,
      userId: finalRecipientId,
      title: `New Message regarding ${app.applicationNumber}`,
      message: `${user.fullName} (${user.role}): "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
      type: 'info',
      relatedApplicationId: app.id,
      linkUrl: user.role === 'applicant' ? `/officer/applications/${app.id}` : `/applicant/communication`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  return res.status(201).json({ message: 'Message sent successfully.', communication: comm });
});
