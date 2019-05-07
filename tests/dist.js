const rimraf = require("rimraf");
const { Dist } = require("..");
const environment = require("../lib/environment");

const assert = require("assert");


function testDownload() {
    const dist = new Dist({ noLog: true });

    rimraf.sync(dist.internalPath);
    assert(!dist.downloaded, "dist should not be downloaded on init");

    return dist.ensureDownloaded()
        .then(() => assert(dist.downloaded, "dist should be downloaded after download"));
}

const describeSkip = process.env.TEST_DOWNLOAD === "1" ? describe : describe.skip;

describeSkip("dist", function () {
    this.timeout(0);

    describe("linux", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = true;
            environment.isWin = false;
        });

        after(function() {
            const { isWin, isLinux } = this.environment;
            Object.assign(environment, { isWin, isLinux });
        });


        it("should download dist files if needed", testDownload);

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
            const { isWin, isLinux, runtime, runtimeVersion } = this.environment;
            Object.assign(environment, { isWin, isLinux, runtime, runtimeVersion });
        });


        it("should download dist files if needed", testDownload);

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
            const { isWin, isLinux, runtime, runtimeVersion } = this.environment;
            Object.assign(environment, { isWin, isLinux, runtime, runtimeVersion });
        });


        it("should download dist files if needed", testDownload);

    });

    describe("windows", function() {

        before(function() {
            this.environment = Object.assign({}, environment);
            environment.isLinux = false;
            environment.isWin = true;
        });

        after(function() {
            const { isWin, isLinux } = this.environment;
            Object.assign(environment, { isWin, isLinux });
        });


        it("should download dist files if needed", testDownload);

    });
});
