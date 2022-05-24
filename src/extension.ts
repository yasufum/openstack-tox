// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { fstat } from 'fs';
import { execPath, kill } from 'process';
import internal = require('stream');
import * as vscode from 'vscode';

import { getTestPath } from './py_unittest';

let tmpdirPath = ""; // contains files for unittest's test path list.

export function activate(context: vscode.ExtensionContext) {

	console.log('"openstack-tox" is now active!');

	const ws = vscode.workspace.workspaceFolders![0];
	const wsPath = ws.uri.path;
	const defaultPython = "py38";

	const sofMsgOnNotification = 10; // Size of messages on notification location.


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
					let msgs = new Array();
					await new Promise((resolve) => {
						cp.stdout.on('data', (data: any) => {
							if (msgs.length > sofMsgOnNotification) {
								msgs.shift();
							}
							msgs.push(data.toString());
							progress.report({message: msgs.join("\n")});
						});

						cp.on('close', resolve);
					 });
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
					let msgs = new Array();
					await new Promise((resolve) => {
						cp.stdout.on('data', (data: any) => {
							if (msgs.length > sofMsgOnNotification) {
								msgs.shift();
							}
							msgs.push(data.toString());
							progress.report({message: msgs.join("\n")});
						});
						cp.on('close', resolve);
					});
					vscode.window.showInformationMessage("Done!");
				});
			}
		},
		{
			"name": "openstack-tox.debug-unittest",
			"func": async () => {
				const cp = require("child_process");
				const fs = require('fs');
				const os = require("os");

				// Create a directory for containing files of list of unittest's test path.
				const randomDirName = require("crypto").createHash("md5").update("hoge").digest("hex");
				tmpdirPath = `${os.tmpdir()}/vscode-ext/openstack-tox/${randomDirName}`;

				if (!fs.existsSync(`${wsPath}/.tox/debug`)) {
					vscode.window.showWarningMessage("No debug environment installed.");
					vscode.window.withProgress({
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "Installing debug environment"
					}, async (progress) => {
						const cmds = [`cd ${wsPath}`, "tox -e debug --notest"];
						const cpSetupDbg = cp.exec(cmds.join("; "));
						let msgs = new Array();
						await new Promise((resolve) => {
							cpSetupDbg.stdout.on('data', (data: any) => {
								if (msgs.length > sofMsgOnNotification) {
									msgs.shift();
								}
								msgs.push(data.toString());
								progress.report({ message: msgs.join("\n") });
							});

							cpSetupDbg.on('close', resolve);
						});
						vscode.window.showInformationMessage("Done installing debug environment.");
					});
				} else {
					var testPath = getTestPath();

					if (testPath) {
						// For debugging.
						const vnevDebugPython = `${wsPath}/.tox/debug/bin/python3`;
						const mod = "testtools.run";

						const testDir = `${wsPath}/tacker/tests`;
						const cpMkdir = cp.exec(`mkdir -p ${tmpdirPath}`);
						await new Promise((resolve) => { cpMkdir.on('close', resolve); });

						// Path of test path generated via oslo_debug_helper script. Two files will be generated
						// while running the script. You can refer the details by running
						// `cat $(which oslo_debug_helper)`.
						const outputAll = `${tmpdirPath}/all_tests.txt`;
						const outputOne = `${tmpdirPath}/one_tests.txt`;

						let cmds = [
							`cd ${wsPath}`,
							`${vnevDebugPython} -m ${mod} discover -t ${wsPath} ${testDir} --list > ${outputAll}`,
							`grep "${testPath}" < ${outputAll} > ${outputOne}`
						];
						const cp1 = cp.exec(cmds.join("; "));
						await new Promise((resolve) => { cp1.on('close', resolve); });

						// Its params are the same as definitions in launch.json.
						var conf: vscode.DebugConfiguration = {
							name: "Debug Unittest",  // arbitrary name
							request: "launch",
							type: "python",
							module: mod,
							env: {},
							subProcess: true,  // Does it work for greenlet multithreads?
							console: "integratedTerminal",
							gevent: true,
							pythonPath: vnevDebugPython,
							args: ["discover", "--load-list", outputOne],
						};
						var dbg = vscode.debug.startDebugging(ws, conf);
					}
				}
			}
		},
		{
			"name": "openstack-tox.run-unittest",
			"func": async () => {
				vscode.window.showInformationMessage("Running unittest on terminal.");
				var testPath = getTestPath();
				let cmds = [
					"pushd .",
					`cd ${wsPath}`,
					`tox -e ${defaultPython}`,
					"popd"
				];
				if (testPath) {
					cmds[2] = `tox -e ${defaultPython} ${testPath}`;
				}
				console.log(cmds[2]);

				// TODO: Change to show the results on another pane as a read-only text.
				let term = vscode.window.activeTerminal;
				term?.sendText(cmds.join("; "));
			}
		},
	];

	// Remove temporary files used for debugging as finalization.
	context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(
		() => {
			const fs = require('fs');
			fs.rmSync(tmpdirPath, { recursive: true, force: true });
		}
	));

	for (let i = 0; i < commands.length; i++) {
		let cmd = commands[i];
		let disposable = vscode.commands.registerCommand(
			cmd["name"], cmd["func"]!);
		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }