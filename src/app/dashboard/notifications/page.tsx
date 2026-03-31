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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-sm transition-colors hover:opacity-70 text-muted-foreground"
          >
            ← Back
          </Link>
          <h1 className="font-heading text-lg font-bold text-primary shrink-0">
            FamilyTV
          </h1>
          <span className="text-sm text-muted-foreground">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Bell className="w-4 h-4" />
                {unreadCount}
              </span>
            )}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Notifications
          </h2>
          <p className="text-sm mt-1 text-muted-foreground">
            Stay up to date with your family activity
          </p>
        </div>

        <NotificationsClient initialNotifications={notifications} />
      </main>
    </div>
  );
}
