const crypto = require("crypto");
const request = require("hyperdirect")(3); // at most 3 redirects
const MemoryStream = require("memory-stream");
const zlib = require("zlib");
const tar = require("tar");
const fs = require("fs");
const CMLog = require("./cmLog");

function testSum(url, sum, options) {
    if (options.hash && sum && options.sum && options.sum !== sum) {
        throw new Error(`${options.hash.toUpperCase()} sum of download '${url}' mismatch!`);
    }
    return sum;
}

class Downloader {
    constructor(options) {
        this.options = options || {};
        this.log = new CMLog(this.options);
    }

    downloadToStream(url, stream, hash) {
        let log = this.log;
        let shasum = hash ? crypto.createHash(hash) : null;
        let length = 0;
        let done = 0;
        let lastPercent = 0;

        function logPercentage(chunk) {
            if (!length) {
                return;
            }
            done += chunk.length;
            let percent = done / length * 100;
            percent = Math.round(percent / 10) * 10 + 10;
            if (percent > lastPercent) {
                log.verbose("DWNL", `\t${lastPercent}%`);
                lastPercent = percent;
            }
        }

        return new Promise(function (resolve, reject) {
            let r = request(url)
                .on("error", reject)
                .on("response", function(data) {
                    length = parseInt(data.headers["content-length"], 10) || 0;
                });
            if (shasum) {
                r.on("data", chunk => shasum.update(chunk));
            }
            if (log.level === "verbose" || log.level === "silly") {
                r.on("data", logPercentage);
            }
            r.pipe(stream)
                .once("error", reject)
                .once("finish", () => resolve(shasum ? shasum.digest("hex") : undefined));
        });
    }

    downloadString(url) {
        let result = new MemoryStream();
        return this.downloadToStream(url, result)
            .then(() => result.toString());
    }

    downloadFile(url, options) {
        let result = fs.createWriteStream(options.path);
        return this.downloadToStream(url, result, options.hash)
            .then(sum => testSum(url, sum, options));
    }

    downloadTgz(url, options) {
        let gunzip = zlib.createGunzip();
        let extractor = tar.extract(options);
        gunzip.pipe(extractor);
        return this.downloadToStream(url, gunzip, options.hash)
            .then(sum => testSum(url, sum, options));
    }
}

module.exports = Downloader;
