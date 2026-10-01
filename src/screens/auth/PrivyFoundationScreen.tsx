import { Link } from "react-router";
import { isPrivyConfigured } from "../../auth/NoFoldPrivyProvider";
import { useNoFoldAuth } from "../../auth/useNoFoldAuth";
import { Panel } from "../../components/cards/Panel";
import { PrimaryButton, SecondaryButton } from "../../components/game/Buttons";

export function PrivyFoundationScreen() {
  return (
    <Panel title="Privy foundation test">
      <p>M01.1 diagnostic. Signing in is optional and does not save or change your NO FOLD player.</p>
      {isPrivyConfigured ? (
        <AuthDiagnostic />
      ) : (
        <p role="status">Authentication is not configured. Set VITE_PRIVY_APP_ID and restart Vite. Guest play is available.</p>
      )}
      <Link to="/">Back to NO FOLD →</Link>
    </Panel>
  );
}

// Mount SDK hooks only when the provider is configured.
function AuthDiagnostic() {
  const auth = useNoFoldAuth();
  const walletStatus = !auth.authenticated
    ? "Sign in to check provisioning"
    : auth.solanaAddress
      ? "Provisioned"
      : !auth.walletsReady
        ? "Loading / provisioning"
        : "No embedded Solana wallet available";

  return (
    <>
      <dl aria-live="polite">
        <dt>Privy SDK</dt>
        <dd>{auth.ready ? "Ready" : "Initializing"}</dd>
        <dt>Authentication</dt>
        <dd>{!auth.ready ? "Checking session" : auth.authenticated ? "Signed in" : "Guest / signed out"}</dd>
        <dt>Privy user ID</dt>
        <dd style={{ overflowWrap: "anywhere" }}>{auth.userId ?? "—"}</dd>
        <dt>Embedded Solana wallet</dt>
        <dd>{walletStatus}</dd>
        <dt>Solana address</dt>
        <dd style={{ overflowWrap: "anywhere" }}><code>{auth.solanaAddress ?? "—"}</code></dd>
        <dt>Wallet connection</dt>
        <dd>{!auth.authenticated ? "—" : !auth.walletsReady ? "Loading" : auth.walletConnected ? "Ready" : "Not connected"}</dd>
      </dl>
      {auth.authenticated && auth.walletsReady && !auth.solanaAddress ? (
        <p>Authentication succeeded, but wallet provisioning is not confirmed. If this persists, sign out and sign in again to retry the automatic flow.</p>
      ) : null}
      {auth.error ? <p role="alert">{auth.error}</p> : null}
      <div className="action-row">
        {auth.authenticated ? (
          <SecondaryButton disabled={auth.isLoggingOut} onClick={() => void auth.signOut()}>
            {auth.isLoggingOut ? "Signing out…" : "Sign out"}
          </SecondaryButton>
        ) : (
          <PrimaryButton disabled={!auth.ready || auth.isLoggingOut} onClick={auth.signIn}>
            Sign in with email or Google
          </PrimaryButton>
        )}
      </div>
    </>
  );
}
