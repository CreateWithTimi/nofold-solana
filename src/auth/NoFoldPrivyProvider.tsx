import type { ReactNode } from "react";
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";

const appId = import.meta.env.VITE_PRIVY_APP_ID?.trim();
export const isPrivyConfigured = Boolean(appId);

const config: PrivyClientConfig = {
  loginMethods: ["email", "google"],
  embeddedWallets: {
    ethereum: { createOnLogin: "off" },
    solana: { createOnLogin: "all-users" },
  },
};

export function NoFoldPrivyProvider({ children }: { children: ReactNode }) {
  // Guest gameplay must render even when authentication is not configured.
  // Do not gate children on Privy's ready/authenticated/wallet state.
  if (!appId) return <>{children}</>;

  return (
    <PrivyProvider appId={appId} config={config}>
      {children}
    </PrivyProvider>
  );
}
