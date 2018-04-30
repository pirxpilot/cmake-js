"use strict";

let assert = require("assert");
let lib = require("..");
let CMake = lib.CMake;
let _ = require("lodash");
let path = require("path");
let log = require("npmlog");
let testRunner = require("./testRunner");
let testCases = require("./testCases");

describe("BuildSystem", function () {
    this.timeout(0);

    before(function() {
        if (process.env.UT_LOG_LEVEL) {
            log.level = process.env.UT_LOG_LEVEL;
            log.resume();
        }
        lib.locateNAN.__projectRoot = path.resolve(path.join(__dirname, ".."));
    });

    after(function() {
        lib.locateNAN.__projectRoot = undefined;
    });

    describe("Build with various options", function() {
        testRunner.runCase(testCases.buildPrototypeWithDirectoryOption);
    });

    it("should provide list of generators", function () {
        let gens = CMake.getGenerators();
        assert(_.isArray(gens));
        assert(gens.length > 0);
        assert.equal(gens.filter(function (g) { return g.length; }).length, gens.length);
    });

    it("should rebuild prototype if cwd is the source directory", function () {
        return testCases.buildPrototype2WithCWD({ noLog: true });
    });

    it("should run with old GNU compilers", function () {
        return testCases.shouldConfigurePreC11Properly({ noLog: true });
    });

    it("should configure with custom option", function () {
        return testCases.configureWithCustomOptions({ noLog: true });
    });
});
