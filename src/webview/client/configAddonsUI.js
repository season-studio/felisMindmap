import { enumerateAddons } from "./addons";

function onCheckboxChange(e) {
    (e.target instanceof HTMLInputElement) && (this.$activeDefault = e.target.checked);
}

export default function configAddonsUI(_self, _node) {
    let doc = new DocumentFragment();
    for (let addon of enumerateAddons()) {
        let div = document.createElement("div");
        div.setAttribute("class", "addon-config-item");
        div.insertAdjacentHTML("beforeend", `<input type="checkbox" value="${addon.name}" ${addon.$activeDefault ? "checked" : ""} /><label for="${addon.name}">${addon.name + (addon.desc ? " - " + addon.desc : "")}</label>`);
        let checkbox = div.querySelector("input");
        checkbox.addEventListener("change", onCheckboxChange.bind(addon));
        doc.appendChild(div);
    }
    _node.insertAdjacentHTML("afterbegin", `<!--template XML-->
    <style>
        .addon-config-item {
            margin: 0.5em 0;
        }
        .addon-config-item > label {
            margin: 0 0.5em 0 0;
        }
    </style>`);
    _node.setAttribute("style", "display: flex; flex-direction: row; justify-content: flex-start; justify-items: flex-start; flex-wrap: wrap;");
    _node.appendChild(doc);
}