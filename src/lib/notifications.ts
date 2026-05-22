import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { Invitee } from './types'

/**
 * Sends a notification to invitees when an activity is shared or modified
 */
export async function notifyInvitees(
  invitees: Invitee[] | undefined,
  activityTitle: string,
  eventType: 'shared' | 'added-to-calendar' | 'modified'
) {
  if (!invitees || invitees.length === 0) return

  const messages = {
    shared: `You've been invited to: ${activityTitle}`,
    'added-to-calendar': `"${activityTitle}" has been added to calendar`,
    modified: `"${activityTitle}" has been updated`,
  }

  const message = messages[eventType]

  // Get FCM tokens for invitees and send notifications
  // This is a placeholder - actual implementation depends on your FCM setup
  const fcmTokens: string[] = []

  for (const invitee of invitees) {
    try {
      const userDoc = await getDoc(doc(db, 'users', invitee.userId))
      if (userDoc.exists()) {
        const fcmToken = userDoc.data()?.fcmToken
        if (fcmToken) fcmTokens.push(fcmToken)
      }
    } catch (error) {
      console.warn(`Failed to get FCM token for ${invitee.userId}:`, error)
    }
  }

  if (fcmTokens.length === 0) return

  // Send push notifications via Cloud Functions
  try {
    await fetch('/api/send-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fcmTokens,
        title: 'Family Activity Scheduler',
        body: message,
        data: { type: eventType, activity: activityTitle },
      }),
    })
  } catch (error) {
    console.warn('Failed to send notifications:', error)
  }
}

/**
 * Creates a calendar event notification with attendees
 */
export async function notifyCalendarEvent(
  activityTitle: string,
  dueDate: string,
  dueTime: string,
  invitees: Invitee[] | undefined
) {
  const attendees = invitees?.map((i) => ({ email: i.email, name: i.displayName })) || []

  const notification = {
    title: activityTitle,
    start: dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate,
    attendees,
    description: 'Family activity - added via Family Activity Scheduler',
  }

  // Store notification in Firestore for Cloud Functions to process
  try {
    await fetch('/api/create-calendar-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    })
  } catch (error) {
    console.warn('Failed to create calendar event:', error)
  }
}
