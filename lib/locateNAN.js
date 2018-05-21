"use strict";
let fs = require("fs-extra");
let path = require("path");
let _ = require("lodash");

module.exports = locateNAN;

function isNANModule(dir) {
    let h = path.join(dir, "nan.h");
    try {
        let stat = fs.statSync(h);
        return stat.isFile();
    }
    catch (e) {
        _.noop(e);
        return false;
    }
}

function isNodeJSProject(dir) {
    let pjson = path.join(dir, "package.json");
    let node_modules = path.join(dir, "node_modules");
    try {
        let stat = fs.statSync(pjson);
        if (stat.isFile()) {
            return true;
        }
        stat = fs.statSync(node_modules);
        if (stat.isDirectory()) {
            return true;
        }
    }
    catch (e) {
        _.noop(e);
    }
    return false;
}

function locateNAN(projectRoot) {
    let result = isNodeJSProject(projectRoot);
    if (!result) {
        return null;
    }
    let nanModulePath = path.join(projectRoot, "node_modules", "nan");
    result = isNANModule(nanModulePath);
    if (result) {
        return nanModulePath;
    }

    // Goto upper level:
    return locateNAN(goUp(projectRoot));
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
