"use strict";
let fs = require("fs-extra");
let path = require("path");

module.exports = locateNAN;

function hasFile(dir, file) {
    try {
        let h = path.join(dir, file);
        return fs.statSync(h).isFile();
    } catch (e) {
        return false;
    }
}

function isNodeJSProject(dir) {
    try {
        let f = path.join(dir, "package.json");
        let d = path.join(dir, "node_modules");
        return fs.statSync(f).isFile() && fs.statSync(d).isDirectory();
    } catch (e) {
        return false;
    }
}

function locateNAN(projectRoot, moduleName = "nan", header = "nan.h") {
    if (!isNodeJSProject(projectRoot)) {
        return null;
    }
    let modulePath = path.join(projectRoot, "node_modules", moduleName);
    if (hasFile(modulePath, header)) {
        return modulePath;
    }
    // Goto upper level:
    return locateNAN(goUp(projectRoot), moduleName, header);
}

function goUp(dir) {
    let items = dir.split(path.sep);
    let scopeItem = items[items.length - 2];
    if (scopeItem && scopeItem[0] === "@") {
        // skip scope
        dir = path.join(dir, "..");
    }
    dir = path.join(dir, "..", "..");
    return path.normalize(dir);
}
