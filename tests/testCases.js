"use strict";
let assert = require("assert");
let lib = require("..");
let BuildSystem = lib.BuildSystem;
let _ = require("lodash");
let path = require("path");
let fs = require("fs");

let testCases = {
    buildPrototypeWithDirectoryOption: function(options) {
        options = _.extend({
            noLog: true,
            directory: path.resolve(path.join(__dirname, "./prototype"))
        }, options);
        let buildSystem = new BuildSystem(options);
        return buildSystem.rebuild().then(function() {
            assert.ok(fs.statSync(path.join(__dirname, "prototype/build/Release/addon.node")).isFile());
        });
    },
    buildPrototype2WithCWD: function(options) {
        process.chdir(path.resolve(path.join(__dirname, "./prototype2")));
        let buildSystem = new BuildSystem(options);
        return buildSystem.rebuild().then(function() {
            assert.ok(fs.statSync(path.join(__dirname, "prototype2/build/Release/addon2.node")).isFile());
        });
    },
    shouldConfigurePreC11Properly: function(options) {
        options = _.extend({
            directory: path.resolve(path.join(__dirname, "./prototype")),
            std: "c++98"
        }, options);
        let buildSystem = new BuildSystem(options);
        if (!/visual studio/i.test(buildSystem.toolset.generator)) {

            buildSystem.getConfigureCommand().then(function(command) {
                assert.equal(command.indexOf("-std=c++11"), -1, "c++11 still forced");
            });
        }
    },
    configureWithCustomOptions: function(options) {
        options = _.extend({
            directory: path.resolve(path.join(__dirname, "./prototype")),
            cMakeOptions: {
                foo: "bar"
            }
        }, options);
        let buildSystem = new BuildSystem(options);

        return buildSystem.getConfigureCommand().then(function(command) {
            assert.notEqual(command.indexOf("-Dfoo=\"bar\""), -1, "custom options added");
        });
    }
};

module.exports = testCases;
