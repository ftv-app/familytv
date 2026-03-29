import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "owner" | "member";
  joinedAt: Date;
}

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

interface FamilyMembersProps {
  familyId: string;
  members: FamilyMember[];
  pendingInvites?: PendingInvite[];
  currentUserId?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: FamilyMember;
  isCurrentUser: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 group">
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {member.name}
          </p>
          {isCurrentUser && (
            <Badge variant="ghost" className="text-xs text-muted-foreground">
              You
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {member.email}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {member.role === "owner" && (
          <Badge variant="secondary" className="text-xs">
            Owner
          </Badge>
        )}
        {isCurrentUser && member.role !== "owner" && (
          <span className="text-xs text-muted-foreground">Member</span>
        )}
      </div>
    </div>
  );
}

export function FamilyMembers({
  familyId,
  members,
  pendingInvites = [],
  currentUserId,
}: FamilyMembersProps) {
  const owner = members.find((m) => m.role === "owner");
  const regularMembers = members.filter((m) => m.role !== "owner");

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div>
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </h3>
        <Card>
          <CardContent className="p-2">
            {owner && (
              <MemberRow member={owner} isCurrentUser={owner.userId === currentUserId} />
            )}
            {regularMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.userId === currentUserId}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="font-heading text-sm font-semibold text-foreground mb-3">
            {pendingInvites.length} pending invite
            {pendingInvites.length !== 1 ? "s" : ""}
          </h3>
          <Card>
            <CardContent className="p-2">
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 py-3"
                >
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {inv.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Invited {formatDate(inv.createdAt)} · Expires{" "}
                      {formatDate(inv.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    Pending
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/app/family/${familyId}/invite`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Invite member
          </Button>
        </Link>
        <Button variant="outline" className="flex-1 gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Button>
      </div>
    </div>
  );
}

export type { FamilyMember, PendingInvite };
