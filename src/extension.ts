// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { kill } from 'process';
import internal = require('stream');
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	
	// TODO(yasufum): Replace with meaningful msg.
	console.log('"openstack-tox" is now active!');

	const NEWLINE_REGEX = /\r\n|\r|\n/;

	// Get all functions and classes in the file.
	let _getAllFunctions = (): Array<Map<string, any>> => {
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
	let _getCurrentFunction = (): string => {
		const activeEditor = vscode.window.activeTextEditor;

		const lineAt = activeEditor?.selection.active.line! + 1;
		if (lineAt) {
			const allFuncs = _getAllFunctions().reverse();

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
						myfunc = func.get("fname");
					}
				}
			}
		}
		return "";
	};

	let _getTestFunction = (): string => {
		return  _getCurrentFunction();
	};

	let getTestPath = (): string | undefined => {
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

		let curFun= _getCurrentFunction();
		if (curFun!== "") {
			testPath = testPath + "." + curFun;
		}
		return testPath;
	};

	let myfunc = (err: string, stdout: string, stderr: string) => {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (err) {
				console.log('error: ' + err);
			}
		    vscode.window.showInformationMessage(stdout);
	};

	let hoge = () => {
			const cp = require('child_process');
			cp.exec('tox -h', myfunc);
	};

	// Setup all command names and its definitions here.
	let commands = [
		{
			"name": "openstack-tox.run-tox",
			"func": () => {
				const cp = require('child_process');
				cp.exec('tox -h', myfunc);
			}
		},
		{ 
			"name": "openstack-tox.run-debug",
			"func": () => {
				var testPath = getTestPath();

				if (testPath) {
					// For debugging.
					vscode.window.showInformationMessage(testPath);

					var ws = vscode.workspace.workspaceFolders![0];

					// Its params are the same as definitions in launch.json.
					var conf:vscode.DebugConfiguration = {
						name: "hoge",  // arbitrary name
						request: "launch",
						type: "python",
						module: "unittest",
						env: {},
						args: [testPath]
					};

					var dbg = vscode.debug.startDebugging(ws, conf);
				}
			}
		},
		{
			 "name": "openstack-tox.run-test",
			 "func": () => {
				vscode.window.showInformationMessage(
					'Run tox test command at line');
			}
		},
	];

	for (let i = 0; i < commands.length; i++) {
		let cmd = commands[i];
		let disposable = vscode.commands.registerCommand(
			cmd["name"], cmd["func"]!);
		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}