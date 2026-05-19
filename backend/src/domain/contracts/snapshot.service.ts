import type { SnapshotTriggerType } from "@housemate/shared";

/**
 * Cross-module snapshot API. Implemented by absence-snapshot agent only.
 * Other agents call via dependency injection / singleton from snapshots module.
 */
export interface CreateSnapshotParams {
  houseId: string;
  triggerType: SnapshotTriggerType;
  triggerMemberId: string;
  absenceId?: string;
}

export interface ISnapshotService {
  createSnapshot(params: CreateSnapshotParams): Promise<{ snapshotId: string }>;
  createMemberJoinSnapshot(
    houseId: string,
    newMemberId: string
  ): Promise<{ snapshotId: string }>;
}
