const IORedis = require("ioredis");
const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enabledReadyCheck: true,
});

redisConnection.on("connect",() => {
    console.log("Redis connection established");
});

redisConnection.on("error",(error)=>{
    console.error("Redis connection error:", error.message);
});

module.exports = redisConnection;
