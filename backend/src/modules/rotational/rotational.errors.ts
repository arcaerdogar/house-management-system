import type { RotationalExpenseType } from "@housemate/shared";

export const ROTATIONAL_QUEUE_MISMATCH_CODE = "ROTATIONAL_QUEUE_MISMATCH";

export class RotationalQueueMismatchError extends Error {
  readonly code = ROTATIONAL_QUEUE_MISMATCH_CODE;
  readonly allowOverride = true as const;

  constructor(
    message: string,
    public readonly expectedMemberId: string,
    public readonly nextInQueue: NonNullable<RotationalExpenseType["nextInQueue"]>
  ) {
    super(message);
    this.name = "RotationalQueueMismatchError";
  }
}

export function isRotationalQueueMismatchError(
  error: unknown
): error is RotationalQueueMismatchError {
  return error instanceof RotationalQueueMismatchError;
}
