import { cloneObject } from "../../thirdpart/toolkits/src/cloneObject";
import { i18n } from "../../thirdpart/toolkits/src/i18n";
import input from "../../thirdpart/toolkits/src/tip/input";
import { confirm } from "../../thirdpart/toolkits/src/tip";
import { CustomDocument } from "./customDocument";
import { activeSearchBar } from "./searchBar";
import { activeTopicBar } from "./topicBar";
import popup from "../../thirdpart/toolkits/src/tip/popup";
import { pickFile } from "../../thirdpart/toolkits/src/fileDlgKit";
import fileFormats from "../fileFormats";
import dialog from "../../thirdpart/toolkits/src/tip/dialog";
import tip from "../../thirdpart/toolkits/src/tip/tip";
import { getConfiguration, getDocumentFilePath, newMindmap, notifySaveByHost, openMindmap, saveToFile, setConfiguration, setDocumentFilePath, writeToFile } from "../common/hostAdapter";
import { showConfigUI } from "./configUI";
import showWaitDialog from "./waitDlg";
import { activeTopicGraphicStyleDialog } from "./graphicStyleDlg";

function tipNeedFocusTopic() {
    tip(i18n("Must select a topic first"), {
        type: "warn",
        timeout: 1000
    });
}

export class MenuManager {
    #barNode;

    static DefaultMenus = [{
        id: "file",
        title: "File",
        menus: [{
            id: "file.new",
            title: "New",
            action: "newFile",
            shortcut: "Ctrl+N"
        }, {
            id: "file.open",
            title: "Open",
            action: "openMindmap",
            shortcut: "Ctrl+O"
        }, {
            id: "file.save",
            title: "Save",
            action: "saveMindmap",
            shortcut: "Ctrl+S"
        }, {
            id: "file.saveas",
            title: "Save as",
            action: "saveMindmapAs"
        }, {}, {
            id: "file.export",
            title: "Export As",
            menus: [{
                id: "file.export.png",
                title: "PNG",
                action: "exportAsPng"
            }]
        }, {}, {
            id: "file.preference",
            title: "Preference",
            action: "configPreference"
        }]
    }, {
        id: "edit",
        title: "Edit",
        menus: [{
            id: "edit.undo",
            title: "Undo",
            action: "undo",
            shortcut: "Ctrl+Z"
        }, {
            id: "edit.redo",
            title: "Redo",
            action: "redo",
            shortcut: "Ctrl+Y"
        }, {}, {
            id: "edit.copy",
            title: "Copy Topic",
            action: "copyTopic",
            shortcut: "Ctrl+C"
        }, {
            id: "edit.cut",
            title: "Cut Topic",
            action: "cutTopic",
            shortcut: "Ctrl+X"
        }, {
            id: "edit.paste",
            title: "Paste Topic",
            action: "pasteTopic",
            shortcut: "Ctrl+V"
        }, {}, {
            id: "edit.search",
            title: "Search",
            action: "searchTopic",
            shortcut: "Ctrl+F"
        }, {
            id: "edit.select.roottopic",
            title: "Select Root Topic",
            action: "selectRootTopic",
            shortcut: "Home"
        }, {} , {
            id: "edit.create.childtopic",
            title: "Add Child Topic",
            action: "createChildTopic",
            shortcut: "Tab"
        }, {
            id: "edit.create.siblingtopic",
            title: "Add Sibling Topic",
            action: "createSiblingTopic",
            shortcut: "Enter"
        }, {}, {
            id: "edit.deletetopic",
            title: "Delete Topic",
            action: "deleteTopic",
            shortcut: "Delete"
        }, {}, {
            id: "edit.tolefttopic",
            title: "Goto Left Topic",
            action: "gotoLeftTopic",
            shortcut: "ArrowLeft"
        }, {
            id: "edit.torighttopic",
            title: "Goto Right Topic",
            action: "gotoRightTopic",
            shortcut: "ArrowRight"
        }, {
            id: "edit.toprevtopic",
            title: "Goto Previous Sibling",
            action: "gotoPrevSibling",
            shortcut: "ArrowUp"
        }, {
            id: "edit.tonexttopic",
            title: "Goto Next Sibling",
            action: "gotoNextSibling",
            shortcut: "ArrowDown"
        }, {}, {
            id: "edit.title",
            title: "Edit Topic's Title",
            action: "editTopicTitle",
            shortcut: "F2"
        }, {
            id: "edit.component",
            title: "Edit Topic's Components",
            action: "editComponents",
            shortcut: "F10"
        }, {
            id: "edit.graphicstyle",
            title: "Edit Graphic Style",
            action: "editGraphicStyle",
        }]
    }, {
        id: "view",
        title: "View",
        menus: [{
            id: "view.tocenter.root",
            title: "Take root topic to center",
            action: "rootToCenter"
        }, {
            id: "view.tocenter.focus",
            title: "Take focus topic to center",
            action: "focusToCenter"
        }, {}, {
            id: "view.zoom.reset",
            title: "Reset the scale",
            action: "zoomReset"
        }, {
            id: "view.zoom.in",
            title: "Zoom In",
            action: "zoomIn"
        }, {
            id: "view.zoom.out",
            title: "Zoom Out",
            action: "zoomOut"
        }, {}, {
            id: "view.fold",
            title: "Fold",
            menus: [{
                id: "view.fold.none",
                title: "Expand All",
                action: "foldNone"
            }, {}, {
                id: "view.fold.1",
                title: "Level 1",
                action: "fold1"
            }, {
                id: "view.fold.2",
                title: "Level 2",
                action: "fold2"
            }, {
                id: "view.fold.3",
                title: "Level 3",
                action: "fold3"
            }]
        }]
    }, {
        id: "addons",
        title: "Addons"
    }, {}, {
        id: "sheets",
        title: "Sheets",
        nodeClass: "sheet-top-menu",
        menus: [{
            id: "sheets.switch",
            title: "Switch sheets",
            action: "switchSheets"
        }, {}, {
            id: "sheets.create",
            title: "Create a new sheet",
            action: "createSheet"
        }, {
            id: "sheets.clone",
            title: "Clone the current sheet",
            action: "cloneSheet"
        }, {
            id: "sheets.rename",
            title: "Rename the current sheet",
            action: "renameSheet"
        }, {
            id: "sheets.delete",
            title: "Delete the current sheet",
            action: "deleteSheet"
        }]
    }];

