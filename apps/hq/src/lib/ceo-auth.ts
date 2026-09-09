import { cookies } from "next/headers";
import crypto from "crypto";

const CEO_SESSION_COOKIE_NAME = "ceo_portal_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

/**
 * Verify CEO credentials against environment variables.
 * Returns true if credentials match; false otherwise.
 */
function validateCredentials(
  username: string,
  password: string,
): boolean {
  const expectedUsername = process.env.CEO_PORTAL_USERNAME;
  const expectedPassword = process.env.CEO_PORTAL_PASSWORD;

  // Fail closed: if environment variables are not set, deny access.
  if (!expectedUsername || !expectedPassword) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks.
  const userBuffer = Buffer.from(username);
  const expectedUserBuffer = Buffer.from(expectedUsername);
  const passBuffer = Buffer.from(password);
  const expectedPassBuffer = Buffer.from(expectedPassword);

  if (
    userBuffer.length !== expectedUserBuffer.length ||
    passBuffer.length !== expectedPassBuffer.length
  ) {
    return false;
  }

  const userMatch = crypto.timingSafeEqual(userBuffer, expectedUserBuffer);
  const passMatch = crypto.timingSafeEqual(passBuffer, expectedPassBuffer);

  return userMatch && passMatch;
}

/**
 * Create a signed HMAC session token and set it as an HTTP-only cookie.
 */
export async function createCEOSession(
  username: string,
  password: string,
): Promise<boolean> {
  if (!validateCredentials(username, password)) {
    return false;
  }

  const secret = process.env.CEO_PORTAL_SESSION_SECRET;
  if (!secret) {
    // Fail closed: session secret must be configured.
    return false;
  }

  // Token = random value + ":" + HMAC signature
  const randomValue = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(randomValue)
    .digest("hex");
  const sessionToken = `${randomValue}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(CEO_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return true;
}

/**
 * Verify that the session cookie exists AND its HMAC signature is valid.
 */
export async function verifyCEOSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CEO_SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return false;

  const secret = process.env.CEO_PORTAL_SESSION_SECRET;
  if (!secret) return false;

  const [randomValue, signature] = sessionToken.split(".");
  if (!randomValue || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(randomValue)
    .digest("hex");

  // Constant-time comparison
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Clear CEO session cookie.
 */
export async function clearCEOSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CEO_SESSION_COOKIE_NAME);
}

/**
 * Server-side helper to require CEO auth; throws if no valid session.
 */
export async function requireCEOAuth(): Promise<void> {
  const hasSession = await verifyCEOSession();
  if (!hasSession) {
    throw new Error("Unauthorized: CEO session required");
  }
}