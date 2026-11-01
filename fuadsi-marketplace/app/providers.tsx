"use client";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { FavouritesProvider } from "@/components/providers/FavouritesProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <RealtimeProvider>
          <FavouritesProvider>{children}</FavouritesProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
