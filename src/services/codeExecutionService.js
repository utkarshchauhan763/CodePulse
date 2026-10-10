
const { spawn } = require("child_process");

const DOCKER_IMAGE = "node:22-alpine";

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1 MB
const MAX_TIME_LIMIT = 10000; // 10 seconds

const executeJavaScript = (sourceCode, input = "", timeLimit = 2000) => {
    return new Promise((resolve, reject) => {
        if (typeof sourceCode !== "string") {
            return reject(new Error("Source code must be a string"));
        }

        if (typeof input !== "string") {
            return reject(new Error("Input must be a string"));
        }

        const safeTimeLimit = Math.max(
            100,
            Math.min(Number(timeLimit) || 2000, MAX_TIME_LIMIT)
        );

        const encodedCode = Buffer.from(sourceCode).toString("base64");

        const runnerScript = `
            const fs = require("fs");
            const { spawnSync } = require("child_process");

            fs.writeFileSync(
                "/tmp/main.js",
                Buffer.from(process.env.CODE_B64, "base64")
            );

            const inputData = fs.readFileSync(0, "utf8");

            const result = spawnSync(
                "node",
                ["/tmp/main.js"],
                {
                    input: inputData,
                    encoding: "utf8",
                    timeout: ${safeTimeLimit},
                    maxBuffer: ${MAX_OUTPUT_SIZE}
                }
            );

            if (result.stdout) {
                process.stdout.write(result.stdout);
            }

            if (result.stderr) {
                process.stderr.write(result.stderr);
            }

            if (result.error) {
                console.error(result.error.message);

                process.exitCode =
                    result.error.code === "ETIMEDOUT" ? 124 : 1;
            } else {
                process.exitCode = result.status ?? 1;
            }
        `;

        const args = [
            "run",
            "--rm",
            "-i",
            "--network", "none",
            "--memory", "128m",
            "--memory-swap", "128m",
            "--cpus", "0.5",
            "--pids-limit", "64",
            "--read-only",
            "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "--tmpfs", "/tmp:rw,nosuid,size=16m,mode=1777",
            "--user", "1000:1000",
            "--env", `CODE_B64=${encodedCode}`,
            DOCKER_IMAGE,
            "node",
            "-e",
            runnerScript
        ];

        const startedAt = Date.now();

        let settled = false;
        let stdout = "";
        let stderr = "";
        let killTimer;

        const finish = (callback, value) => {
            if (settled) return;

            settled = true;
            clearTimeout(killTimer);
            callback(value);
        };

        const container = spawn("docker", args, {
            windowsHide: true,
            stdio: ["pipe", "pipe", "pipe"]
        });

        const stopExecution = (message) => {
            container.kill();
            finish(reject, new Error(message));
        };

        killTimer = setTimeout(() => {
            stopExecution("Execution timed out");
        }, safeTimeLimit + 30000);

        container.stdout.on("data", (chunk) => {
            if (settled) return;

            stdout += chunk.toString();

            if (Buffer.byteLength(stdout, "utf8") > MAX_OUTPUT_SIZE) {
                stopExecution("Output limit exceeded");
            }
        });

        container.stderr.on("data", (chunk) => {
            if (settled) return;

            stderr += chunk.toString();

            if (Buffer.byteLength(stderr, "utf8") > MAX_OUTPUT_SIZE) {
                stopExecution("Error output limit exceeded");
            }
        });

        container.on("error", (error) => {
            finish(reject, error);
        });

        container.on("close", (exitCode, signal) => {
            if (settled) return;

            const executionTime = Date.now() - startedAt;

            if (exitCode === 124) {
                return finish(
                    reject,
                    new Error("Execution timed out")
                );
            }

            if (exitCode !== 0) {
                return finish(
                    reject,
                    new Error(
                        stderr.trim() ||
                        `Container exited with code ${exitCode}`
                    )
                );
            }

            finish(resolve, {
                stdout,
                stderr,
                executionTime,
                exitCode,
                signal
            });
        });

        container.stdin.on("error", () => {
            // The container may close stdin before all input is written.
        });

        container.stdin.end(input);
    });
};

module.exports = { executeJavaScript };
