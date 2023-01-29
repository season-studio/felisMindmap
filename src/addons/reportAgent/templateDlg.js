import { $T } from "../locale";
import { ServiceHost } from "./common";
import { localeInfo } from "./localeInfo";
import { showTemplatePreviewDialog } from "./templatePreviewDlg";

const TemplateDialogXML = `<!--template XML-->
<style>
    .template-dialog {
        width: 90%;
        height: 60%;
        padding: 0.1rem;
    }
    .template-dialog-panel {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        justify-items: flex-start;
        width: 100%;
        height: 100%;
    }
    .template-dialog-panel :not(input) {
        user-select: none;
    }
    .template-dialog-panel > div {
        width: 100%;
    }
    .template-dialog-header {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        justify-items: center;
        align-items: center;
    }
    .template-dialog-caption {
        flex: 1;
        text-align: left;
    }
    .template-upload-button {
        padding: 3px 6px;
        border-radius: 4px;
        border: 0px;
        background-color: #ddd;
        color: #999;
        margin-right: 3px;
        display: flex;
        justify-content: center;
        justify-items: center;
        font-size: 0.7em;
    }
    .template-upload-button:hover {
        background-color: #09f;
        color: #fff;
    }
    .template-dialog-close {
        padding: 3px;
        border-radius: 6px;
        border: 0px;
        background-color: transparent;
        fill: #ccc;
        stroke: none;
        margin-left: 3px;
        display: flex;
        justify-content: center;
        justify-items: center;
    }
    .template-dialog-close:hover {
        background-color: #f00;
        fill: #fff;
    }
    .template-list-panel {
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
    .template-item {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        justify-items: flex-start;
        width: 128px;
        overflow: hidden;
        margin: 0.1rem;
        border-radius: 6px;
    }
    .template-item:hover {
        box-shadow: 0px 0px 5px #ccc;
    }
    .template-item > div {
        width: 128px;
        height: 96px;
        box-sizing: border-box;
        border-radius: 6px;
        background-position: center;
        background-repeat: no-repeat;
        background-attachment: local;
        background-size: cover;
        background-origin: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
    }
    .template-item > span {
        padding: 6px 0;
        white-space: nowrap;
        text-align: center;
    }
    .template-item-preview {
        font-size: 0.7em;
        color: #fff;
        padding: 3px 6px;
        display: none;
        border-radius: 6px;
        border: none;
        background-color: #09f;
        position: absolute;
        right: 3px;
        top: 3px;
        opacity: 0.9;
    }
    .template-item:hover .template-item-preview {
        display: unset;
    }
    .template-waiting-circle {
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
    .template-waiting-circle::after {
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
        animation: template-waiting-ani-frames var(--time, 1s) infinite linear var(--delay, 0s);
    }
    @keyframes template-waiting-ani-frames {
        0%   { transform: rotate(0deg); }
        33%  { transform: rotate(140deg); }
        66%  { transform: rotate(220deg); }
        100% { transform: rotate(360deg); }
    }
    .template-list-copyright {
        display: flex;
        justify-content: center;
        align-items: center;
        color: #666;
        flex-direction: column;
        font-size: 0.7em;
    }
    .template-list-copyright a, .template-list-copyright a:hover, .template-list-copyright a:visited {
        color: #666;
    }
    .template-list-copyright a:hover {
        text-decoration: underline;
    }
</style>
<div class="template-dialog">
    <div class="template-dialog-panel">
        <div class="template-dialog-header">
            <div class="template-dialog-caption">{{Choose a template}}</div>
            <div class="template-upload-button">{{Upload}}</div>
            <input placeholder="{{Search}}"></input>
            <div class="template-dialog-close">
                <svg width="22" height="22" viewBox="0 0 96 96" preserveAspectRatio="none">
                    <path d="M 83.7,21.4 75.2,12.9 48.3,39.8 21.4,12.9 12.9,21.4 39.8,48.3 12.9,75.2 21.4,83.7 48.3,56.8 75.2,83.7 83.7,75.2 56.8,48.3 Z"></path>
                </svg>
            </div>
        </div>
        <div class="template-list-panel">
            
        </div>
        <div class="template-list-copyright">
            {{All templates are uploaded by netizens.}}<br />
            <a href="mailto:season-studio@outlook.com">{{Please contact the administrator for any copyright issues.}}</a>
        </div>
    </div>
</div>
`;

function LoadItemThumb(_node, _observer) {
    _node.$empty = false;
    (_observer instanceof IntersectionObserver) && (_observer.unobserve(_node));
    fetch(`${ServiceHost}get-template-thumb?t=${encodeURIComponent(_node.getAttribute("d-item"))}&i=0`).then(r => r.ok ? r.blob() : null).then(r => {
        if (r) {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                let div = _node.querySelector(":scope > div");
                if (div) {
                    div.innerHTML = "";
                    div.style.backgroundImage = `url(${e.target.result})`;
                    div.insertAdjacentHTML("afterbegin", `<div class="template-item-preview">${$T("Preview", localeInfo)}</div>`)
                }
            };
            fileReader.readAsDataURL(r);
        }
    });
}

function OnWatchVisiblity(_entries, _observer) {
    _entries.forEach(item => {
        if (item.isIntersecting && item.target && item.target.$empty) {
            LoadItemThumb(item.target, _observer);
        }
    })
}

