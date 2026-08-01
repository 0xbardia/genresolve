"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "rgba(14, 16, 24, 0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f3f4f8",
              backdropFilter: "blur(12px)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            },
          }}
        />
      </WalletProvider>
    </QueryClientProvider>
  );
}
