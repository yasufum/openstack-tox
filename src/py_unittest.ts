import * as vscode from 'vscode';

const NEWLINE_REGEX = /\r\n|\r|\n/;

// Get all functions and classes in the file.
let getAllFunctions = (): Array<Map<string, any>> => {
    const activeEditor = vscode.window.activeTextEditor;
    var fileContents = activeEditor?.document.getText();
    var contentsLines = fileContents?.split(NEWLINE_REGEX);

    var lines = new Array();

    if (contentsLines) {
        var cnt = 1;  // current line in for loop

        // Find test functions
        for (var line of contentsLines) {
            if (line.match(/^\s*?(def|class) /)) {
                const actualDef = line.replace(/^\s+/i, "");
                const fname = actualDef
                    .replace(/^def /i, "")
                    .replace(/^class /i, "")
                    .split("(")[0];

                // TODO(yasufum): Revise with smarter way of
                // initialization.
                var tmp: Map<string, any> = new Map();
                tmp.set("num", cnt);
                tmp.set("fname", fname);
                tmp.set("depth", line.length - actualDef.length);
                if (actualDef.startsWith("class")) {
                    tmp.set("isClass", true);
                } else {
                    tmp.set("isClass", false);
                }
                lines.push(tmp);
            }
            cnt++;
        }
    }
    return lines;
};

// Get the name of function on which cursor is.
let getCurrentFunction = (): string => {
    const activeEditor = vscode.window.activeTextEditor;

    const lineAt = activeEditor?.selection.active.line! + 1;
    if (lineAt) {
        const allFuncs = getAllFunctions().reverse();

        var myfunc = null;
        for (var func of allFuncs) {
            if (func.get("num") <= lineAt) {
                if (func.get("isClass") === true) {
                    if (myfunc === null) {
                        return func.get("fname");
                    } else {
                        return func.get("fname") + "." + myfunc;
                    }
                } else if (func.get("fname").startsWith("test_")) {
                    if (myfunc === null) {
                        myfunc = func.get("fname");
                    }
                }
            }
        }
    }
    return "";
};

export function getTestPath(): string | undefined {
    const filePath = vscode.window.activeTextEditor?.document
        .uri.path.split(".")[0];
    const wsPath = vscode.workspace.workspaceFolders![0].uri.path;

    const filePathAry = filePath!.split("/");
    const wsPathAry = wsPath!.split("/");
    let a = new Array();
    for (var i = wsPathAry.length; i < filePathAry.length; i++) {
        a.push(filePathAry[i]);
    }
    let testPath = a.join(".");

    let curFun = getCurrentFunction();
    if (curFun !== "") {
        testPath = testPath + "." + curFun;
    }
    return testPath;
};