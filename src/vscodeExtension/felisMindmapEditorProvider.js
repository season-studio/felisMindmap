'use strict';
const vscode = require("vscode");
const FelisMindmapDocument = require("./felisMindmapDocument");
const packageInfo = require("../../package.json");

module.exports = class FelisMindmapEditorProvider {

    static register(_context) {
        const provider = new FelisMindmapEditorProvider(_context);
        _context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(
                packageInfo.contributes.customEditors[0].viewType,
                provider,
                {
                    webviewOptions: {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    },
                    supportsMultipleEditorsPerDocument: false,
                })
        );
    }

    constructor (_context) {
        Object.defineProperties(this, {
            context: {
                value: _context,
                writable: false,
                configurable: false
            },
            didChangeDocumentEmitter: {
                value: new vscode.EventEmitter(),
                writable: false,
                configurable: false
            }
        });
    }

    //#region Implementation of vscode.CustomEditorProvider

    get onDidChangeCustomDocument() {
        return this.didChangeDocumentEmitter.event;
    }

    openCustomDocument(_uri, _context) {
        const document = new FelisMindmapDocument(_uri, _context.backupId);
        document.onChanged(() => {
            this.didChangeDocumentEmitter.fire({
                document,
                undo: () => document.notify("undo"),
                redo: () => document.notify("redo")
            });
        });
        return document;
    }

	resolveCustomEditor(_doc, _panel) {
        (_doc instanceof FelisMindmapDocument) && _doc.acquireView(this.context, _panel);
	}

	async saveCustomDocument(_doc) {
        (_doc instanceof FelisMindmapDocument) && await _doc.notify("save");
	}

	async saveCustomDocumentAs(_doc, _uri) {
        (_doc instanceof FelisMindmapDocument) && await _doc.notify("saveAs", { filePath: _uri.fsPath });
	}

	async revertCustomDocument(_doc) {
        (_doc instanceof FelisMindmapDocument) && await _doc.loadAs();
    }

	async backupCustomDocument(_doc, _context) {
        return (_doc instanceof FelisMindmapDocument) && await _doc.backup(_context);
    }
    //#endregion
}