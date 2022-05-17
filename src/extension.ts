// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { execPath, kill } from 'process';
import internal = require('stream');
import * as vscode from 'vscode';

import { getTestPath } from './py_unittest';

export function activate(context: vscode.ExtensionContext) {

	console.log('"openstack-tox" is now active!');

	const ws = vscode.workspace.workspaceFolders![0];
	const wsPath = ws.uri.path;

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
			"name": "openstack-tox.compile-docs",
			"func": async () => {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					cancellable: false,
					title: "Compiling docs"
				}, async (progress) => {
					const cmds = [
						`cd ${wsPath}`,
						"tox -e docs"
					];
					const cp = require('child_process').exec(cmds.join("; "));
					await new Promise((resolve) => { cp.on('close', resolve); });
					vscode.window.showInformationMessage("Done Compile docs.");
				});
			}
		},
		{
			// Run `tox --notest` for setting up tox env.
			"name": "openstack-tox.setup-tox-env",
			"func": async () => {
				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					cancellable: false,
					title: "Setup for running tox"
				}, async (progress) => {
					const cmds = [
						`cd ${wsPath}`,
						"tox --notest",
						"tox -e debug --notest"
					];
					const cp = require('child_process').exec(cmds.join("; "));
					await new Promise((resolve) => { cp.on('close', resolve); });
					vscode.window.showInformationMessage("Done!");
				});
			}
		},
		{
			"name": "openstack-tox.debug-unittest",
			"func": async () => {
				const fs = require('fs');

				if (!fs.existsSync(`${wsPath}/.tox/debug`)) {
					vscode.window.showWarningMessage("No debug environment installed.");
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "Installing debug environment"
					}, async (progress) => {
						const cmd = `cd ${wsPath}; tox -e debug --notest`;
						const cp = require('child_process').exec(cmd);
						await new Promise((resolve) => { cp.on('close', resolve); });
						vscode.window.showInformationMessage("Done installing debug environment.");
					});
				} else {
					var testPath = getTestPath();

					if (testPath) {
						// For debugging.
						vscode.window.showInformationMessage(testPath);
						const vnevDebugPython = `${wsPath}/.tox/debug/bin/python3`;
						vscode.window.showInformationMessage(vnevDebugPython);

						const cp = require("child_process");

						const testDir = `${wsPath}/tacker/tests`;
						const mod = "testtools.run";

						// TODO: Enable debug multi-threaded test with ddt. There're two strategies,
						//       using "discover --load-list LISTFILE" as same as tox's manner, or
						//       loading each testpath in LISTFILE and run each test. Although tried
						//       the strategies once, both are failed. I need to have some more studies.
						//const output = `${wsPath}/all_tests.txt`;
						//const output2 = `${wsPath}/one_tests.txt`;
						//let cmds = [
						//	`cd ${wsPath}`,
						//	`${vnevDebugPython} -m ${mod} discover -t ${wsPath} ${testDir} --list > ${output}`,
						//	`grep "${testPath}" < ${output} > ${output2}`
						//];
						//const cp1 = require('child_process').exec(cmds.join("; "));
						//await new Promise((resolve) => { cp1.on('close', resolve); });

						await new Promise((resolve) => {
							//var fpath = output2;
							//var contents = fs.readFileSync(fpath);
							//let ary = contents.toString().split("\n");
							//let tPaths = new Array();
							//for (var i = 0; i < ary.length; i++) {
							//	if (ary[i] !== "") {
							//		tPaths.push(ary[i]);
							//	}
							//}

							// Its params are the same as definitions in launch.json.
							var conf: vscode.DebugConfiguration = {
								name: "Debug Unittest",  // arbitrary name
								request: "launch",
								type: "python",
								module: "testtools.run",
								env: {},
								subProcess: true,  // Does it work for greenlet multithreads?
								pythonPath: vnevDebugPython,
								args: [testPath]
							};
							var dbg = vscode.debug.startDebugging(ws, conf);
						});
					}
				}
			}
		},
		{
			"name": "openstack-tox.run-dummy-test",
			"func": () => {
				vscode.window.showInformationMessage(
					'Run dummy test command');
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
export function deactivate() { }