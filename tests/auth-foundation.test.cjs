const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function loadAuth({ ready = true, authenticated = true, linkedAccounts = [], wallets = [], logout = async () => {} } = {}) {
  const source = fs.readFileSync(path.join(__dirname, "../src/auth/useNoFoldAuth.ts"), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  let loginCalls = 0;
  const mocks = {
    react: { useState: (initial) => [initial, () => {}] },
    "@privy-io/react-auth": {
      usePrivy: () => ({ ready, authenticated, user: { id: "test-user", linkedAccounts }, logout }),
      useLogin: () => ({ login: () => { loginCalls++; } }),
    },
    "@privy-io/react-auth/solana": { useWallets: () => ({ ready: true, wallets }) },
  };
  // Reject any new dependency on game services or browser storage.
  vm.runInNewContext(js, {
    module,
    exports: module.exports,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected auth dependency: ${name}`);
      return mocks[name];
    },
    window: new Proxy({}, { get: () => { throw new Error("Auth must not access guest browser state"); } }),
  });
  return { auth: module.exports.useNoFoldAuth(), loginCalls: () => loginCalls };
}

for (const walletClientType of ["privy", "privy-v2"]) {
  test(`selects the authenticated ${walletClientType} Solana wallet, not the first connected wallet`, () => {
    const { auth } = loadAuth({
      linkedAccounts: [
        { type: "wallet", chainType: "solana", walletClientType: "phantom", address: "external" },
        { type: "wallet", chainType: "ethereum", walletClientType, address: "evm" },
        { type: "wallet", chainType: "solana", walletClientType, address: "embedded" },
      ],
      wallets: [{ address: "unlinked" }, { address: "embedded" }],
    });
    assert.equal(auth.solanaAddress, "embedded");
    assert.equal(auth.walletConnected, true);
  });
}

test("does not expose stale user or wallet data before readiness or after logout", () => {
  for (const state of [{ ready: false }, { authenticated: false }]) {
    const { auth } = loadAuth({
      ...state,
      linkedAccounts: [{ type: "wallet", chainType: "solana", walletClientType: "privy", address: "stale" }],
      wallets: [{ address: "stale" }],
    });
    assert.equal(auth.userId, null);
    assert.equal(auth.solanaAddress, null);
    assert.equal(auth.walletConnected, false);
  }
});

test("authentication alone does not claim embedded wallet provisioning", () => {
  const { auth } = loadAuth({ wallets: [{ address: "external" }] });
  assert.equal(auth.authenticated, true);
  assert.equal(auth.solanaAddress, null);
  assert.equal(auth.walletConnected, false);
});

test("login is explicit and logout only calls Privy without accessing guest state", async () => {
  const guest = loadAuth({ authenticated: false });
  assert.equal(guest.loginCalls(), 0);
  guest.auth.signIn();
  assert.equal(guest.loginCalls(), 1);
  let logoutCalls = 0;
  const { auth } = loadAuth({ logout: async () => { logoutCalls++; } });
  await auth.signOut();
  assert.equal(logoutCalls, 1);
});