async function ListTemplates(_dlg, _rootNode) {
    let container = _rootNode.querySelector(".template-list-panel");
    let doc = new DocumentFragment();
    if (container && doc) {
        let inputNode = _rootNode.querySelector("input");
        container.innerHTML = "";
        _dlg.$observer?.disconnect();
        container.insertAdjacentHTML("beforeend", `<div class="template-waiting-circle" style="--size:117px; --color:#eee;">${$T("Loading", localeInfo)}...</div>`);
        let resp = await fetch(`${ServiceHost}list-templates?w=${inputNode?.value || ""}`);
        resp = await resp.json();
        container.innerHTML = "";
        if ((0 === resp.code) && (resp.list instanceof Array)) {
            if (resp.list.length > 0) {
                resp.list.forEach((item, index) => {
                    let itemDiv = document.createElement("div");
                    itemDiv.$empty = true;
                    itemDiv.setAttribute("class", "template-item");
                    itemDiv.setAttribute("d-item", item.id);
                    itemDiv.setAttribute("d-index", index);
                    itemDiv.insertAdjacentHTML("beforeend", `<div><div class="template-waiting-circle" style="--size:57px; --color:#eee"></div></div><span>${item.name}</span>`);
                    doc.appendChild(itemDiv);
                    _dlg.$observer?.observe(itemDiv);
                });
                container.appendChild(doc);
            } else {
                container.insertAdjacentHTML("beforeend", `<div>${$T("No template matched", localeInfo)}</div>`);
            }
        }
    }
}

function OnUploadClick() {
    const inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = ".pptx";
    inputElement.addEventListener("change", async () => { 
        const files = inputElement.files;
        if (files.length > 0) {
            let waitDlg = $felisApp.TipKits.showWaitDialog($T("Uploading", localeInfo) + "...");
            try
            {
                let file = files[0];
                let name = String(file.name || "").trim();
                let type = "pptx";
                if (name) {
                    let pos = name.lastIndexOf(".");
                    if (pos > 0) {
                        type = name.substring(pos + 1);
                        name = name.substring(0, pos);
                    }
                }
                let resp = await fetch(`${ServiceHost}upload-template?n=${encodeURIComponent(name)}&t=${encodeURIComponent(type)}`, {
                    method: "POST",
                    body: file,
                    header: {
                        'Content-Type': 'application/octet-stream'
                    }
                });
                if (!resp.ok) {
                    throw $T("System Error", localeInfo);
                }
                let json = await resp.json();
                if (json.code === 0) {
                    await $felisApp.TipKits.confirm($T("Upload Success.\nThe template will be valid after being checked manually for security reason.\nDon\'t upload the same template again.", localeInfo), { icon: "info", buttons: ["OK"]});
                } else {
                    throw json.msg;
                }
            } catch (err) {
                console.error(err);
                await $felisApp.TipKits.confirm(`${$T("Uploading Failed", localeInfo)}\n${err instanceof Error ? $T("System Error", localeInfo) : err}`, { icon: "error", buttons: ["OK"]});
            }
            finally {
                waitDlg?.close();
            }
        }
    });
    inputElement.click();
}

function OnTemplateClick(_event) {
    let isPreview = false;
    for (let node of _event.composedPath()) {
        if (node.classList.contains("template-item-preview")) {
            isPreview = true;
        } else if (node.classList.contains("template-item")) {
            if (isPreview) {
                showTemplatePreviewDialog(node.getAttribute("d-item"));
            } else {
                this.close(node.getAttribute("d-item"));
            }
            break;
        } else if (node.classList.contains("template-list-panel")) {
            break;
        }
    }
}

function OnKeydown(_event) {
    if (_event.keyCode === 13) {
        ListTemplates(this, this.root);
    }
}

const TemplateDialogOptions = {
    blurToClose: undefined,
    onInitialize(_self) {
        let closeNode = _self.root.querySelector(".template-dialog-close");
        closeNode?.addEventListener("click", () => {
            _self.close();
        }, { once: true });
        _self.$observer = new IntersectionObserver(OnWatchVisiblity);
        ListTemplates(_self, _self.root);
        _self.$templateClickFn = OnTemplateClick.bind(_self);
        _self.root.querySelector(".template-list-panel")?.addEventListener("click", _self.$templateClickFn);
        _self.root.querySelector(".template-upload-button")?.addEventListener("click", OnUploadClick);
        _self.$inputDone = OnKeydown.bind(_self);
        _self.root.querySelector("input")?.addEventListener("keydown", _self.$inputDone);
    },
    onclose(_self) {
        if (_self.$observer) {
            _self.$observer.disconnect();
            _self.$observer = undefined;
            delete _self.$observer;
        }
        _self.root.querySelector(".template-upload-button")?.removeEventListener("click", OnUploadClick);
        _self.root.querySelector(".template-list-panel")?.removeEventListener("click", _self.$templateClickFn);
        _self.$templateClickFn = undefined;
        _self.root.querySelector("input")?.removeEventListener("keydown", _self.$inputDone);
        _self.$inputDone = undefined;
    }
}

export function showTemplateDialog() {
    return $felisApp.TipKits.dialog(TemplateDialogXML.replace(/\{\{(.*?)\}\}/ig, (e, w) => {
        return $T(w||"", localeInfo);
    }), TemplateDialogOptions);
}
