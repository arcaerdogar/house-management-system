import { Prisma } from "@prisma/client";

export function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(2);
}
