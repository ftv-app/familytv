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
    <div className="container max-w-2xl py-6 sm:py-8 px-4">
      <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-primary mb-6">My Profile</h1>
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
          <Button className="w-full sm:w-auto">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
