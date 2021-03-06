let CMake = require("./cMake");
let Dist = require("./dist");
let CMLog = require("./cmLog");
let appCMakeJSConfig = require("./appCMakeJSConfig");
let path = require("path");
let Toolset = require("./toolset");

class BuildSystem {
    constructor(options = {}) {
        this.options = options;
        this.options.directory = path.resolve(this.options.directory || process.cwd());
        this.log = new CMLog(this.options);
        let appConfig = appCMakeJSConfig(this.options.directory, this.log);
        if (appConfig && Object.keys(appConfig).length) {
            this.log.verbose("CFG", "Applying CMake.js config from root package.json:");
            this.log.verbose("CFG", JSON.stringify(appConfig));
            // Applying applications's config, if there is no explicit runtime related options specified
            this.options.runtime = this.options.runtime || appConfig.runtime;
            this.options.runtimeVersion = this.options.runtimeVersion || appConfig.runtimeVersion;
            this.options.arch = this.options.arch || appConfig.arch;
        }
        this.log.verbose("CFG", "Build system options:");
        this.log.verbose("CFG", JSON.stringify(this.options));
        this.cmake = new CMake(this.options);
        this.dist = new Dist(this.options);
        this.toolset = new Toolset(this.options);
    }

    _ensureInstalled() {
        this.toolset.initialize(true);
        return this.dist.ensureDownloaded();
    }

    _showError(e) {
        if (this.log.level === "verbose" || this.log.level === "silly") {
            this.log.error("OMG", e.stack);
        }
        else {
            this.log.error("OMG", e.message);
        }
    }

    install() {
        return this._ensureInstalled()
            .catch(e => { this._showError(e); throw e; });
    }
}

[
    "getConfigureCommand",
    "configure",
    "getBuildCommand",
    "build",
    "getCleanCommand",
    "clean",
    "reconfigure",
    "rebuild",
    "compile",
].forEach(function (method) {
    BuildSystem.prototype[method] = function() {
        return this._ensureInstalled()
            .then(() => this.cmake[method]())
            .catch(e => { this._showError(e); throw e; });
    };
});


module.exports = BuildSystem;
