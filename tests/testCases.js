const assert = require("assert");
const { BuildSystem } = require("..");
const { join, resolve } = require("path");
const { statSync } = require("fs");

module.exports = {
    buildPrototypeWithDirectoryOption(options = {}) {
        const buildSystem = new BuildSystem({
            noLog: true,
            directory: resolve(join(__dirname, "./prototype")),
            runtime: 'node',
            runtimeVersion: '10.15.3',
            ...options
        });
        return buildSystem.rebuild().then(function() {
            assert.ok(statSync(join(__dirname, "prototype/build/Release/addon.node")).isFile());
        });
    },
    buildPrototype2WithCWD(options = {}) {
        process.chdir(resolve(join(__dirname, "./prototype2")));
        let buildSystem = new BuildSystem({
            runtime: 'node',
            runtimeVersion: '10.15.3',
            ...options
        });
        return buildSystem.rebuild().then(function() {
            assert.ok(statSync(join(__dirname, "prototype2/build/Release/addon2.node")).isFile());
        });
    },
    shouldConfigurePreC11Properly(options = {}) {
        let buildSystem = new BuildSystem({
            directory: resolve(join(__dirname, "./prototype")),
            std: "c++98",
            ...options
        });
        if (!/visual studio/i.test(buildSystem.toolset.generator)) {

            buildSystem.getConfigureCommand().then(function(command) {
                assert.equal(command.indexOf("-std=c++11"), -1, "c++11 still forced");
            });
        }
    },
    configureWithCustomOptions(options = {}) {
        let buildSystem = new BuildSystem({
            directory: resolve(join(__dirname, "./prototype")),
            cMakeOptions: { foo: "bar" },
            ...options
        });

        return buildSystem.getConfigureCommand().then(function(command) {
            assert.notEqual(command.indexOf("-Dfoo=\"bar\""), -1, "custom options added");
        });
    }
};
