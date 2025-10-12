"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ActivityProvider } from "@/components/activity/activity-provider";
import { ActivityToaster } from "@/components/activity/activity-toaster";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ActivityProvider>
          {children}
          <ActivityToaster />
          <Toaster />
        </ActivityProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
