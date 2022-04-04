// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "openstack-tox" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

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
				vscode.window.showInformationMessage('Run tox debug command');
			}
		},
		{
			 "name": "openstack-tox.run-debug-atline",
			 "func": () => {
				vscode.window.showInformationMessage('Run tox debug command atline');
			}
		},
	];

	for (let i = 0; i < commands.length; i++) {
		let cmd = commands[i];
		let disposable = vscode.commands.registerCommand(cmd["name"], cmd["func"]!);
		context.subscriptions.push(disposable);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
