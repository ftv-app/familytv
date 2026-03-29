import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { upsertUser, getNotificationsByUserId, markNotificationRead, markAllNotificationsRead } from '@/lib/db';

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await upsertUser(
      user.id,
      user.emailAddresses[0]?.emailAddress ?? '',
      user.fullName ?? user.firstName ?? null
    );

    const notifications = await getNotificationsByUserId(dbUser.id);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [dbUser] = await upsertUser(
      user.id,
      user.emailAddresses[0]?.emailAddress ?? '',
      user.fullName ?? user.firstName ?? null
    );

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsRead(dbUser.id);
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      await markNotificationRead(notificationId, dbUser.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'notificationId or markAll is required' }, { status: 400 });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
