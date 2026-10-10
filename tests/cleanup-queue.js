
require("dotenv").config();

const submissionQueue = require("../src/queues/submissionQueue");

async function cleanup() {
  try {
    const job = await submissionQueue.getJob("1");

    if (job && job.data.submissionId === "test-123") {
      await job.remove();
      console.log("Temporary test job removed.");
    } else {
      console.log("No matching temporary test job found.");
    }
  } catch (error) {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await submissionQueue.close();
  }
}

cleanup();
