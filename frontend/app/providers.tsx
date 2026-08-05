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
          position="top-center"
          theme="dark"
          richColors
          closeButton
          offset={72}
          toastOptions={{
            className: "genresolve-toast",
            style: {
              background: "rgba(20, 28, 24, 0.96)",
              border: "1px solid var(--hairline)",
              color: "var(--text)",
              borderRadius: "4px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
            },
          }}
        />
      </WalletProvider>
    </QueryClientProvider>
  );
}
