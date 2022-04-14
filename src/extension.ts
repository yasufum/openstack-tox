// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { kill } from 'process';
import internal = require('stream');
import * as vscode from 'vscode';
import {getTestPath} from './py_unittest';

export function activate(context: vscode.ExtensionContext) {
	
	console.log('"openstack-tox" is now active!');

	let showResult = (err: string, stdout: string, stderr: string) => {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (err) {
				console.log('error: ' + err);
			}
		    vscode.window.showInformationMessage(stdout);
	};

	// Setup all command names and its definitions here.
	let commands = [
		{
			"name": "openstack-tox.run-tox-help",
			"func": () => {
				const cp = require('child_process');
				cp.exec('tox -h', showResult);
			}
		},
		{ 
			"name": "openstack-tox.debug-unittest",
			"func": () => {
				var testPath = getTestPath();

				if (testPath) {
					// For debugging.
					vscode.window.showInformationMessage(testPath);

					var ws = vscode.workspace.workspaceFolders![0];

					// Its params are the same as definitions in launch.json.
					var conf:vscode.DebugConfiguration = {
						name: "Debug Unittest",  // arbitrary name
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