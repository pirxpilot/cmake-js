const which = require("which");
const fs = require("fs");
const path = require("path");
const environment = require("./environment");
const Dist = require("./dist");
const CMLog = require("./cmLog");
const TargetOptions = require("./targetOptions");
const processHelpers = require("./processHelpers");
const locateIncludes = require("./locateNAN");
const npmConfigData = require("rc")("npm");
const Toolset = require("./toolset");

class CMake {
    constructor(options = {}) {
        this.options = options;
        this.log = new CMLog(this.options);
        this.dist = new Dist(this.options);
        this.projectRoot = path.resolve(this.options.directory || process.cwd());
        this.workDir = this.options.out || path.join(this.projectRoot, "build");
        this.config = this.options.debug ? "Debug" : "Release";
        this.buildDir = path.join(this.workDir, this.config);
        this._isAvailable = null;
        this.targetOptions = new TargetOptions(this.options);
        this.toolset = new Toolset(this.options);
        this.cMakeOptions = this.options.cMakeOptions || {};
        this.silent = !!options.silent;
    }

    static isAvailable(options = {}) {
        try {
            if (options.cmakePath) {
                let stat = fs.lstatSync(options.cmakePath);
                return !stat.isDirectory();
            }
            else {
                which.sync("cmake");
                return true;
            }
        }
        catch (e) {
            return false;
        }
    }

    static getGenerators(options) {
        let arch = " [arch]";
        options = options || {};
        let gens = [];
        if (CMake.isAvailable(options)) {
            let stdout = processHelpers.exec(`${options.cmakePath || "cmake"} --help`);
            let hasCr = stdout.includes("\r\n");
            let output = hasCr ? stdout.split("\r\n") : stdout.split("\n");
            let on = false;
            output.forEach(function (line, i) {
                if (on) {
                    let parts = line.split("=");
                    if ((parts.length === 2 && parts[0].trim()) ||
                        (parts.length === 1 && i !== output.length - 1 && output[i + 1].trim()[0] === "=")) {
                        let gen = parts[0].trim();
                        if (gen.endsWith(arch)) {
                            gen = gen.substr(0, gen.length - arch.length);
                        }
                        gens.push(gen);
                    }
                }
                if (line.trim() === "Generators") {
                    on = true;
                }
            });
        }
        return gens;
    }

    getGenerators() {
        return CMake.getGenerators(this.options);
    }

    verifyIfAvailable() {
        if (!this.isAvailable) {
            throw new Error("CMake executable is not found. Please use your system's package manager to install it, or you can get installers from there: http://cmake.org.");
        }
    }

