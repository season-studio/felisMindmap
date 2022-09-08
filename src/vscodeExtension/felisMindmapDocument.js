'use strict';
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const acquireWebView = require("./webview");
const packageInfo = require("../../package.json");

let NewCount = 0;

module.exports = class FelisMindmapDocument {

    static get NewDocumentUri() {
        return vscode.Uri.file(`New Mindmap ${NewCount += 1}.felis`).with({ scheme: 'untitled' });
    }

    constructor(_uri, _backupPath) {
        this.backupPath = _backupPath;
        let notifyID = 0;
        Object.defineProperties(this, {
            uri: {
                value: _uri,
                writable: false,
                configurable: false
            },
            savedEmitter: {
                value: new vscode.EventEmitter(),
                writable: false,
                configurable: false
            },
            changeEmitter: {
                value: new vscode.EventEmitter(),
                writable: false,
                configurable: false
            },
            notifiedList: {
                value: { },
                writable: false,
                configurable: false
            },
            notifyID: {
                get: () => {
                    return (notifyID >= Number.MAX_SAFE_INTEGER) ? (notifyID = 0) : (notifyID++);
                },
                configurable: false
            }
        });
    }

    get onChanged() {
        return this.changeEmitter.event;
    }

    acquireView(_context, _panel) {
        _panel && (_panel.webview.options = { enableScripts: true });
        if (!this.panel) {
            const panel = acquireWebView(_context, _panel);
            panel && panel.webview.onDidReceiveMessage(this.messageDispatcher, this, _context.subscriptions);
            Object.defineProperties(this, {
                panel: {
                    value: panel,
                    writable: false,
                    configurable: false
                },
                context: {
                    value: _context,
                    writable: false,
                    configurable: false
                }
            });
        }

        return this.panel;
    }

    dispose() {
        console.log("MindClose:", this.uri.fsPath);
    }

    async notify(_notify, _param, _timeout) {
        if (this.panel) {
            let queueID = `$notified.${_notify}.${Date.now()}.${this.notifyID}`;
            let promise = new Promise((resolve, reject) => {
                _timeout = (Number(_timeout) || 0);
                let timerID = ((_timeout > 0) && setTimeout(() => reject("time out"), _timeout));
                this.notifiedList[queueID] = (_val) => {
                    resolve(_val);
                    timerID && clearTimeout(timerID);
                    timerID = undefined;
                }
            });
            await this.panel.webview.postMessage(Object.assign(
                { $notify: _notify, $queueID: queueID },
                _param
            ));
            return await promise;
        }
    }

    //#region message dispatcher & handler

    /**
     * Dispatch the message received from the client
     * @param {*} _msg 
     */
    async messageDispatcher(_msg) {
        if (_msg.command) {
            const command = _msg.command;
            const queueID = _msg.$queueID;
            const fn = this[command];
            if (this.panel) {
                try {
                    if (typeof fn !== "function") {
                        throw Error("Unknown function");
                    }
                    let ret = await Promise.resolve(fn.call(this, _msg));
                    this.panel.webview.postMessage(Object.assign({}, 
                        ret && (typeof ret === "object") && (!(ret instanceof Array)) && (!(ret.constructor && ret.constructor[Symbol.species])) ? ret : { result: ret },
                        {
                            $return: command,
                            $queueID: queueID
                        }
                    ));
                } catch (err) {
                    this.panel.webview.postMessage({
                        $return: command,
                        $queueID: queueID,
                        $error: String(err)
                    });
                }
            }
        } else if (_msg.notified) {
            let resolveFn = this.notifiedList[_msg.notified];
            delete this.notifiedList[_msg.notified];
            (typeof resolveFn === "function") && resolveFn(_msg.result);
        }
    }

    async backup(_context) {
        if (_context.destination) {
            let filePath = _context.destination.fsPath;
            await this.notify("backup", { filePath });
            this.backupPath = filePath;
            return {
                id: filePath,
                delete: () => vscode.workspace.fs.delete(vscode.Uri.file(filePath))
            }
        }
    }

    async loadAs() {
        let filePath = this.getDocumentFilePath();
        return filePath && await this.notify("loadAsSelf", { filePath });
    }

    /**
     * Execute the command in the vscode
     * @param {*} _msg 
     */
    exec(_msg) {
        (_msg.params instanceof Array) 
            ? vscode.commands.executeCommand.apply(vscode.commands, [_msg.id, ..._msg.params])
            : vscode.commands.executeCommand.call(vscode.commands, _msg.id);
    }

    /**
     * Notify any change is occursed in this document
     */
    notifyChanged() {
        this.changeEmitter.fire();
    }

    /**
     * Get the file path of this document
     * @returns {String} The file path of this document
     */
    getDocumentFilePath() {
        return String((((this.uri.scheme === 'file') || this.backupPath) && this.uri.fsPath) || "");
    }

    async openAsMindmap(_msg) {
        let filePath = await this.pickFilePath(Object.assign({}, { filter: ".felis" }, _msg, { allowFileList: false, forSave: false }));
        (filePath instanceof Array) && (filePath.length > 0) && vscode.commands.executeCommand("vscode.openWith", vscode.Uri.file(filePath[0]), packageInfo.contributes.customEditors[0].viewType);
    }

    /**
     * Read data from a file indicated by _msg.filePath.
     * If the filePath is undefined, this function read the data of the current document
     * @param {*} _msg 
     * @returns {ArrayBuffer} The buffer contains the data;
     */
    loadFromFile(_msg) {
        let path = String(_msg.filePath || "").trim();
        let forceType = undefined;
        if (!path) {
            path = this.backupPath;
            if (fs.existsSync(path)) {
                forceType = ".felis";
            } else {
                path = this.getDocumentFilePath().trim();
            }
        }
        if (path) {
            const buffer = fs.readFileSync(path, {encoding: null});
            return {
                result: ((buffer.length <= 0) ? undefined : buffer.buffer),
                forceType
            };
        }
    }

    /**
     * Save data to a file indicated by _msg.filePath.
     * @param {*} _msg 
     */
    saveToFile(_msg) {
        let filePath = String(_msg.filePath || "");
        if (filePath) {
            const buffer = Buffer.from(_msg.value);
            const dirPath = path.dirname(filePath);
            fs.existsSync(dirPath) || fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(filePath, buffer);
            if (_msg.asDocumentSelf) {
                this.backupPath = undefined;
                this.savedEmitter.fire();
                if ((this.getDocumentFilePath().toLocaleLowerCase() !== filePath.toLocaleLowerCase()) && _msg.replaceSelf) {
                    Promise.resolve().then(() => {
                        this.panel.dispose();
                        vscode.commands.executeCommand("vscode.openWith", vscode.Uri.file(filePath), packageInfo.contributes.customEditors[0].viewType);
                    });
                }
            }
        }
    }

    /**
     * Show a dialog to pick up a file name
     * @param {*} _msg 
     * @returns {String|Array<String>} The name of the selected files
     */
    async pickFilePath(_msg) {
        const options = {};
        options.filters = (_msg.filter ? {
            [String(_msg.filter).replaceAll(".", "*.")] : String(_msg.filter).replaceAll(".", "").split(/[,;]/ig)
        } : {
            ["All files"] : ["*"]
        });
        _msg.default && (options.defaultUri = vscode.Uri.file(_msg.default));
        _msg.title && (options.title = _msg.title);
        options.canSelectMany = !!((!_msg.forSave) && _msg.allowFileList);
        let ret = (_msg.forSave ? await vscode.window.showSaveDialog(options) : await vscode.window.showOpenDialog(options));
        return (ret instanceof Array) ? ret.map(item => item.fsPath) : (ret ? ret.fsPath : undefined);
    }

    /**
     * 获取环境
     */
    getEnv() {
        return {
            language: vscode.env.language,
            appRoot: vscode.env.appRoot,
            machineId: vscode.env.machineId,
            remoteName: vscode.env.remoteName,
            sessionId: vscode.env.sessionId,
            shell: vscode.env.shell,
            uriScheme: vscode.env.uriScheme,
            uiKind: String(vscode.env.uiKind)
        };
    }

    /**
     * Get a configuration
     * @param {*} _msg
     * @returns 
     */
    getConfiguration(_msg) {
        return (_msg.key && this.context && this.context.globalState) ? { result: this.context.globalState.get(_msg.key) } : undefined;
    }

    /**
     * Set a configuration
     * @param {*} _msg 
     */
    async setConfiguration(_msg) {
        (_msg.key && this.context && this.context.globalState) && (await this.context.globalState.update(_msg.key, _msg.value));
    }
    //#endregion
}