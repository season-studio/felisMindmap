import { i18n } from "../../thirdpart/toolkits/src/i18n";
import dialog from "../../thirdpart/toolkits/src/tip/dialog";
import popup from "../../thirdpart/toolkits/src/tip/popup";
import configAddonsUI from "./configAddonsUI";
import configShortcutUI from "./configShortcutUI";

const GlobalConfigUIXML = `<!--template XML-->
<style>
    .config-ui-dialog {
        width: 90%;
        height: 90%;
        padding: 0.1rem;
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
    <div class="config-global-panel">
        <div id="items">
        </div>
        <div id="work">
        </div>
    </div>
</div>
`;

const configItems = [{
    text: "Addons",
    anchor: "addons",
    fn: configAddonsUI
}, {
    text: "Shortcuts",
    anchor: "shortcuts",
    fn: configShortcutUI
}];

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
                let exopt = (typeof item.fn === "function") && item.fn(_self, div);
                exopt && Object.assign(_self.options, exopt);
            } catch (err) {
                console.warn("Exception raised in initialize the configuration UI", item.text, err);
            }
            doc.appendChild(div);
        });
        container && container.appendChild(doc);
    },
    onSelectItem,
    onclose(_self) {
        if (_self.$changeAddon) {
            Promise.resolve().then(() => $felisApp.view.resetViewer());
        }
    }
}

export function showConfigUI() {
    return dialog(GlobalConfigUIXML, ConfigUIOptions);
}