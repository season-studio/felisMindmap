/**
 * 该模块提供页面运行在不同宿主中时的功能适配处理
 */
import { blobFromBase64, blobToBuffer } from "../../thirdpart/toolkits/src/blobKits";
import { dynInvokeLink, pickFile } from "../../thirdpart/toolkits/src/fileDlgKit";
import dbConfig from "./dbConfig";
import FelisDB from "felisdb";

let host = undefined;
let docFilePath = "";

export async function loadFromFile(_filePath) {
    if (host) {
        let getRet = await host.sendMessage("loadFromFile", { filePath: _filePath });
        let { result, forceType } = (getRet || {});
        let blob = (typeof result === "string") ? blobFromBase64(result) : new Blob([result || ""]);
        blob && (blob.$forceType = forceType);
        return blob;
    }
}

export async function openFile(_filter) {
    if (host) {
        let filePath = await host.sendMessage("pickFilePath", {
            filter: _filter
        });
        filePath && (filePath = filePath.result);
        let blob = filePath && await loadFromFile(filePath);
        blob && (blob.name = filePath);
        return blob;
    } else {
        return pickFile(_filter);
    }
}

export async function writeToFile(_blob, _filePath, _asDocSelf, _replaceSelf) {
    if (host) {
        if (_filePath) {
            host.sendMessage("saveToFile", {
                value: await blobToBuffer(_blob),
                filePath: _filePath,
                asDocumentSelf: !!_asDocSelf,
                replaceSelf: !!_replaceSelf
            });
            _asDocSelf && (docFilePath = _filePath);
        }
    } else {
        const url = URL.createObjectURL(_blob);
        dynInvokeLink(url, {download: _filePath || ""});
        URL.revokeObjectURL(url);
        _asDocSelf && (docFilePath = _filePath);
    }
}

export async function saveToFile(_blob, _filePath, _filter, _asDocSelf, _replaceSelf) {
    if (host) {
        _filePath = await host.sendMessage("pickFilePath", {
            filter: _filter,
            default: _filePath,
            forSave: true
        });
        _filePath && (_filePath = _filePath.result);
        if (_filePath) {
            _asDocSelf && (docFilePath = _filePath);
            return await host.sendMessage("saveToFile", {
                value: await blobToBuffer(_blob),
                filePath: _filePath,
                asDocumentSelf: !!_asDocSelf,
                replaceSelf: !!_replaceSelf
            });
        }
    } else {
        const url = URL.createObjectURL(_blob);
        dynInvokeLink(url, {download: _filePath || ""});
        URL.revokeObjectURL(url);
        _asDocSelf && (docFilePath = _filePath);
    }
}

export async function newMindmap(_cbForNew) {
    if (host) {
        host.postMessage("exec", { id: "felis-mindmap.newMindMap" });
    } else {
        let isNew = await Promise.resolve((typeof _cbForNew !== "function") || _cbForNew());
        isNew && (docFilePath = "");
    }
}

export async function openMindmap(_cbForOpen) {
    if (host) {
        host.postMessage("openAsMindmap", { });
    } else {
        let filePath = await Promise.resolve((typeof _cbForOpen !== "function") || _cbForOpen());
        filePath && (docFilePath = filePath);
    }
}

export async function getDocumentFilePath(_ignoreBackupFile) {
    if (host) {
        let result = await host.sendMessage("getDocumentFilePath", _ignoreBackupFile && { ignoreBackupFile: true });
        return (result?.result || "");
    } else {
        return docFilePath || "";
    }
}

export function setDocumentFilePath(_path) {
    docFilePath = (_path || "");
}

export function noSpecialHost() {
    return !host;
}

const NotifyActionList = {
    saveAs(msg) {
        return $felisApp.callAction("saveMindmap-detail", msg.filePath);
    }, 
    save() {
        return $felisApp.callAction("saveMindmap", "fromHost");
    },
    undo() {
        $felisApp.view.undo();
    },
    redo() {
        $felisApp.view.redo();
    },
    async backup(_msg) {
        if (_msg.filePath) {
            let blob = await $felisApp.callAction("dumpMindmap-toBlob", ".felis", true);
            if (blob instanceof Blob) {
                await writeToFile(blob, _msg.filePath);
            }
        }
    },
    async loadAsSelf(_msg) {
        if (_msg.filePath) {
            let content = await loadFromFile(_msg.filePath);
            (content instanceof Blob) && $felisApp.callAction("openMindmap-detail", _msg.filePath, content);
        }
    }
};

export function setHost(_host) {
    host = _host;
    if (host instanceof EventTarget) {
        host.addEventListener("$notify", async (e) => {
            let msg = (e && e.detail);
            if (msg) {
                try {
                    let fn = NotifyActionList[msg.$notify];
                    let result = (typeof fn === "function") && fn(msg);
                    (result instanceof Promise) && (result = await result);
                    msg.$queueID && host.postMessageRaw({
                        notified: msg.$queueID,
                        result
                    });
                } catch (err) {
                    msg.$queueID && host.postMessageRaw({
                        notified: msg.$queueID,
                        error: String(err)
                    });
                }
            }
        });
    }
}

export function notifyChanged() {
    host && host.postMessage("notifyChanged");
}

export function getHost() {
    return host;
}

export function getLanguage() {
    return host ? Promise.resolve(host.sendMessage("getEnv", undefined, 6000)).then(env => env.language)
         : Promise.resolve(navigator.language);
}

export async function getConfiguration(_key) {
    try {
        if (host) {
            let ret = await host.sendMessage("getConfiguration", { key: _key });
            return ret ? ret.result : undefined;
        } else {
            let db = new FelisDB("FelisMindmap", dbConfig);
            let accessor = db.accessStore("configuration", "r");
            let config = await accessor.get(_key).lastResult();
            return config ? config.value : undefined;
        }
    } catch (err) {
        console.warn("Exception raised in getting configuration", _key, err);
        return undefined;
    }
}

export async function setConfiguration(_key, _value) {
    try {
        if (host) {
            await host.sendMessage("setConfiguration", { key: _key, value: _value });
        } else {
            let db = new FelisDB("FelisMindmap", dbConfig);
            let accessor = db.accessStore("configuration", "rw");
            await accessor.put(_value, _key).lastResult();
        }
    } catch (err) {
        console.warn("Exception raised in setting configuration", _key, err);
    }
}

export async function deleteConfiguration(_key) {
    try {
        if (host) {
            await host.sendMessage("setConfiguration", { key: _key });
        } else {
            let db = new FelisDB("FelisMindmap", dbConfig);
            let accessor = db.accessStore("configuration", "rw");
            await accessor.delete(_key).lastResult();
        }
    } catch (err) {
        console.warn("Exception raised in deleting configuration", _key, err);
    }
}

export async function notifySaveByHost()
{
    try {
        if (host) {
            await host.notifySaveByHost();
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.warn("Exception raised in notifying saving request", err);
        return false;
    }
}

export async function execCommandInHost(_command) {
    try {
        if (host) {
            await host.sendMessage("execCommand", { hostCommand: _command });
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.warn("Exception raised in executing command", _command, err);
        return false;
    }
}
