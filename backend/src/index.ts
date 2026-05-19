import { env } from "./config/env.js";
import "./services/mail-service/emailWorker.js";
import { startHousemateWorkers } from "./services/jobs/index.js";
import server from "./server.js";

const port = env.port || 3000;

await startHousemateWorkers();

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
