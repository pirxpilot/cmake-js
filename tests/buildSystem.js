const assert = require("assert");
const { CMake } = require("..");
const log = require("npmlog");
const testRunner = require("./testRunner");
const testCases = require("./testCases");

describe("BuildSystem", function () {
    this.timeout(0);

    before(function() {
        if (process.env.UT_LOG_LEVEL) {
            log.level = process.env.UT_LOG_LEVEL;
            log.resume();
        }
    });

    describe("Build with various options", function() {
        testRunner.runCase(testCases.buildPrototypeWithDirectoryOption);
    });

    it("should provide list of generators", function () {
        let gens = CMake.getGenerators();
        assert(Array.isArray(gens));
        assert(gens.length > 0);
        assert.equal(gens.filter(g => g.length).length, gens.length);
    });

    it("should rebuild prototype if cwd is the source directory", function () {
        return testCases.buildPrototype2WithCWD({ silent: true });
    });

    it("should run with old GNU compilers", function () {
        return testCases.shouldConfigurePreC11Properly();
    });

    it("should configure with custom option", function () {
        return testCases.configureWithCustomOptions();
    });
});