    getConfigureCommand() {
        // Create command:
        let command = this.path;
        command += ` "${this.projectRoot}" --no-warn-unused-cli`;

        let D = [];

        // CMake.js watermark
        D.push({"CMAKE_JS_VERSION": environment.moduleVersion});

        // Build configuration:
        D.push({"CMAKE_BUILD_TYPE": this.config});
        if (environment.isWin) {
            D.push({"CMAKE_RUNTIME_OUTPUT_DIRECTORY": this.workDir});
        }
        else {
            D.push({"CMAKE_LIBRARY_OUTPUT_DIRECTORY": this.buildDir});
        }

        // Include and lib:
        let incPaths;
        if (this.dist.headerOnly) {
            incPaths = [path.join(this.dist.internalPath, "/include/node")];
        }
        else {
            let nodeH = path.join(this.dist.internalPath, "/src");
            let v8H = path.join(this.dist.internalPath, "/deps/v8/include");
            let uvH = path.join(this.dist.internalPath, "/deps/uv/include");
            incPaths = [nodeH, v8H, uvH];
        }

        if (!this.targetOptions.isNapi) {
            // NAN
            let nanH = locateIncludes(this.projectRoot, "nan", "nan.h");
            if (nanH) {
                incPaths.push(nanH);
            }
        } else {
            // NAPI
            let napiH = locateIncludes(this.projectRoot, "node-addon-api", "napi.h");
            if (napiH) {
                incPaths.push(napiH);
            }
        }

        // Includes:
        D.push({"CMAKE_JS_INC": incPaths.join(";")});

        // Runtime:
        if (this.targetOptions.isNapi) {
            D.push({"NAPI_VERSION": this.targetOptions.napiVersion});
            D.push({"NODE_RUNTIME": environment.runtime});
            D.push({"NODE_RUNTIMEVERSION": environment.runtimeVersion});
        } else {
            D.push({"NODE_RUNTIME": this.targetOptions.runtime});
            D.push({"NODE_RUNTIMEVERSION": this.targetOptions.runtimeVersion});
        }
        D.push({"NODE_ARCH": this.targetOptions.arch});

        if (environment.isWin) {
            // Win
            let libs = this.dist.winLibs;
            if (libs.length) {
                D.push({"CMAKE_JS_LIB": libs.join(";")});
            }
        }

        // Custom options
        for (let k of Object.keys(this.cMakeOptions)) {
            D.push({[k]: this.cMakeOptions[k]});
        }

        // Toolset:
        this.toolset.initialize(false);

        if (this.toolset.generator) {
            command += ` -G"${this.toolset.generator}"`;
        }
        if (this.toolset.toolset) {
            command += ` -T"${this.toolset.toolset}"`;
        }
        if (this.toolset.cppCompilerPath) {
            D.push({"CMAKE_CXX_COMPILER": this.toolset.cppCompilerPath});
        }
        if (this.toolset.cCompilerPath) {
            D.push({"CMAKE_C_COMPILER": this.toolset.cCompilerPath});
        }
        if (this.toolset.compilerFlags.length) {
            D.push({"CMAKE_CXX_FLAGS": this.toolset.compilerFlags.join(" ")});
        }
        if (this.toolset.linkerFlags.length) {
            D.push({"CMAKE_SHARED_LINKER_FLAGS": this.toolset.linkerFlags.join(" ")});
        }
        if (this.toolset.makePath) {
            D.push({"CMAKE_MAKE_PROGRAM": this.toolset.makePath});
        }

        // Load NPM config
        for (let key of Object.keys(npmConfigData)) {
            let ukey = key.toUpperCase();
            if (ukey.startsWith("CMAKE_")) {
                let s = {};
                let sk = ukey.substr(6);
                if (sk) {
                    s[sk] = npmConfigData[key];
                    if (s[sk]) {
                        D.push(s);
                    }
                }
            }
        }

        command += " ";
        command += D.map(p => `-D${Object.keys(p)[0]}="${Object.values(p)[0]}"`).join(" ");

        return command;
    }

    configure() {
        this.verifyIfAvailable();

        this.log.info("CMD", "CONFIGURE");
        let listPath = path.join(this.projectRoot, "CMakeLists.txt");
        let command = this.getConfigureCommand();

        try {
            fs.lstatSync(listPath);
        }
        catch (e) {
            throw new Error(`'${listPath}' not found.`);
        }

        fs.mkdirSync(this.workDir, { recursive: true });

        let cwd = process.cwd();
        process.chdir(this.workDir);
        try {
            this._run(command);
        }
        finally {
            process.chdir(cwd);
        }
    }

    ensureConfigured() {
        try {
            fs.lstatSync(path.join(this.workDir, "CMakeCache.txt"));
        }
        catch (e) {
            this.configure();
        }
    }

    getBuildCommand() {
        let command = `${this.path} --build "${this.workDir}" --config ${this.config}`;
        if (this.options.target) {
            command += ` --target ${this.options.target}`;
        }
        return command;
    }

    build() {
        this.verifyIfAvailable();

        this.ensureConfigured();
        let buildCommand = this.getBuildCommand();
        this.log.info("CMD", "BUILD");
        this._run(buildCommand);
    }

    getCleanCommand() {
        return `${this.path} -E remove_directory "${this.workDir}"`;
    }

    clean() {
        this.verifyIfAvailable();

        this.log.info("CMD", "CLEAN");
        return this._run(this.getCleanCommand());
    }

    reconfigure() {
        this.clean();
        this.configure();
    }

    rebuild() {
        this.clean();
        this.build();
    }

    compile() {
        try {
            this.build();
        }
        catch (e) {
            this.log.info("REP", "Build has been failed, trying to do a full rebuild.");
            this.rebuild();
        }
    }

    _run(command) {
        this.log.info("RUN", command);
        return processHelpers.run(command, {silent: this.silent});
    }

    get path() {
        return this.options.cmakePath || "cmake";
    }

    get isAvailable() {
        if (this._isAvailable === null) {
            this._isAvailable = CMake.isAvailable(this.options);
        }
        return this._isAvailable;
    }

}

module.exports = CMake;
