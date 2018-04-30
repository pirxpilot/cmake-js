"use strict";

let lib = require("..");
let environment = lib.environment;
let _ = require("lodash");
let log = require("npmlog");
let util = require("util");

function* generateRuntimeOptions() {
    function* generateForNode(arch) {
        // Old:
        yield {
            runtime: "node",
            runtimeVersion: "0.10.36",
            arch: arch
        };

        // LTS:
        yield {
            runtime: "node",
            runtimeVersion: "4.4.2",
            arch: arch
        };

        // Current:
        if (environment.runtimeVersion !== "5.10.0") {
            yield {
                runtime: "node",
                runtimeVersion: "5.10.0",
                arch: arch
            };
        }
    }

    function* generateForNWJS(arch) {
        yield {
            runtime: "nw",
            runtimeVersion: "0.13.2",
            arch: arch
        };

        // Latest:
        yield {
            runtime: "nw",
            runtimeVersion: "0.30.5",
            arch: arch
        };
    }

    function* generateForElectron(arch) {
        // Latest:
        yield {
            runtime: "electron",
            runtimeVersion: "0.37.3",
            arch: arch
        };
    }

    function* generateForArch(arch) {
        yield* generateForNode(arch);
        yield* generateForNWJS(arch);
        yield* generateForElectron(arch);
    }

    if (environment.isWin) {
        yield* generateForArch("x64");
        yield* generateForArch("ia32");
    }
    else {
        yield* generateForArch();
    }

    // Actual:
    yield {};
}

function* generateOptions() {
    for (let runtimeOptions of generateRuntimeOptions()) {
        if (environment.isWin) {
            // V C++:
            yield runtimeOptions;
        }
        else {
            // Clang, Make
            yield _.extend({}, runtimeOptions, {preferClang: true, referMake: true});

            // Clang, Ninja
            yield _.extend({}, runtimeOptions, {preferClang: true});

            // g++, Make
            yield _.extend({}, runtimeOptions, {preferGnu: true, referMake: true});

            // g++, Ninja
            yield _.extend({}, runtimeOptions, {preferGnu: true});

            // Default:
            yield runtimeOptions;
        }
    }
}


function it_testCase(testCase, options) {
    let optionsStr = util.inspect(options, { breakLength: Infinity });
    it("should build with: " + optionsStr, function() {
        log.info("TEST", "Running case for options of: " + optionsStr);
        return testCase(options);
    });
}

let testRunner = {
    runCase: function (testCase, options) {
        beforeEach(function() {
            this.cwd = process.cwd();
        });
        afterEach(function() {
            process.chdir(this.cwd);
        });
        for (let testOptions of generateOptions()) {
            it_testCase(testCase, _.extend({}, testOptions, options || {}));
        }
    }
};

module.exports = testRunner;
