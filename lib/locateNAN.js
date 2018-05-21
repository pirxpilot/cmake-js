"use strict";
let fs = require("fs");
let path = require("path");

module.exports = locateNAN;

function isFile(f) {
    try {
        return fs.statSync(f).isFile();
    } catch (e) {
        return false;
    }
}

function isDirectory(d) {
    try {
        return fs.statSync(d).isDirectory();
    } catch (e) {
        return false;
    }
}

function isNodeJSProject(dir) {
    let f = path.join(dir, "package.json");
    let d = path.join(dir, "node_modules");
    return isFile(f) || isDirectory(d);
}

function locateNAN(projectRoot, moduleName = "nan", header = "nan.h") {
    let result = isNodeJSProject(projectRoot);
    if (!result) {
        return null;
    }
    let modulePath = path.join(projectRoot, "node_modules", moduleName);
    if (isFile(path.join(modulePath, header))) {
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
