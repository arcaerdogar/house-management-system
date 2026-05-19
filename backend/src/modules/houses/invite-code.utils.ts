import { randomBytes } from "crypto";
import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";

const INVITE_CODE_LENGTH = 8;
const MAX_ATTEMPTS = 12;

function formatInviteCode(bytes: Buffer): string {
  return bytes.toString("base64url").slice(0, INVITE_CODE_LENGTH).toUpperCase();
}

export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = formatInviteCode(randomBytes(INVITE_CODE_LENGTH));
    const existing = await prisma.house.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  throw HttpError.internal("Failed to generate a unique invite code.");
}
