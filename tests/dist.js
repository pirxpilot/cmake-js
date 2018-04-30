"use strict";

let fs = require("fs-extra");
let Dist = require("..").Dist;
let environment = require("../lib/environment");

let assert = require("assert");

let itDownload = process.env.TEST_DOWNLOAD === "1" ? it : it.skip;

function testDownload() {
    let dist = new Dist({ noLog: true });

    return fs.remove(dist.internalPath)
        .then(() => assert(!dist.downloaded, "dist should not be downloaded on init"))
        .then(() => dist.ensureDownloaded())
        .then(() => assert(dist.downloaded, "dist should be downloaded after download"));
}

describe("dist", function () {
    this.timeout(0);

    describe("linux", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = true;
            environment.isWin = false;
        });

        after(function() {
            Object.assign(environment, this.environment);
        });


        itDownload("should download dist files if needed", testDownload);

    });

    describe("nw", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = true;
            environment.isWin = false;
            environment.runtime = "nw";
            environment.runtimeVersion = "0.13.2";
        });

        after(function() {
            Object.assign(environment, this.environment);
        });


        itDownload("should download dist files if needed", testDownload);

    });

    describe("electron", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = true;
            environment.isWin = false;
            environment.runtime = "electron";
            environment.runtimeVersion = "0.37.3";
        });

        after(function() {
            Object.assign(environment, this.environment);
        });


        itDownload("should download dist files if needed", testDownload);

    });

    describe("windows", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = false;
            environment.isWin = true;
        });

        after(function() {
            Object.assign(environment, this.environment);
        });


        itDownload("should download dist files if needed", testDownload);

    });
});
