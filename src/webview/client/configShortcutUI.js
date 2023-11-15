import { MindmapViewer } from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";

function showEditShortcut(_container, _global) {
    const id = _container.getAttribute("d-menu-id");
    let shortcut = String(_container.textContent).trim();
    let oriShortcut = shortcut;
    const action = _container.getAttribute("d-menu-action");
    const div = document.createElement("div");
    div.setAttribute("style", "width:100%;height:1em;background:#fff;outline:1px solid #ccc;");
    div.setAttribute("tabindex", -1);
    div.addEventListener("dblclick", e => {
        e.preventDefault();
        e.stopPropagation();
    });
    div.addEventListener("keydown", e => {
        if (String(e.key).toLocaleLowerCase() === "escape") {
            shortcut = oriShortcut;
            div.blur();
        } else if (String(e.key).toLocaleLowerCase() === "backspace") {
            div.textContent = (shortcut = "");
        } else {
            div.textContent = (shortcut = MindmapViewer.getControlMapKey(e, true));
        }
        e.preventDefault();
        e.stopPropagation();
    });
    div.addEventListener("blur", async (e) => {
        shortcut = String(shortcut).trim();
        let list = document.evaluate(`.//td[text()="${shortcut}"]`, _global, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        let item, index = 0;
        if (list.resultType === XPathResult.ORDERED_NODE_SNAPSHOT_TYPE) {
            while (item = list.snapshotItem(index++)) {
                if (item !== _container) {
                    item.textContent = "";
                    let id = item.getAttribute("d-menu-id");
                    await $felisApp.menu.updateMenu(id, { shortcut: null });
                }
            }
        }
        _container.textContent = shortcut;
        if (shortcut !== oriShortcut) {
            oriShortcut = oriShortcut.toLowerCase();
            (oriShortcut in $felisApp.view.UIControlMap) && (delete $felisApp.view.UIControlMap[oriShortcut]);
            await $felisApp.menu.updateMenu(_container.getAttribute("d-menu-id"), { shortcut });
        }
        div.remove();
    });
    div.textContent = shortcut;
    _container.textContent = "";
    _container.appendChild(div);
    div.focus();
}

function onDblclickShortcut(e) {
    for (let target of e.composedPath()) {
        if (target.classList.contains("shortcut-item")) {
            showEditShortcut(target, this);
            break;
        }
    }
}

export default function configShortcutUI(_self, _node) {
    let table = document.createElement("table");
    if (table) {
        table.setAttribute("class", "shortcut-table");
        table.insertAdjacentHTML("beforeend", `<tr style="background-color: #f0f0f0;"><td style="width:50%;">${i18n("Function")}</td><td>${i18n("Shortcut")}</td></tr>`);
        for (let menu of $felisApp.menu.enumerateMenus()) {
            table.insertAdjacentHTML("beforeend", `<tr><td>${menu.title}</td><td class="shortcut-item" d-menu-id="${menu.id}" d-menu-action="${menu.action}">${menu.shortcut}</td></tr>`);
        }
        table.addEventListener("dblclick", onDblclickShortcut.bind(table));
    }
    _node.insertAdjacentHTML("afterbegin", `<!--template XML-->
    <style>
        .shortcut-table {
            width: 100%;
            font-family: 'Courier New', monospace;
            border: none;
        }
        .shortcut-table tr, .shortcut-table th, .shortcut-table td {
            border: none;
            background: transparent;
        }
        .shortcut-table tr:hover {
            background: #eaf7ff;
        }
        .shortcut-item:hover {
            box-shadow: 0 0 5px #5af;
        }
    </style>`);
    _node.appendChild(table);
}

export function exportShortcuts(_self) {
    let ret = {};
    for (let menu of $felisApp.menu.enumerateMenus()) {
        ret[menu.id] = menu.shortcut;
    }
    return ret;
}

export async function importShortcuts(_self, _preset) {
    for (let id in _preset) {
        let shortcut = _preset[id];
        let node = _self.root.querySelector(`td.shortcut-item[d-menu-id="${id}"]`);
        node && (node.textContent = (shortcut||""));
        await $felisApp.menu.updateMenu(id, { shortcut });
    }
}