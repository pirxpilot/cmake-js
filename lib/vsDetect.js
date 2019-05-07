const { exec } = require("./processHelpers");

module.exports = {
    isInstalled(version) {
        return isVSInstalled(version) || isVSvNextInstalled(version) || isBuildToolsInstalled(version);
    }
};

function isBuildToolsInstalled(version) {
    let mainVer = version.split(".")[0];
    let key;
    let testPhrase;
    if (Number(mainVer) >= 15) {
        key = `HKLM\\SOFTWARE\\Classes\\Installer\\Dependencies\\Microsoft.VS.windows_toolscore,v${mainVer}`;
        testPhrase = "Version";
    }
    else {
        key = `HKLM\\SOFTWARE\\Classes\\Installer\\Dependencies\\Microsoft.VS.VisualCppBuildTools_x86_enu,v${mainVer}`;
        testPhrase = "Visual C++";
    }
    let command = `reg query "${key}"`;
    try {
        let stdout = exec(command);
        return stdout && stdout.indexOf(testPhrase) > 0;
    }
    catch (e) {
    }
    return false;
}

function isVSInstalled(version) {
    // On x64 this will look for x64 keys only, but if VS and compilers installed properly,
    // it will write it's keys to 64 bit registry as well.
    let command = `reg query "HKLM\\Software\\Microsoft\\VisualStudio\\${version}"`;
    try {
        let stdout = exec(command);
        if (stdout) {
            let lines = stdout.split("\r\n").filter(function (line) {
                return line.length > 10;
            });
            if (lines.length >= 4) {
                return true;
            }
        }
    }
    catch (e) {
    }
    return false;
}

function isVSvNextInstalled(version) {
    let mainVer = version.split(".")[0];
    let command = `reg query "HKLM\\SOFTWARE\\Classes\\Installer\\Dependencies\\Microsoft.VisualStudio.MinShell.Msi,v${mainVer}"`;
    try {
        let stdout = exec(command);
        if (stdout) {
            let lines = stdout.split("\r\n").filter(function (line) {
                return line.length > 10;
            });
            if (lines.length >= 3) {
                return true;
            }
        }
    }
    catch (e) {
    }
    return false;
}
