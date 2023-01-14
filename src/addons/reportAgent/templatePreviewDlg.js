import { $T } from "../locale";
import { ServiceHost } from "./common";
import { localeInfo } from "./localeInfo";

const TemplatePreviewDialogXML = `<!--template XML-->
<style>
    .template-preview-dialog {
        width: 90%;
        height: 60%;
        padding: 0.1rem;
    }
    .template-preview-dialog-panel {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        justify-items: flex-start;
        width: 100%;
        height: 100%;
    }
    .template-preview-dialog-panel > div {
        width: 100%;
    }
    .template-preview-dialog-header {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        justify-items: center;
        align-items: center;
    }
    .template-preview-dialog-close {
        padding: 3px 6px;
        border-radius: 6px;
        border: 0px;
        color: #777;
        font-size: 0.7em;
        background-color: transparent;
        display: flex;
        justify-content: center;
        justify-items: center;
    }
    .template-preview-dialog-close:hover {
        background-color: #ccc;
        color: #fff;
    }
    .template-preview-list-panel {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        justify-items: flex-start;
        align-items: center;
        flex-wrap: wrap;
        flex: 1;
        overflow-x: auto;
        overflow-y: scroll;
    }
    .template-preview-list-panel > img {
        margin: 6px;
        box-shadow: 0px 0px 5px #ccc;
    }
    .template-preview-waiting-circle {
        border: none;
        box-sizing: border-box;
        position: relative;
        --box-size: var(--size, 26px);
        --border-size: var(--bsize, calc(var(--box-size) / 10));
        width: var(--box-size);
        height: var(--box-size);
        display: flex;
        justify-content: center;
        justify-items: center;
        align-items: center;
    }
    .template-preview-waiting-circle::after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        width: var(--box-size);
        height: var(--box-size);
        border-width: var(--border-size);
        border-style: solid;
        border-radius: calc(var(--box-size) / 2);
        border-color: var(--color) var(--color) var(--color) transparent;
        box-sizing: border-box;
        animation: template-preview-waiting-ani-frames var(--time, 1s) infinite linear var(--delay, 0s);
    }
    @keyframes template-preview-waiting-ani-frames {
        0%   { transform: rotate(0deg); }
        33%  { transform: rotate(140deg); }
        66%  { transform: rotate(220deg); }
        100% { transform: rotate(360deg); }
    }
</style>
<div class="template-preview-dialog">
    <div class="template-preview-dialog-panel">
        <div class="template-preview-dialog-header">
            <div class="template-preview-dialog-close">{{Close}}</div>
        </div>
        <div class="template-preview-list-panel">
            <div class="template-preview-waiting-circle" style="--size:117px; --color:#eee;">{{Loading}}...</div>
        </div>
    </div>
</div>
`;

function OnThumbLoad(_event) {
    let node = _event.target;
    if (node instanceof Element) {
        node.removeAttribute("style");
        node.removeAttribute("class");
    }
}

async function ListThumbs(_dlg, _rootNode, _templateName) {
    let container = _rootNode.querySelector(".template-preview-list-panel");
    let doc = new DocumentFragment();
    if (container && doc) {
        let resp = await fetch(`${ServiceHost}get-template-thumb-count?t=${encodeURIComponent(_templateName)}`);
        resp = await resp.json();
        if (resp.code === 0) {
            container.innerHTML = "";
            for (let i = 0; i < resp.count; i++) {
                let img = document.createElement("img");
                img.setAttribute("class", "template-preview-waiting-circle");
                img.setAttribute("style", "--size:57px; --color:#eee");
                img.addEventListener("load", OnThumbLoad, { once: true });
                img.setAttribute("src", `${ServiceHost}get-template-thumb?t=${encodeURIComponent(_templateName)}&i=${i}`)
                doc.appendChild(img);
            }
            (resp.count <= 0) 
                ? container.insertAdjacentHTML("beforeend", `<div>${$T("No preview images", localeInfo)}</div>`)
                : container.appendChild(doc);
        }
    }
}

const TemplatePreviewDialogOptions = {
    blurToClose: undefined,
    onInitialize(_self) {
        let closeNode = _self.root.querySelector(".template-preview-dialog-close");
        closeNode?.addEventListener("click", () => {
            _self.close();
        }, { once: true });
        ListThumbs(_self, _self.root, _self.options.template);
    }
}

export function showTemplatePreviewDialog(_templateName) {
    return $felisApp.TipKits.dialog(TemplatePreviewDialogXML.replace(/\{\{(.*?)\}\}/ig, (e, w) => {
        return $T(w||"", localeInfo);
    }), Object.assign({}, TemplatePreviewDialogOptions, {template:_templateName}));
}
