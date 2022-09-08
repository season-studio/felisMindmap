const vscode = require("vscode");
const FelisMindmapDocument = require("./felisMindmapDocument");
const packageInfo = require("../../package.json");

class Commands {
    constructor (context) {
        this.context = context;
    }

    async newMindMap() {
        vscode.commands.executeCommand("vscode.openWith", FelisMindmapDocument.NewDocumentUri, packageInfo.contributes.customEditors[0].viewType);
    }
}

module.exports = Commands;