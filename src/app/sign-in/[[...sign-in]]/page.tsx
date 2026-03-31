"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-bold text-lg">
                  F
                </span>
              </div>
              <span className="font-heading text-xl font-semibold text-foreground">
                FamilyTV
              </span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your family is waiting for you
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">
                F
              </span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">
              FamilyTV
            </span>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your family is waiting for you
          </p>
        </div>

        <SignIn fallbackRedirectUrl="/app" />

        <p className="text-center text-sm text-muted-foreground mt-6 leading-relaxed">
          Share photos, plan events, and stay connected with the people who matter most.
        </p>
      </div>
    </div>
  );
}
