import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "No email";

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-serif mb-6" style={{ color: 'var(--color-primary)' }}>My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input defaultValue={user?.firstName || ""} placeholder="Your name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={email} disabled />
          </div>
          <Button className="bg-[#C4704A] hover:bg-[#a85d3c]">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
