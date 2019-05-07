const splitargs = require("splitargs");
const { execSync, spawnSync } = require("child_process");

module.exports = {
    run(command, { silent = false } = {}) {
        const args = splitargs(command);
        const name = args.shift();
        const child = spawnSync(name, args, { stdio: silent ? "ignore" : "inherit" });
        if (child.error) {
            throw child.error;
        }
        if (child.status !== 0) {
            throw new Error(`Process terminated: ${child.status  || child.signal}`);
        }
    },
    exec(command) {
        return execSync(command, { encoding: "utf8" });
    }
};
