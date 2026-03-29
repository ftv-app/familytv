'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, FileText, Calendar, Mail, ExternalLink } from 'lucide-react';
import { NotificationWithDetails } from '@/lib/types';

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationWithDetails[];
}) {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAsRead(notificationId: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'post_created':
        return <FileText className="w-5 h-5" />;
      case 'event_reminder':
        return <Calendar className="w-5 h-5" />;
      case 'invite_received':
        return <Mail className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  }

  function getNotificationLink(notification: NotificationWithDetails): string | null {
    if (!notification.family_id) return null;
    switch (notification.type) {
      case 'post_created':
        return `/dashboard/${notification.family_id}`;
      case 'event_reminder':
        return `/dashboard/${notification.family_id}/calendar`;
      default:
        return null;
    }
  }

  function formatDate(date: Date) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <Bell
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <p style={{ color: 'var(--foreground)' }}>No notifications yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            You&apos;ll be notified when something happens in your families
          </p>
        </div>
      ) : (
        <>
          {unreadCount > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {unreadCount} unread
              </p>
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="text-sm flex items-center gap-1 hover:opacity-70 transition-opacity disabled:opacity-50"
                style={{ color: 'var(--primary)' }}
              >
                <CheckCheck className="w-4 h-4" />
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            </div>
          )}

          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            {notifications.map((notification, index) => {
              const link = getNotificationLink(notification);
              const isUnread = !notification.read;

              return (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 border-b last:border-0"
                  style={{
                    borderColor: 'var(--border)',
                    background: isUnread ? 'color-mix(in srgb, var(--primary) 5%, var(--card))' : 'transparent',
                  }}
                >
                  <div
                    className="mt-0.5 p-2 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      color: 'var(--primary)',
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className="text-sm"
                          style={{
                            color: 'var(--foreground)',
                            fontWeight: isUnread ? 600 : 400,
                          }}
                        >
                          {notification.message}
                        </p>
                        {notification.related_title && (
                          <p
                            className="text-xs mt-1 truncate"
                            style={{ color: 'var(--muted-foreground)' }}
                          >
                            &quot;{notification.related_title}&quot;
                          </p>
                        )}
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {formatDate(notification.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--primary)' }}
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {link && (
                          <Link
                            href={link}
                            className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--muted-foreground)' }}
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
