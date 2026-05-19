import {
  housemateQueue,
  type RotationalTurnNotifyJobData,
} from "../../services/jobs/index.js";

export async function enqueueRotationalTurnNotify(
  payload: RotationalTurnNotifyJobData
): Promise<void> {
  await housemateQueue.add("rotational:turn-notify", payload);
}
