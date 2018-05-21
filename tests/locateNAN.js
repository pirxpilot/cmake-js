"use strict";

let locateIncludes = require("..").locateNAN;
let path = require("path");
let assert = require("assert");

/*

Dependency tree for the test

fixtures/project
    dep1
        dep3
    @scope/dep2

*/

describe("locateIncludes", function () {
    const PROJECT_DIR = path.resolve(__dirname, "fixtures", "project");
    const NAN_DIR = path.join(PROJECT_DIR, "node_modules", "nan");
    const NAPI_DIR = path.join(PROJECT_DIR, "node_modules", "node-addon-api");

    it("should locate NAN from dependency", function () {
        let dir = path.join(PROJECT_DIR, "node_modules", "dep-1");
        let nan = locateIncludes(dir, "nan", "nan.h");
        assert.equal(nan, NAN_DIR);
    });

    it("should locate NAN from nested dependency", function () {
        let dir = path.join(PROJECT_DIR, "node_modules", "dep-1", "node_modules", "dep-3");
        let nan = locateIncludes(dir, "nan", "nan.h");
        assert.equal(nan, NAN_DIR);
    });

    it("should locate N-API from nested dependency", function () {
        let dir = path.join(PROJECT_DIR, "node_modules", "dep-1", "node_modules", "dep-3");
        let nan = locateIncludes(dir, "node-addon-api", "napi.h");
        assert.equal(nan, NAPI_DIR);
    });

    it("should locate NAN from scoped dependency", function () {
        let dir = path.join(PROJECT_DIR, "node_modules", "@scope", "dep-2");
        let nan = locateIncludes(dir, "nan", "nan.h");
        assert.equal(nan, NAN_DIR);
    });
});
