"use strict";
let environment = require("./environment");
let path = require("path");
let urljoin = require("url-join");
let fs = require("fs-extra");
let CMLog = require("./cmLog");
let TargetOptions = require("./targetOptions");
let runtimePaths = require("./runtimePaths");
let Downloader = require("./downloader");

function testSum(sums, sum, fPath) {
    if (!Array.isArray(sums)) {
        return;
    }
    let serverSum = sums.find(s => s.getPath === fPath);
    if (serverSum && serverSum.sum === sum) {
        return;
    }
    throw new Error("SHA sum of file '" + fPath + "' mismatch!");
}

function Dist(options) {
    this.options = options || {};
    this.log = new CMLog(this.options);
    this.targetOptions = new TargetOptions(this.options);
    this.downloader = new Downloader(this.options);
}

// Props
Object.defineProperties(Dist.prototype, {
    internalPath: {
        get: function () {
            return path.join(
                environment.home,
                ".cmake-js",
                (this.targetOptions.runtime) + "-" + this.targetOptions.arch,
                "v" + this.targetOptions.runtimeVersion);
        }
    },
    externalPath: {
        get: function () {
            return runtimePaths.get(this.targetOptions).externalPath;
        }
    },
    downloaded: {
        get: function () {
            let headers = false;
            let libs = true;
            let stat = getStat(this.internalPath);
            if (stat.isDirectory()) {
                if (this.headerOnly) {
                    stat = getStat(path.join(this.internalPath, "include/node/node.h"));
                    headers = stat.isFile();
                }
                else {
                    stat = getStat(path.join(this.internalPath, "src/node.h"));
                    if (stat.isFile()) {
                        stat = getStat(path.join(this.internalPath, "deps/v8/include/v8.h"));
                        headers = stat.isFile();
                    }
                }
                if (environment.isWin) {
                    for (let libPath of this.winLibs) {
                        stat = getStat(libPath);
                        libs = libs && stat.isFile();
                    }
                }
            }
            return headers && libs;

            function getStat(path) {
                try {
                    return fs.statSync(path);
                }
                catch (e) {
                    return {
                        isFile: () => false,
                        isDirectory: () => false
                    };
                }
            }
        }
    },
    winLibs: {
        get: function () {
            let libs = runtimePaths.get(this.targetOptions).winLibs;
            return libs.map(({ dir, name }) => path.join(this.internalPath, dir, name));
        }
    },
    headerOnly: {
        get: function () {
            return runtimePaths.get(this.targetOptions).headerOnly;
        }
    }
});

// Methods
Dist.prototype.ensureDownloaded = function() {
    return this.downloaded ? Promise.resolve() : this.download();
};

Dist.prototype.download = function () {
    this.log.info("DIST", "Downloading distribution files.");
    return fs.ensureDir(this.internalPath)
        .then(() => this._downloadShaSums())
        .then(sums => Promise.all([this._downloadLibs(sums), this._downloadTar(sums)]));
};

Dist.prototype._downloadShaSums = function () {
    if (this.targetOptions.runtime !== "node" && this.targetOptions.runtime !== "iojs") {
        return Promise.resolve();
    }

    let sumUrl = urljoin(this.externalPath, "SHASUMS256.txt");
    this.log.http("DIST", "\t- " + sumUrl);
    return this.downloader.downloadString(sumUrl).then(function(str) {
        return str.split("\n")
            .map(function (line) {
                let [sum, getPath] = line.split(/\s+/);
                return { sum, getPath };
            })
            .filter(({ getPath, sum }) => getPath && sum);
    });
};

Dist.prototype._downloadTar = function (sums) {
    let self = this;
    let tarLocalPath = runtimePaths.get(self.targetOptions).tarPath;
    let tarUrl = urljoin(self.externalPath, tarLocalPath);
    let hash = sums ? "sha256" : null;

    self.log.http("DIST", "\t- " + tarUrl);

    function filter(entryPath) {
        if (entryPath === self.internalPath) {
            return true;
        }
        let ext = path.extname(entryPath);
        return ext && ext.toLowerCase() === ".h";
    }

    return this.downloader.downloadTgz(tarUrl, {
        hash,
        cwd: self.internalPath,
        strip: 1,
        filter
    }).then(sum => testSum(sums, sum, tarLocalPath));
};

Dist.prototype._downloadLibs = function (sums) {
    if (!environment.isWin) {
        return Promise.resolve();
    }

    let self = this;
    let hash = sums ? "sha256" : null;

    function download({ dir, name }) {
        let fPath = dir ? urljoin(dir, name) : name;
        let libUrl = urljoin(self.externalPath, fPath);
        let internalPath = path.join(self.internalPath, fPath);

        self.log.http("DIST", "\t- " + libUrl);

        return fs.ensureDir(path.join(self.internalPath, dir))
            .then(() => self.downloader.downloadFile(libUrl, { path: internalPath, hash }))
            .then(sum => testSum(sums, sum, fPath));
    }

    let downloads = runtimePaths.get(self.targetOptions).winLibs.map(download);
    return Promise.all(downloads);
};

module.exports = Dist;
