// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
'use strict';
const vscode = require("vscode");
const packageInfo = require("../../package.json");
const Commands = require("./commands");

const FelisMindmapEditorProvider = require("./felisMindmapEditorProvider");

/**
 * 插件激活函数
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const contributes = packageInfo.contributes;
    const commandsList = contributes.commands;
    const commands = new Commands(context);
    for (let idx in commandsList) {
        const commandDesc = commandsList[idx];
        const regName = commandDesc.command;
        const nameIdx = regName.lastIndexOf(".");
        const name = ((nameIdx > 0) ? regName.substr(nameIdx + 1) : regName);
        const commandFn = commands[name];
        (typeof commandFn === "function") && context.subscriptions.push(
            vscode.commands.registerCommand(regName, commandFn, commands)
        );
    }

    FelisMindmapEditorProvider.register(context);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
