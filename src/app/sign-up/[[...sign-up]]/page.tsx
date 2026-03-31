"use client";

import { SignUp } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Create a FamilyTV account">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-foreground font-heading font-bold text-lg">
                  F
                </span>
              </div>
              <span className="font-heading text-xl font-semibold text-foreground">
                FamilyTV
              </span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Join your family on FamilyTV
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              The private place for your closest people
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4" aria-label="Create a FamilyTV account">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <span className="text-primary-foreground font-heading font-bold text-lg">
                F
              </span>
            </div>
            <span className="font-heading text-xl font-semibold text-foreground">
              FamilyTV
            </span>
          </div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Join your family on FamilyTV
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            The private place for your closest people
          </p>
        </div>

        <div aria-label="Sign up form">
          <SignUp fallbackRedirectUrl="/app" />
        </div>

        <p className="text-center text-base text-muted-foreground mt-6 leading-relaxed">
          No ads, no algorithms — just your family, sharing what matters.
        </p>
      </div>
    </main>
  );
}
