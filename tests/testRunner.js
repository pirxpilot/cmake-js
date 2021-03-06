const { environment } = require("..");
const log = require("npmlog");

function* generateRuntimeOptions() {
    function* generateForNode(arch) {
        // Old:
        yield {
            runtime: "node",
            runtimeVersion: "0.10.36",
            arch
        };

        // LTS:
        yield {
            runtime: "node",
            runtimeVersion: "4.4.2",
            arch
        };

        // Current:
        if (environment.runtimeVersion !== "5.10.0") {
            yield {
                runtime: "node",
                runtimeVersion: "5.10.0",
                arch
            };
        }
    }

    function* generateForNWJS(arch) {
        yield {
            runtime: "nw",
            runtimeVersion: "0.13.2",
            arch
        };

        // Latest:
        yield {
            runtime: "nw",
            runtimeVersion: "0.30.5",
            arch
        };
    }

    function* generateForElectron(arch) {
        // Latest:
        yield {
            runtime: "electron",
            runtimeVersion: "0.37.3",
            arch
        };
    }

    function* generateForArch(arch) {
        yield* generateForNode(arch);
        yield* generateForNWJS(arch);
        yield* generateForElectron(arch);
    }

    if (environment.isWin) {
        yield* generateForArch("x64");
        yield* generateForArch("ia32");
    }
    else {
        yield* generateForArch();
    }

    // Actual:
    yield {};
}

function* generateOptions() {
    for (let runtimeOptions of generateRuntimeOptions()) {
        if (environment.isWin) {
            // V C++:
            yield runtimeOptions;
        }
        else {
            // Clang, Make
            yield { ...runtimeOptions, preferClang: true, preferMake: true };

            // Clang, Ninja
            yield { ...runtimeOptions, preferClang: true };

            // g++, Make
            yield { ...runtimeOptions, preferGnu: true, preferMake: true };

            // g++, Ninja
            yield { ...runtimeOptions, preferGnu: true };

            // Default:
            yield runtimeOptions;
        }
    }
}


function it_testCase(testCase, options) {
    let optionsStr = [
        options.runtime,
        options.runtimeVersion,
        options.arch
    ];
    [
        "preferGnu",
        "preferClang",
        "preferMake"
    ].forEach(o => (o in options) && optionsStr.push(o));
    optionsStr = optionsStr.filter(x => x).join(" ");
    it(`should build with: ${optionsStr}`, function() {
        log.info("TEST", `Running case for options of: ${optionsStr}`);
        options.silent = true;
        return testCase(options);
    });
}

let testRunner = {
    runCase(testCase, options) {
        beforeEach(function() {
            this.cwd = process.cwd();
        });
        afterEach(function() {
            process.chdir(this.cwd);
        });
        for (let testOptions of generateOptions()) {
            it_testCase(testCase, { ...testOptions, ...options });
        }
    }
};

module.exports = testRunner;
