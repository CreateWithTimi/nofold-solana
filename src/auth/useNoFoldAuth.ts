import { useState } from "react";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

// Privy identity is diagnostic-only in M01.1. Never write it into guest storage,
// room membership, or the Supabase client.
export function useNoFoldAuth() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { login } = useLogin({
    onComplete: () => setError(""),
    onError: () => setError("Sign-in was not completed. You can try again; guest play is still available."),
  });

  const signedIn = ready && authenticated;
  const embeddedWallet = signedIn
    ? user?.linkedAccounts.find(
        (account) =>
          account.type === "wallet" &&
          account.chainType === "solana" &&
          (account.walletClientType === "privy" || account.walletClientType === "privy-v2"),
      )
    : undefined;
  const solanaAddress = embeddedWallet?.type === "wallet" ? embeddedWallet.address : null;
  const walletConnected = Boolean(
    signedIn && walletsReady && solanaAddress && wallets.some((wallet) => wallet.address === solanaAddress),
  );

  function signIn() {
    if (!ready || signedIn || isLoggingOut) return;
    setError("");
    // The modal flow triggers createOnLogin for both email and Google.
    login();
  }

  async function signOut() {
    if (!ready || !signedIn || isLoggingOut) return;
    setError("");
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return {
    ready,
    authenticated: signedIn,
    userId: signedIn ? user?.id ?? null : null,
    solanaAddress,
    walletsReady,
    walletConnected,
    error,
    isLoggingOut,
    signIn,
    signOut,
  };
}
