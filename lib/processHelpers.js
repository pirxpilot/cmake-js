"use strict";
let splitargs = require("splitargs");
let _ = require("lodash");
let childProcess = require("child_process");

let processHelpers = {
    run: function (command, options) {
        options = _.defaults(options, {silent: false});
        let args = splitargs(command);
        let name = args.shift();
        let child = childProcess.spawnSync(name, args, {stdio: options.silent ? "ignore" : "inherit"});
        if (child.error) {
            throw child.error;
        }
        if (child.status !== 0) {
            throw new Error("Process terminated: " + child.status || child.signal);
        }
    },
    exec: function(command) {
        return childProcess.execSync(command, { encoding: "utf8" });
    }
};

module.exports = processHelpers;
