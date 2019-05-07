const os = require("os");
const isIOJS = require("is-iojs");
const which = require("which");

let environment = module.exports = {
    moduleVersion: require("../package.json").version,
    platform: os.platform(),
    isWin: os.platform() === "win32",
    isLinux: os.platform() === "linux",
    isOSX: os.platform() === "darwin",
    arch: os.arch(),
    isX86: os.arch() === "ia32",
    isX64: os.arch() === "x64",
    isArm: os.arch() === "arm",
    runtime: isIOJS ? "iojs" : "node",
    runtimeVersion: process.versions.node,
    napiVersion: process.versions.napi,
    home: process.env[(os.platform() === "win32") ? "USERPROFILE" : "HOME"],
    EOL: os.EOL,

    get isPosix() {
        return !this.isWin;
    },

    get isNinjaAvailable() {
        if (this._isNinjaAvailable === null) {
            this._isNinjaAvailable = false;
            try {
                if (which.sync("ninja")) {
                    this._isNinjaAvailable = true;
                }
            }
            catch (e) {
            }
        }
        return this._isNinjaAvailable;
    },

    get isMakeAvailable() {
        if (this._isMakeAvailable === null) {
            this._isMakeAvailable = false;
            try {
                if (which.sync("make")) {
                    this._isMakeAvailable = true;
                }
            }
            catch (e) {
            }
        }
        return this._isMakeAvailable;
    },

    get isGPPAvailable() {
        if (this._isGPPAvailable === null) {
            this._isGPPAvailable = false;
            try {
                if (which.sync("g++")) {
                    this._isGPPAvailable = true;
                }
            }
            catch (e) {
            }
        }
        return this._isGPPAvailable;
    },

    get isClangAvailable() {
        if (this._isClangAvailable === null) {
            this._isClangAvailable = false;
            try {
                if (which.sync("clang++")) {
                    this._isClangAvailable = true;
                }
            }
            catch (e) {
            }
        }
        return this._isClangAvailable;
    }
};

Object.defineProperties(environment, {
    _isNinjaAvailable: {
        value: null,
        writable: true
    },
    _isMakeAvailable: {
        value: null,
        writable: true
    },
    _isGPPAvailable: {
        value: null,
        writable: true
    },
    _isClangAvailable: {
        value: null,
        writable: true
    },
});
