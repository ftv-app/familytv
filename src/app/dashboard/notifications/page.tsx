import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { upsertUser, getNotificationsByUserId } from '@/lib/db';
import { Bell } from 'lucide-react';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const [dbUser] = await upsertUser(
    user.id,
    user.emailAddresses[0]?.emailAddress ?? '',
    user.fullName ?? user.firstName ?? null
  );

  const notifications = await getNotificationsByUserId(dbUser.id);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header
        className="border-b px-6 py-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--muted-foreground)' }}
          >
            ← Back to Dashboard
          </Link>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span style={{ color: 'var(--primary)' }}>Family</span>TV
          </h1>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                <Bell className="w-4 h-4" />
                {unreadCount} unread
              </span>
            )}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Notifications
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Stay up to date with your family activity
          </p>
        </div>

        <NotificationsClient initialNotifications={notifications} />
      </main>
    </div>
  );
}
