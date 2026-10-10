const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");
const submissionQueue = new Queue("code-submission",{
    connection: redisConnection,

    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600,
            count: 1000,
        },

        removeOnFail: {
            age: 86400,
        },
    },
});

module.exports = submissionQueue;