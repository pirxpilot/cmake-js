const semver = require("semver");

module.exports = {
    napi() {
        return {
            // still need 'node-api.h' for N-API builds it does not matter which version
            externalPath: `https://nodejs.org/dist/${process.version}/`,
            winLibs: [],
            tarPath: `node-${process.version}-headers.tar.gz`,
            headerOnly: true
        };
    },
    node(targetOptions) {
        if (semver.lt(targetOptions.runtimeVersion, "4.0.0")) {
            return {
                externalPath: `https://nodejs.org/dist/v${targetOptions.runtimeVersion}/`,
                winLibs: [{
                    dir: targetOptions.isX64 ? "x64" : "",
                    name: `${targetOptions.runtime}.lib`
                }],
                tarPath: `${targetOptions.runtime}-v${targetOptions.runtimeVersion}.tar.gz`,
                headerOnly: false
            };
        }
        else {
            return {
                externalPath: `https://nodejs.org/dist/v${targetOptions.runtimeVersion}/`,
                winLibs: [{
                    dir: targetOptions.isX64 ? "win-x64" : "win-x86",
                    name: `${targetOptions.runtime}.lib`
                }],
                tarPath: `${targetOptions.runtime}-v${targetOptions.runtimeVersion}-headers.tar.gz`,
                headerOnly: true
            };
        }
    },
    iojs(targetOptions) {
        return {
            externalPath: `https://iojs.org/dist/v${targetOptions.runtimeVersion}/`,
            winLibs: [{
                dir: targetOptions.isX64 ? "win-x64" : "win-x86",
                name: `${targetOptions.runtime}.lib`
            }],
            tarPath: `${targetOptions.runtime}-v${targetOptions.runtimeVersion}.tar.gz`,
            headerOnly: false
        };
    },
    nw(targetOptions) {
        if (semver.gte(targetOptions.runtimeVersion, "0.13.0")) {
            return {
                externalPath: `https://node-webkit.s3.amazonaws.com/v${targetOptions.runtimeVersion}/`,
                winLibs: [
                    {
                        dir: targetOptions.isX64 ? "x64" : "",
                        name: `${targetOptions.runtime}.lib`
                    },
                    {
                        dir: targetOptions.isX64 ? "x64" : "",
                        name: "node.lib"
                    }
                ],
                tarPath: `nw-headers-v${targetOptions.runtimeVersion}.tar.gz`,
                headerOnly: false
            };
        }
        return {
            externalPath: `https://node-webkit.s3.amazonaws.com/v${targetOptions.runtimeVersion}/`,
            winLibs: [{
                dir: targetOptions.isX64 ? "x64" : "",
                name: `${targetOptions.runtime}.lib`
            }],
            tarPath: `nw-headers-v${targetOptions.runtimeVersion}.tar.gz`,
            headerOnly: false
        };
    },
    electron(targetOptions) {
        return {
            externalPath: `https://atom.io/download/atom-shell/v${targetOptions.runtimeVersion}/`,
            winLibs: [{
                dir: targetOptions.isX64 ? "x64" : "",
                name: "node.lib"
            }],
            tarPath: `node-v${targetOptions.runtimeVersion}.tar.gz`,
            headerOnly: false
        };
    },
    get(targetOptions) {
        const { runtime } = targetOptions;
        let func = this[runtime];
        if (typeof func === 'function') {
            return func(targetOptions);
        }
        throw new Error(`Unknown runtime: ${runtime}`);
    }
};
