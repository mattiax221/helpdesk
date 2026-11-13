import { prisma } from "@/lib/prisma";

export type GoogleAccountTokens = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
  emailHint?: string | null;
};

export async function getGoogleAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
}

export function hasGmailSendScope(scope: string | null | undefined): boolean {
  if (!scope) return false;
  return (
    scope.includes("https://www.googleapis.com/auth/gmail.send") ||
    scope.includes("https://mail.google.com/")
  );
}

/** Refresh Google access_token if expired. Tokens stay server-side only. */
export async function getFreshGoogleAccessToken(
  userId: string,
): Promise<{ accessToken: string; account: GoogleAccountTokens } | null> {
  const account = await getGoogleAccount(userId);
  if (!account) return null;

  const stillValid =
    account.access_token &&
    account.expires_at &&
    account.expires_at * 1000 > Date.now() + 60_000;

  if (stillValid && account.access_token) {
    return {
      accessToken: account.access_token,
      account: {
        id: account.id,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        scope: account.scope,
      },
    };
  }

  if (!account.refresh_token) {
    if (account.access_token) {
      return {
        accessToken: account.access_token,
        account: {
          id: account.id,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          scope: account.scope,
        },
      };
    }
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Google token refresh failed", res.status, text.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
  };

  const expiresAt = data.expires_in
    ? Math.floor(Date.now() / 1000) + data.expires_in
    : null;

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: expiresAt ?? undefined,
      scope: data.scope || account.scope,
    },
  });

  return {
    accessToken: data.access_token,
    account: {
      id: account.id,
      access_token: data.access_token,
      refresh_token: account.refresh_token,
      expires_at: expiresAt,
      scope: data.scope || account.scope,
    },
  };
}

export async function fetchGoogleProfileEmail(accessToken: string): Promise<string | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email?.toLowerCase() || null;
}