    constructor(_barNode) {
        this.#barNode = _barNode;
        _barNode.addEventListener("click", this["@click"].bind(this));
        this.#resetMenus();
        Object.getOwnPropertyNames(MenuManager).forEach(item => {
            if (item.startsWith("@@")) {
                let fn = MenuManager[item];
                (typeof fn === "function") && $felisApp.registerAction(item.substring(2), fn);
            }
        });
        $felisApp.env.addEventListener("topic-event-view-switch-sheet", async (_event) => {
            const sheet = _event.detail && _event.detail.sheet;
            sheet && await this.updateMenu("sheets", {
                title: `<span>${sheet.title}</span>`,
                titleAsHTML: true
            });
        });
        $felisApp.env.addEventListener("topic-event-refresh-display", async () => {
            let config = await getConfiguration("menu-shortcut");
            config || (config = {});
            for (let menuID in config) {
                await this.updateMenu(menuID, { shortcut: config[menuID] }, true);
            }
        });
    }

    async registerMenus(_menus, _parentID, _refID) {
        let config = await getConfiguration("menu-shortcut");
        config || (config = {});
        let parentNode = (_parentID && this.#barNode.querySelector(`.listitem[d-menu-id="${_parentID}"]`));
        if (parentNode) {
            let menuGroup = parentNode.querySelector(":scope > .mindmap-menugroup");
            if (!menuGroup) {
                menuGroup = document.createElement("div");
                if (menuGroup) {
                    menuGroup.setAttribute("class", "mindmap-menugroup");
                    parentNode.appendChild(menuGroup);
                }
            }
            parentNode = menuGroup;
        }
        parentNode || (parentNode = this.#barNode);
        let refNode = _refID && parentNode.querySelector(`:scope > .listitem[d-menu-id="${_refID}"]`);
        this.#createMenuNodes(_menus, parentNode, refNode, parentNode === this.#barNode, config);
    }

    unregisterMenus(_menuIDs) {
        (_menuIDs instanceof Array) || (_menuIDs = [_menuIDs]);
        _menuIDs.forEach(item => {
            let menuNode = this.#barNode.querySelector(`.listitem[d-menu-id="${item}"]`);
            menuNode && menuNode.remove();
        });
    }

    async updateMenu(_menuID, _data, _ignoreUpdate) {
        let menuNode = this.#barNode.querySelector(`.listitem[d-menu-id="${_menuID}"]`);
        if (menuNode) {
            if (typeof _data === "object") {
                this.#setMenuData(menuNode, _data);
                if ((!_ignoreUpdate) && ("shortcut" in _data)) {
                    let config = (await getConfiguration("menu-shortcut") || {});
                    config[_menuID] = _data.shortcut;
                    await setConfiguration("menu-shortcut", config);
                }
            } else {
                let textNode = document.evaluate('text()', menuNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                textNode && (textNode.textContent = _data);
            }
        }
    }

    getMenuNode(_menuID) {
        return this.#barNode.querySelector(`.listitem[d-menu-id="${_menuID}"]`);
    }

    getMenu(_menuID) {
        let node = this.#barNode.querySelector(`.listitem[d-menu-id="${_menuID}"]`);
        if (node) {
            let textNode = document.evaluate('text()', node, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let shortcutNode = node.querySelector(":scope > code[d-menu-reserve]");
            return {
                id: node.getAttribute("d-menu-id"),
                title: (textNode ? textNode.textContent : ""),
                shortcut: (shortcutNode ? String(shortcutNode.textContent).trim() : ""),
                action: node.getAttribute("d-menu-action")
            };
        }
    }

    getMenusByShortcut(_shortcut) {
        let list = document.evaluate(`.//code[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="${String(_shortcut).toLowerCase()}"]/parent::*[contains(@class, "listitem")]`, this.#barNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        let ret = [];
        let index = 0;
        let item;
        while (item = list.snapshotItem(index++)) {
            ret.push(item);
        }
        return ret;
    }

    #setMenuData(_menuNode, _data, _shortcutCustomlize) {
        _data.id && _menuNode.setAttribute("d-menu-id", _data.id);
        const id = _menuNode.getAttribute("d-menu-id");
        if (_data.title !== undefined) {
            let textNode = document.evaluate('text()', _menuNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            textNode && textNode.remove();
            let htmlNode = _menuNode.querySelectorAll(":scope > :not([d-menu-reserve]):not(.mindmap-menugroup)");
            (htmlNode instanceof NodeList) && htmlNode.forEach(item => item.remove());
            _data.titleAsHTML 
                ? _menuNode.insertAdjacentHTML("afterbegin", _data.title) 
                : _menuNode.prepend(document.createTextNode(i18n(_data.title)));
        }
        (_data.action !== undefined) && _menuNode.setAttribute("d-menu-action", _data.action);
        (_data.arg !== undefined) && _menuNode.setAttribute("d-menu-arg", _data.arg);
        _shortcutCustomlize && (id in _shortcutCustomlize) && (_data.shortcut = _shortcutCustomlize[_menuNode.getAttribute("d-menu-id")]);
        if ("shortcut" in _data) {
            let span = _menuNode.querySelector(":scope > code[d-menu-reserve]");
            let oriShortcut = span && String(span.textContent).toLowerCase().trim();
            let newShortcut = String(_data.shortcut).trim();
            let newShortcutNocase = newShortcut.toLowerCase();
            if (newShortcutNocase != oriShortcut) {
                if (newShortcut) {
                    let list = document.evaluate(`.//code[translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="${newShortcutNocase}"]`, this.#barNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    list.snapshotLength && (newShortcut = (_data.shortcut = undefined));
                }
                oriShortcut && (oriShortcut in $felisApp.view.UIControlMap) && (delete $felisApp.view.UIControlMap[oriShortcut]);
                if (newShortcut) {
                    span || (span = document.createElement("code"));
                    span.setAttribute("d-menu-reserve", "");
                    span.textContent = _data.shortcut;
                    _menuNode.appendChild(span);
                    $felisApp.view.UIControlMap[String(_data.shortcut).toLowerCase()] = { 
                        action: "call-app-action", 
                        args: [_menuNode.getAttribute("d-menu-action")]
                    };
                } else if (span) {
                    span.remove();
                }
            }
        }
        if (_data.image !== undefined) {
            if (_data.image) {
                let imgNode = document.createElement("img");
                imgNode.setAttribute("src", _data.image);
                imgNode.setAttribute("d-menu-reserve", "");
                _menuNode.insertAdjacentElement("afterbegin", imgNode);
            } else {
                let imgNode = _menuNode.querySelector(":scope > img[d-menu-reserve]");
                imgNode && imgNode.remove();
            }
        }
        if (_data.nodeClass !== undefined) {
            _menuNode.setAttribute("class", _data.nodeClass ? `listitem ${_data.nodeClass}` : "listitem");
        }
    }

    * enumerateMenus(_all) {
        for (let item of this.#barNode.querySelectorAll(_all ? ".listitem" : ".listitem[d-menu-action]")) {
            let textNode = document.evaluate('text()', item, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            let shortcutNode = item.querySelector(":scope > code[d-menu-reserve]");
            yield {
                id: item.getAttribute("d-menu-id"),
                title: (textNode ? textNode.textContent : ""),
                shortcut: (shortcutNode ? String(shortcutNode.textContent).trim() : ""),
                action: item.getAttribute("d-menu-action")
            };
        }
    }

    #createMenuNodes(_menus, _parentNode, _refNode, _topMenu, _config) {
        (_menus instanceof Array) || (_menus = [_menus]);
        let df = new DocumentFragment();
        _menus.forEach(item => {
            let menuNode = document.createElement("div");
            if (item.id && item.title) {
                menuNode.setAttribute("class", "listitem");
                this.#setMenuData(menuNode, item, _config);
                item.image && _parentNode.setAttribute("d-menu-image", "");
                if (item.menus instanceof Array) {
                    let subGroupNode = document.createElement("div");
                    subGroupNode.setAttribute("class", "mindmap-menugroup");
                    this.#createMenuNodes(item.menus, subGroupNode, undefined, false, _config);
                    menuNode.appendChild(subGroupNode);
                    if (!_topMenu) {
                        subGroupNode.setAttribute("d-menugroup-right", "");
                        menuNode.setAttribute("d-menu-suffix", "▶");
                    }
                }
            } else {
                menuNode.setAttribute("class", "separater-line");
                _topMenu && menuNode.setAttribute("d-horizontal", "");
                menuNode.insertAdjacentHTML("afterbegin", "&nbsp;");
                item.id && menuNode.setAttribute("d-menu-id", item.id);
            }
            df.appendChild(menuNode);
        });
        (_refNode instanceof Node) ? _refNode.insertAdjacentElement("beforebegin", df) : _parentNode.appendChild(df);
    }

    #resetMenus() {
        this.#barNode.innerHTML = "";
        this.registerMenus(MenuManager.DefaultMenus);
    }

    ["@click"](_event) {
        for (let item of _event.composedPath()) {
            if ((item instanceof Node) && item.classList && item.classList.contains("listitem")) {
                let action = item.getAttribute("d-menu-action");
                if (action) {
                    $felisApp.callAction(action, item.getAttribute("d-menu-arg") || undefined);
                    _event.currentTarget.removeAttribute("d-menu-active");
                    return;
                }
                break;
            }
        }
        _event.currentTarget.setAttribute("d-menu-active", "");
    }

    static ["@@undo"]() {
        $felisApp.view.undo();
    }

    static ["@@redo"]() {
        $felisApp.view.redo();
    }

    static ["@@createChildTopic"]() {
        $felisApp.view.focusTopic
            ? $felisApp.view.createChildTopic()
            : tipNeedFocusTopic();
    }

    static ["@@createSiblingTopic"]() {
        $felisApp.view.focusTopic
            ? $felisApp.view.createSiblingTopic()
            : tipNeedFocusTopic();
    }

    static ["@@deleteTopic"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view.deleteFocusTopic()
            : tipNeedFocusTopic();
    }

    static ["@@editComponents"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? activeTopicBar($felisApp.view, true)
            : tipNeedFocusTopic();
    }

    static ["@@editGraphicStyle"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? activeTopicGraphicStyleDialog($felisApp.view, $felisApp.view.focusTopic)
            : tipNeedFocusTopic();
    }

    static ["@@gotoLeftTopic"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view["goto-topic-with-direction"](null, "left")
            : tipNeedFocusTopic();
    }

    static ["@@gotoRightTopic"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view["goto-topic-with-direction"](null, "right")
            : tipNeedFocusTopic();
    }

    static ["@@gotoPrevSibling"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view.gotoPreviousSiblingTopic()
            : tipNeedFocusTopic();
    }

    static ["@@gotoNextSibling"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view.gotoNextSiblingTopic()
            : tipNeedFocusTopic();
    }

    static ["@@rootToCenter"]() {
        $felisApp.view.rootTopic.showInCenterOfView();
    }

    static ["@@focusToCenter"]() {
        let topic = $felisApp.view.focusTopic;
        topic && topic.showInCenterOfView();
    }

    static ["@@zoomReset"]() {
        $felisApp.view.scale = 1;
    }

    static ["@@zoomIn"]() {
        let scale = $felisApp.view.scale + 0.02;
        $felisApp.view.scale = Math.min(Math.max(scale, 0.1), 2);
    }

    static ["@@zoomOut"]() {
        let scale = $felisApp.view.scale - 0.02;
        $felisApp.view.scale = Math.min(Math.max(scale, 0.1), 2);
    }

    static ["@@foldNone"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.render(Number.MAX_SAFE_INTEGER);
    }

    static ["@@fold1"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.render(1);
    }

    static ["@@fold2"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.render(2);
    }

    static ["@@fold3"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.render(3);
    }

    static ["@@copyTopic"]() {
        $felisApp.view.focusTopic
            ? $felisApp.view.copyTopic()
            : tipNeedFocusTopic();
    }

    static ["@@cutTopic"]() {
        $felisApp.env.fireEvent("topic-event-cancel-edit");
        $felisApp.view.focusTopic
            ? $felisApp.view.cutTopic()
            : tipNeedFocusTopic();
    }

    static ["@@pasteTopic"]() {
        $felisApp.view.focusTopic
            ? $felisApp.view.pasteTopic()
            : tipNeedFocusTopic();
    }

    static ["@@searchTopic"]() {
        activeSearchBar();
    }

    static ["@@createSheet"]() {
        let sheet = {
            title: `${i18n("new sheet")} ${$felisApp.doc.sheetCount + 1}`,
            topic: cloneObject({}, CustomDocument.DefaultTopicTemplate)
        };
        $felisApp.doc.addSheet(sheet);
        $felisApp.doc.switchToSheet(sheet.id, true);
    }

    static ["@@cloneSheet"]() {
        let curSheet = $felisApp.doc.getSheetByID($felisApp.view.sheetID);
        let sheet = {
            title: curSheet ? `${curSheet.title} ${i18n("stub")}` : `${i18n("new sheet")} ${$felisApp.doc.sheetCount + 1}`,
            topic: cloneObject({}, $felisApp.view.rootTopic.exportTopicData())
        };
        $felisApp.doc.addSheet(sheet);
        $felisApp.doc.switchToSheet(sheet.id, true);
    }

    static async ["@@renameSheet"]() {
        let curSheet = $felisApp.doc.getSheetByID($felisApp.view.sheetID);
        if (curSheet) {
            let ret = await input(i18n("Rename the sheet"), {
                default: curSheet.title,
                tip: i18n("The name of the sheet"),
                submitText: i18n("Submit"),
                cancelText: i18n("Cancel")
            });
            if (ret !== undefined) {
                await $felisApp.menu.updateMenu("sheets", {
                    title: `<span>${(curSheet.title = String(ret))}</span>`,
                    titleAsHTML: true
                });
            }
        }
    }

    static async ["@@deleteSheet"]() {
        let ret = await confirm(i18n("Are you sure to delete this sheet?\nThis is an irrepealable action!"), {
            icon: "warn",
            buttons: [i18n("Yes"), i18n("No")],
            default: 1
        });
        (ret === 0) && $felisApp.doc.removeSheet($felisApp.view.sheetID, true);
    }

    static async ["@@switchSheets"]() {
        let list = [];
        for (let item of $felisApp.doc.enumerateSheet()) {
            list.push({
                id: item.sheet.id,
                toString: (function () { return this; }).bind(item.sheet.title)
            });
        }
        let node = $felisApp.menu.getMenuNode("sheets");
        let ret = await popup(list, node, { style: "font-size: 0.13rem !important;"});
        if (!isNaN(ret)) {
            let targetID = list[ret].id;
            ($felisApp.view.sheetID !== targetID) && $felisApp.doc.switchToSheet(targetID, true);
        }
    }

    static async ["@@checkAndSaveModifiedDocument"]() {
        if ($felisApp.view.dirty || $felisApp.doc.dirty) {
            let ret = await confirm(i18n("The current mindmap is dirty.\nDo you want to save it first?"), {
                icon: "question",
                buttons: [i18n("Yes"), i18n("No"), i18n("Cancel")],
                default: 2
            });
            switch (ret) {
                case 0: {
                    let ret = $felisApp.callAction("saveMindmap");
                    (ret instanceof Promise) && await ret;
                    return true;
                }; break;

                case 1: 
                    return true;
                    break;

                default: 
                    return false;
                    break;
            }
        } else {
            return true;
        }
    }

    static async ["@@openMindmap"]() {
        openMindmap(async () => {
            if (await $felisApp.callAction("checkAndSaveModifiedDocument")) {
                let file = await pickFile();
                await MenuManager["@@openMindmap-detail"](file.name, file);
                return file.name;
            }
        });
    }

    static async ["@@openMindmap-detail"](_filePath, _blob) {
        try {
            let fileName = String(_filePath);
            let fileType = fileName.lastIndexOf(".");
            fileType = (((_blob instanceof Blob) && _blob.$forceType) || (fileType >= 0 ? fileName.substring(fileType) : ""));
            console.info("openMindmap [", _filePath, "] as", fileType);
            let fileProvider = (fileFormats(fileType) || fileFormats(fileType = ".felis"));
            fileProvider && (typeof fileProvider.constructor === "function") && (fileProvider = new fileProvider.constructor());
            await fileProvider.load(_blob);
            await $felisApp.doc.newDocument(async (_doc) => {
                for (let itemPath of fileProvider.enumerateAttachments()) {
                    let itemContent = await fileProvider.readContent(itemPath);
                    itemContent && _doc.setAttachment(itemPath, itemContent);
                }
                let sheets = await fileProvider.readSheets();
                (sheets instanceof Array) || (sheets && (sheets = [sheets]));
                sheets && sheets.forEach((sheet) => {
                    _doc.addSheet(sheet);
                });
            }, $felisApp.doc);
        } catch(err) {
            $felisApp.env.warn("Exception raised in openMindmap-detail", err);
            await $felisApp.doc.newDocument();
        }
    }

    static ["@@newFile"]() {
        return newMindmap(MenuManager["@@newFile-detail"]);
    }

    static async ["@@newFile-detail"]() {
        if (await $felisApp.callAction("checkAndSaveModifiedDocument")) {
            try {
                let templateList = await fetch("./templates/list.json").then(r => r.json());
                if (templateList instanceof Array) {
                    let selected = await dialog(`<!--template XML-->
                        <style>
                            .newfile-panel {
                                display: flex;
                                flex-direction: column;
                                justify-content: flex-start;
                                justify-items: flex-start;
                                flex-wrap: wrap;
                                min-width: 50% !important;
                                max-width: 90% !important;
                                font-size: 0.1rem;
                                user-select: none;
                            }
                            .openfile-button {
                                padding: 0.5em;
                                border: 1px solid #ccc;
                                border-radius: 0.3em;
                            }
                            .openfile-button:hover {
                                background: linear-gradient(0deg,rgba(0,117,255,.9) 26%,rgba(0,157,255,.9) 90%,rgba(0,170,255,.9));
                                color: #fff;
                            }
                            .openfile-button:active {
                                background: linear-gradient(180deg,rgba(0,117,255,.9) 26%,rgba(0,157,255,.9) 90%,rgba(0,170,255,.9));
                                color: #fff;
                            }
                            .template-list {
                                display: flex;
                                flex-direction: row;
                                justify-content: space-around;
                                justify-items: flex-start;
                                flex-wrap: wrap;
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
                                height: 128px;
                                box-sizing: border-box;
                                border-radius: 6px;
                                background-position: center;
                                background-repeat: no-repeat;
                                background-attachment: local;
                                background-size: cover;
                                background-origin: border-box;
                            }
                            .template-item > span {
                                padding: 6px 0;
                                white-space: nowrap;
                                text-align: center;
                            }
                        </style>
                        <div class="newfile-panel">
                            <div class="template-list">
                            </div>
                            <button class="openfile-button" d-click="onAcquireOpen"></button>
                        </div>
                        `, {
                            onInitialize(_self) {
                                const container = _self.root.querySelector(".template-list");
                                container.insertAdjacentHTML("beforeend", `<div class="template-item" d-click="onSelect" d-click-args="-1"><div style="background-image: url(./assets/file-thumb-large.png);"></div><span>${i18n("Empty Topic")}</span></div>`);
                                templateList.forEach((item, index) => {
                                    container.insertAdjacentHTML("beforeend", `<div class="template-item" d-click="onSelect" d-click-args='${index}'><div style="background-image: url(${item.image||"./assets/file-thumb-large.png"});"></div><span>${i18n(item.title)}</span></div>`);
                                });
                                const button = _self.root.querySelector(".openfile-button");
                                button && (button.textContent = i18n("Open Existing Mindmap"));
                            },
                            onSelect(_self, _node, _index) {
                                _self.close(_index);
                            },
                            onAcquireOpen(_self) {
                                _self.close("openMindmap");
                            }
                        });
                    if (selected === "openMindmap") {
                        $felisApp.callAction("openMindmap");
                    } else if (!isNaN(selected = Number(selected))) {
                        if (selected < 0) {
                            await CustomDocument.SetTemplate();
                        } else if (selected = templateList[selected]) {
                            let fileBlob = await fetch(selected.file).then(r => r.blob());
                            if (fileBlob instanceof Blob) {
                                let fileProvider = new (fileFormats(".felis").constructor)();
                                await fileProvider.load(fileBlob);
                                await CustomDocument.SetTemplate(fileProvider);
                            }
                        }
                    }
                } else {
                    throw "Invalid list of the templates";
                }
            } catch (err) {
                tip(`${i18n("Cannot create mindmap from template!")}${err ? "\n" + i18n(err instanceof Error ? err.message : String(err)) : ""}`, {
                    type: "error",
                    timeout: 2000
                });
                await CustomDocument.SetTemplate();
            }
            
            $felisApp.doc.newDocument();
            setDocumentFilePath();

            return true;
        }
    }

    static async ["@@dumpMindmap-toBlob"](_type, _keepWorkState) {
        let fileProvider = (fileFormats(_type) || fileFormats(".felis"));
        fileProvider && (typeof fileProvider.constructor === "function") && (fileProvider = new fileProvider.constructor());
        return fileProvider && $felisApp.doc.saveDocument(async () => {
            let sheets = [];
            for (let sheetItem of $felisApp.doc.enumerateSheet()) {
                sheets.push(sheetItem.sheet);
            }
            await fileProvider.writeSheets(sheets);
            for (let attachment of $felisApp.doc.enumerateAttachment()) {
                attachment.name && await fileProvider.writeContent(attachment.name, attachment.data);
            }
            let thumbImg = await $felisApp.view.exportImage({
                type: "png",
                toBlob: true,
                fill: "#ffffff",
                keepWorkState: !!_keepWorkState
            });
            if (thumbImg && (thumbImg.data instanceof Blob)) {
                await fileProvider.writeContent("Thumbnails\\thumbnail.png", thumbImg.data);
            }
            return await fileProvider.save("mindmap");
        }, _keepWorkState);
    }

    static async ["@@saveMindmap-detail"](_fileName, _needPickFile, _replaceSelf) {
        _fileName = String(_fileName || "");
        const type = _fileName.substring(_fileName.lastIndexOf("."));
        let blob = await MenuManager["@@dumpMindmap-toBlob"](type);
        if (blob instanceof Blob) {
            (_needPickFile || (!_fileName)) ? await saveToFile(blob, _fileName, type, true, _replaceSelf) : await writeToFile(blob, _fileName, true, _replaceSelf);
            $felisApp.doc.clearDirtyFlag((r) => (r + 1));
        } else {
            tip(i18n("Unsupported type of file"), { type: "error", timeout: 2000 });
        }
    }

    static async ["@@saveMindmap"](_fromHost) {
        let fileName = await getDocumentFilePath(true);
        if (fileName) {
            if (("fromHost" === _fromHost) || !await notifySaveByHost())
            {
                await MenuManager["@@saveMindmap-detail"](fileName);
            }
        } else {
            await $felisApp.callAction("saveMindmapAs");
        }
    }

    static async ["@@saveMindmapAs"]() {
        let selected = await dialog(`<!--template XML-->
        <style>
            .file-format-list {
                display: flex;
                flex-direction: row;
                justify-content: space-around;
                justify-items: flex-start;
                flex-wrap: wrap;
                width: 50% !important;
                max-width: 320px !important;
                font-size: 0.1rem;
                user-select: none;
            }
            .file-format-item {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                justify-items: flex-start;
                width: 64px;
                overflow: hidden;
                margin: 0.1rem;
            }
            .file-format-item:hover {
                box-shadow: 0px 0px 5px #ccc;
            }
            .file-format-item > img {
                width: 64px;
                height: 64px;
                box-sizing: border-box;
            }
            .file-format-item > span {
                white-space: nowrap;
                text-align: center;
            }
        </style>
        <div class="file-format-list">
        </div>
        `, {
            blurToClose: undefined,
            onInitialize(_self) {
                const container = _self.root.querySelector(".file-format-list");
                for (let item of fileFormats.enumerate()) {
                    container.insertAdjacentHTML("beforeend", `<div class="file-format-item" d-click="onSelect" d-click-args='"${item.key}"'><img src="${item.provider.image||"./logo/felis-mindmap/logo256.png"}" /><span>${item.provider.name}</span></div>`);
                }
            },
            onSelect(_self, _node, _key) {
                _self.close(_key);
            }
        });
        if (selected) {
            let fileName = await getDocumentFilePath();
            fileName = (fileName ? (fileName + " ").slice(0, fileName.lastIndexOf(".")) : i18n("New_File")) + selected;
            await MenuManager["@@saveMindmap-detail"](fileName, true, true);
        }
    }

    static async ["@@exportAsPng"]() {
        let ret = await $felisApp.view.exportImage({
            type: "png",
            toBlob: true,
            // fill: "#ffffff"
        });
        if (ret && (ret.data instanceof Blob)) {
            let sheet = $felisApp.doc.getSheetByID($felisApp.view.sheetID);
            saveToFile(ret.data, `${sheet ? sheet.title : "mindmap"}.png`, ".png", false);
        }
    }

    static ["@@configPreference"]() {
        return showConfigUI();
    }

    static ["@@editTopicTitle"]() {
        $felisApp.view.editFocusTopic();
    }

    static ["@@selectRootTopic"]() {
        $felisApp.view.gotoRootTopic();
    }

    static ["@@showWaitDialog"]() {
        return showWaitDialog.apply(undefined, Array.prototype.slice.call(arguments, 0));
    }
}