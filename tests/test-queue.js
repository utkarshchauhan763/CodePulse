
require("dotenv").config();

const submissionQueue = require("../src/queues/submissionQueue");

async function testQueue() {
  try {
    const job = await submissionQueue.add("test-submission", {
      submissionId: "test-123",
      language: "javascript",
    });

    console.log("Job added successfully:", job.id);

    const jobCounts = await submissionQueue.getJobCounts("waiting");

    console.log("Waiting jobs:", jobCounts.waiting);
  } catch (error) {
    console.error("Queue test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await submissionQueue.close();
  }
}

testQueue();
