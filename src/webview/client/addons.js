import { privateMember } from "../../thirdpart/toolkits/src/privateMember";
import { getConfiguration, setConfiguration } from "../common/hostAdapter";
import fileFormats from "../fileFormats";

let AddonManifest = undefined;
let AddonList = undefined;

function callAddon(_addon, _name) {
    try {
        let fn = (_addon && _addon[_name]);
        return (typeof fn === "function") && fn.apply(_addon, Array.prototype.slice.call(arguments, 2));
    } catch (err) {
        console.warn("Exception raised in calling addon", _name, err);
    }
}

async function unloadAddons() {
    (AddonList instanceof Array) 
        && await Promise.all(AddonList.map(async (item) => {
            await Promise.resolve(callAddon(item, "deactive"));
            await Promise.resolve(callAddon(item, "unload"));
        }));
}

async function initAddonList() {
    await unloadAddons();
    AddonList = undefined;
    return AddonManifest = await fetch("./addons/list.json").then(r => r.json());
}

async function setAddonActive(_file, _state) {
    try {
        let config = await getConfiguration("addon-active");
        config || (config = {});
        config[_file] = _state;
        await setConfiguration("addon-active", config);
    } catch(err) {
        console.warn("Exception in save addon configuration", err);
    }
}

const AddonActiveFlag = Symbol("felis.mindmap.addon.active");

export async function loadAddons() {
    (AddonManifest instanceof Array) || (await initAddonList());
    let config = await getConfiguration("addon-active");
    config || (config = {});
    (AddonManifest instanceof Array) && (AddonList = await Promise.all(AddonManifest.map(async (item) => {
        try {
            let fileBlob = await fetch(item.file).then(r => r.blob());
            if (fileBlob instanceof Blob) {
                let fileProvider = new (fileFormats(".felis").constructor)();
                await fileProvider.load(fileBlob);
                if (fileProvider.type === "mindmap-addon") {
                    let entryScript = await fileProvider.readContent("entry.js", "text");
                    entryScript && (entryScript = new Function("app", "configuration", "package", "addon", entryScript + "; return addon;"));
                    let addon = entryScript && entryScript($felisApp, item, fileProvider);
                    (addon instanceof Promise) && (addon = await addon);
                    if (addon) {
                        privateMember(addon, AddonActiveFlag, !!(item.file in config ? config[item.file] : item.active));
                        Object.defineProperties(addon, {
                            $activeDefault: {
                                get: () => privateMember(addon, AddonActiveFlag),
                                set: (value) => {
                                    value = !!value;
                                    setAddonActive(item.file, value).then(async () => {
                                        privateMember(addon, AddonActiveFlag, value);
                                        await Promise.resolve(callAddon(addon, value ? "active": "deactive"));
                                    });
                                },
                                configurable: false
                            },
                            $file: {
                                value: item.file,
                                writable: false,
                                configurable: false
                            }
                        });
                        await Promise.resolve(callAddon(addon, "load"));
                        return addon;
                    }
                }
            }
        } catch(err) {
            console.warn("Exception in load addon", err);
        }
    })));
    (AddonList instanceof Array) && (AddonList = AddonList.filter(item => item));
}

export async function activeAddons() {
    (AddonList instanceof Array) && await Promise.all(AddonList.map(async (item) => {
        item.$activeDefault && await Promise.resolve(callAddon(item, "active"));
    }));
}

export function * enumerateAddons() {
    if (AddonList instanceof Array) {
        for (let addon of AddonList) {
            yield addon;
        }
    }
}
