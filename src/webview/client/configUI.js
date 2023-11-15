import { i18n } from "../../thirdpart/toolkits/src/i18n";
import dialog from "../../thirdpart/toolkits/src/tip/dialog";
import popup from "../../thirdpart/toolkits/src/tip/popup";
import configAddonsUI from "./configAddonsUI";
import configShortcutUI, { exportShortcuts, importShortcuts } from "./configShortcutUI";

const configItems = [{
    text: "Addons",
    anchor: "addons",
    init: configAddonsUI,
}, {
    text: "Shortcuts",
    anchor: "shortcuts",
    init: configShortcutUI,
    import: importShortcuts,
    export: exportShortcuts
}];

const ExportSelectionUIXML = `<!--template XML-->
<style>
    .export-selection-dlg {
        max-width: 80%;
        max-height: 80%;
        padding: 0.1rem;
    }
    .export-selection-dlg * {
        user-select: none;
    }
    .export-selection-dlg fieldset {
        max-height: 100%;
        overflow: scroll;
    }
    .export-selection-bar {
        display: flex;
        flex-direction: row;
        justify-content: center;
        justify-items: center;
        margin: 0.5em 0;
    }
</style>
<div class="export-selection-dlg">
    <fieldset>
        <legend d-i18n>Choose export content:</legend>
    </fieldset>
    <p class="export-selection-bar">
        <button d-i18n d-click="onClickSubmit">OK</button>&nbsp;
        <button d-i18n d-click="onClickCancel">Cancel</button>
    </p>
</div>
`;

const ExportSelectionUIOptions = {
    blurToClose: undefined,
    onInitialize(_self) {
        let container = _self.root.querySelector("fieldset");
        container && this.filterItems.forEach((item, idx) => {
            container.insertAdjacentHTML("beforeend", `<div><input type="checkbox" id="cb-${item.anchor}" name="cb-${item.anchor}" d-idx="${idx}" value="${i18n(item.anchor)}" checked /><label for="cb-${item.anchor}">${i18n(item.text)}</label></div>`);
        });
        Array.from(_self.root.querySelectorAll("[d-i18n]")).forEach(e => {
            e.textContent = i18n(e.textContent);
        });
    },
    onClickSubmit(_self) {
        let ret = _self.options.filterItems.filter((_, idx) => {
            return _self.root.querySelector(`fieldset input[d-idx="${idx}"]`)?.checked;
        });
        _self.close(ret);
    },
    onClickCancel(_self) {
        _self.close();
    }
};

const GlobalConfigUIXML = `<!--template XML-->
<style>
    .config-ui-dialog {
        width: 90%;
        height: 90%;
        padding: 0.1rem;
    }
    .config-ui-dialog > h1 {
        margin: 0 0 0.5em 0;
        font-size: 1em;
        user-select: none;
    }
    .config-header-bar {
        float: right;
    }
    .config-global-panel {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        justify-items: flex-start;
        width: 100%;
        height: 100%;
        overflow: scroll;
    }
    .config-global-panel :not(input) {
        user-select: none;
    }
    .config-global-panel > [d-anchor] {
        font-weight: bolder;
        font-size: 0.9em;
        background: rgba(128, 128, 128, 0.1);
        padding: 0 0 0.05rem 0;
    }
    .config-global-panel > [d-anchor]:hover {
        font-weight: bolder;
        font-size: 0.9em;
        background: rgba(128, 128, 128, 0.3);
    }
    .config-global-panel > [d-anchor] + div {
        margin: 0.5em 1em;
    }
</style>
<div class="config-ui-dialog">
    <h1>
        <span d-i18n>Preference</span>
        <div class="config-header-bar">
            <button d-i18n d-click="onClickExport">Export</button>&nbsp;
            <button d-i18n d-click="onClickImport">Import</button>&nbsp;
            <button d-i18n d-click="onClickGetPreset">Get Preset</button>&nbsp;
            <button d-i18n d-click="onClickClose">Close</button>
        </div>
    </h1>
    <div class="config-global-panel">
    </div>
</div>
`;

async function onSelectItem(_self, _node, _anchor) {
    let list = configItems.map(item => i18n(item.text));
    let selectIndex = await popup(list, _node, { style: "font-size: 0.9em !important;"});
    let item = (!isNaN(selectIndex)) && configItems[selectIndex];
    if (item) {
        let node = _self.root.querySelector(`.config-global-panel > [d-anchor="${item.anchor}"]`);
        node && node.scrollIntoView(true);
    }
}

const ConfigUIOptions = {
    blurToClose: undefined,
    onInitialize(_self) {
        let container = _self.root.querySelector(".config-global-panel");
        let doc = new DocumentFragment();
        doc && configItems.forEach((item) => {
            let div = document.createElement("div");
            div.setAttribute("d-anchor", item.anchor);
            div.setAttribute("d-click", "onSelectItem");
            div.textContent = i18n(item.text);
            doc.appendChild(div)
            div = document.createElement("div");
            try {
                let exopt = (typeof item.init === "function") && item.init(_self, div);
                exopt && Object.assign(_self.options, exopt);
            } catch (err) {
                console.warn("Exception raised in initialize the configuration UI", item.text, err);
            }
            doc.appendChild(div);
        });
        Array.from(_self.root.querySelectorAll("[d-i18n]")).forEach(e => {
            e.textContent = i18n(e.textContent);
        });
        container && container.appendChild(doc);
    },
    onSelectItem,
    onclose(_self) {
        if (_self.$changeAddon) {
            Promise.resolve().then(() => $felisApp.view.resetViewer());
        }
    },
    onClickClose(_self) {
        _self.close();
    },
    onClickGetPreset() {
        $felisApp.hostAdapter.openWebPage("https://github.com/season-studio/felisMindmap.assets/tree/master/Preference%20Preset");
    },
    async onClickExport(_self) {
        try {
            let supportItems = configItems.filter(e => typeof e.export === "function");
            if (supportItems.length <= 0) {
                $felisApp.TipKits.tip(i18n("Nothing can be export."), {type:"info", timeout:1000});
            } else if (supportItems.length > 1) {
                supportItems = await dialog(ExportSelectionUIXML, Object.assign({filterItems: supportItems}, ExportSelectionUIOptions));
            }
            if (supportItems?.length > 0) {
                let json = {};
                await Promise.all(supportItems.map(async(item) => {
                    json[item.anchor] = await Promise.resolve(item.export(_self));
                }));
                json = new Blob([JSON.stringify(json)], {type:"application/json"});
                await $felisApp.hostAdapter.saveToFile(json, "", ".json");
            } else {
                $felisApp.TipKits.tip(i18n("Nothing exported."), {type:"info", timeout:1000});
            }
        } catch(error) {
            console.error(error);
            $felisApp.TipKits.tip(i18n("The preset incorrect!"), {type:"error", timeout:1000});
        }
    },
    async onClickImport(_self) {
        let json = await $felisApp.hostAdapter.openFile(".json");
        try {
            json = JSON.parse(await json.text());
            for (let key in json) {
                let importFn = configItems.find(e => e.anchor === key)?.import;
                if (typeof importFn === "function") {
                    let ret = importFn(_self, json[key]);
                    if (ret instanceof Promise) {
                        await ret;
                    }
                }
            }
            $felisApp.TipKits.tip(i18n("Preet imported."), {type:"info", timeout:1000});
        } catch(error) {
            console.error(error);
            $felisApp.TipKits.tip(i18n("The preset incorrect!"), {type:"error", timeout:1000});
        }
    }
}

export function showConfigUI() {
    return dialog(GlobalConfigUIXML, ConfigUIOptions);
}
