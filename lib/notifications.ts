// Enhanced notification system for 4MK
import { sendEmail } from './mailer';
import { logger } from './logger';

export interface NotificationData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendNotification(data: NotificationData): Promise<boolean> {
  try {
    await sendEmail(data);
    logger.debug('Notification sent:', data.to);
    return true;
  } catch (error) {
    logger.error('Notification failed:', error);
    return false;
  }
}

// Notification templates
export const notifications = {
  newOffer: (requesterEmail: string, needTitle: string, helperName?: string) => ({
    to: requesterEmail,
    subject: `New offer for "${needTitle}" - 4MK`,
    text: `You have received a new offer for your need: "${needTitle}"

${helperName ? `From: ${helperName}\n` : ''}Please log in to review and respond to the offer.

Thank you for using 4MK!`
  }),

  offerAccepted: (helperEmail: string, needTitle: string, requesterMessage?: string) => ({
    to: helperEmail,
    subject: `Your offer for "${needTitle}" was accepted! - 4MK`,
    text: `Great news! Your offer to help with "${needTitle}" has been accepted!

${requesterMessage ? `Requester's message: ${requesterMessage}\n` : ''}You can now coordinate directly via email to share codes, pickup details, or arrangements.

When the help is completed, the requester will mark it as fulfilled in the system.

Thank you for helping your community through 4MK!`
  }),

  offerDeclined: (helperEmail: string, needTitle: string, reason?: string) => ({
    to: helperEmail,
    subject: `Update on your offer for "${needTitle}" - 4MK`,
    text: `Your offer to help with "${needTitle}" was declined.

${reason ? `Reason: ${reason}\n` : ''}Thank you for your willingness to help! There are many other opportunities to make a difference in your community.

Keep helping through 4MK!`
  }),

  offerWithdrawn: (requesterEmail: string, needTitle: string, reason?: string) => ({
    to: requesterEmail,
    subject: `Offer withdrawn for "${needTitle}" - 4MK`,
    text: `An offer for "${needTitle}" has been withdrawn by the helper.

${reason ? `Reason provided: ${reason}\n` : ''}You can still receive other offers for this need. Thank you for using 4MK!`
  }),

  returnInitiated: (helperEmail: string, needTitle: string, reason?: string, isNonReversible?: boolean) => ({
    to: helperEmail,
    subject: `Return initiated for "${needTitle}" - 4MK`,
    text: `A return has been initiated for your help with "${needTitle}".

${reason ? `Reason: ${reason}\n` : ''}${isNonReversible ? 'Note: This return is marked as non-reversible due to the type of help provided.\n' : ''}Thank you for helping through 4MK!`
  }),

  returnCompleted: (helperEmail: string, needTitle: string, notes?: string) => ({
    to: helperEmail,
    subject: `Return completed for "${needTitle}" - 4MK`,
    text: `The return for your help with "${needTitle}" has been completed.

${notes ? `Additional notes: ${notes}\n` : ''}Thank you for your understanding and for helping through 4MK!`
  }),

  clarifyingStatus: (otherPartyEmail: string, needTitle: string, message?: string) => ({
    to: otherPartyEmail,
    subject: `Clarification needed for "${needTitle}" - 4MK`,
    text: `The offer for "${needTitle}" has been marked as needing clarification.

${message ? `Message: ${message}\n` : ''}Please check the platform to respond to questions or provide additional information.

Thank you for using 4MK!`
  }),

  offerResumed: (otherPartyEmail: string, needTitle: string, message?: string) => ({
    to: otherPartyEmail,
    subject: `Offer resumed for "${needTitle}" - 4MK`,
    text: `The offer for "${needTitle}" has been resumed after clarification.

${message ? `Message: ${message}\n` : ''}You can continue coordinating through the platform.

Thank you for using 4MK!`
  }),

  abuseReport: (adminEmail: string, reportDetails: string) => ({
    to: adminEmail,
    subject: '🚨 4MK Abuse Report',
    text: `A new abuse report has been submitted on 4MK:\n\n${reportDetails}\n\nPlease review and take appropriate action.`
  })
};




