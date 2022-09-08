import { MindmapViewer, DefaultTopicEventActions, DefaultTopicExtensions } from "mindmap.svg.js";
import * as mindmapSVG from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";
import { readonlyMember } from "../../thirdpart/toolkits/src/readonly";
import { CustomDocument } from "./customDocument";
import { CustomEnvironment } from "./customEnv";
import { CustomViewer } from "./customViewer";
import { MenuManager } from "./menuMgr";
import { PredefinedIconFactor } from "./predefinedIcon";
import { activeTopicBar, registerTopicComponent, unregisterTopicComponent } from "./topicBar";
import appFunctions from "../common/appFunctions";
import VSCodeHost from "../common/vscodeHost";
import * as hostAdapter from "../common/hostAdapter";
import { activeAddons, loadAddons } from "./addons";
import FileFormats from "../fileFormats";

const TopicEditTiriggerActions = Object.assign({}, DefaultTopicEventActions);

function registerTopicEditTiriggerAction(_contentType, _actions) {
    if (_contentType && _actions) {
        TopicEditTiriggerActions[_contentType] = _actions;
    }
}

function unregisterTopicEditTiriggerAction(_contentType) {
    _contentType && (delete TopicEditTiriggerActions[_contentType]);
}

async function backupWorkspaceInBrowser() {
    let filePath = await hostAdapter.getDocumentFilePath();
    let blob = await $felisApp.callAction("dumpMindmap-toBlob", ".felis");
    await hostAdapter.setConfiguration("last-document", {
        filePath,
        blob,
        currentSheetID: $felisApp.view.sheetID,
        defaultSheets: CustomDocument.DefaultTemplateSheets,
        defaultTopic: CustomDocument.DefaultTopicTemplate,
        defaultAttachments: CustomDocument.DefaultTemplateAttachments
    });
}

export async function initViewer(_waitDlg) {
    
    const host = (typeof acquireVsCodeApi === "function") ? acquireVsCodeApi() : undefined;
    console.log(host ? "in vscode mode" : "in normal web mode");

    host && hostAdapter.setHost(new VSCodeHost(host));

    i18n.config({
        loader: "./locales/"
    });
    await i18n.setLocale(await hostAdapter.getLanguage());
    i18n.enableRecord = true;

    _waitDlg.tip = i18n("Loading") + "...";
    
    const app = { };
    readonlyMember(app, appFunctions);
    Object.defineProperties(window, {
        $felisApp: {
            get() {
                return app;
            },
            enumerable: true,
            configurable: false
        }
    });

    const env = new CustomEnvironment();
    readonlyMember(app, { 
        env, 
        LibMindmap : readonlyMember({}, Object.assign({
            DocumentClass: CustomDocument,
            ViewerClass: CustomViewer,
            EnvironmentClass: CustomEnvironment
        }, mindmapSVG))
    });
    const doc = new CustomDocument(env);
    const view = new CustomViewer(doc, document.querySelector(".mindmap-viewer"));
    const menu = new MenuManager(document.querySelector(".mindmap-menubar"));
    readonlyMember(app, { 
        doc, view, menu, FileFormats, 
        registerTopicComponent, unregisterTopicComponent, registerTopicEditTiriggerAction, unregisterTopicEditTiriggerAction
    });
    appFunctions.registerAction("backupWorkspaceInBrowser", backupWorkspaceInBrowser);
    env.extensionFactors.push(...DefaultTopicExtensions);
    env.extensionFactors.forEach((item) => {
        item.register(view);
    });
    PredefinedIconFactor.register(view);

    env.addEventListener("topic-event-edit", MindmapViewer.dispatchTopicEventAction.bind(TopicEditTiriggerActions));
    env.addEventListener("topic-event-trigger", (event) => {
        if (!MindmapViewer.dispatchTopicEventAction.call(TopicEditTiriggerActions, event)) {
            event.detail && (event.detail.triggerContentType = undefined);
            activeTopicBar(view);
        }
    });
    env.addEventListener("topic-event-end-dragdrop", () => {
        activeTopicBar(view);
    });

    await loadAddons();
    await activeAddons();

    let docFilePath = await hostAdapter.getDocumentFilePath();
    if (docFilePath) {
        _waitDlg.tip = `${i18n("Open file")}\n${docFilePath}`;
        let docBlob = await hostAdapter.loadFromFile();
        _waitDlg.close();
        (docBlob instanceof Blob) ? app.callAction("openMindmap-detail", docFilePath, docBlob) : doc.newDocument();
    } else {
        _waitDlg.close();
        let lastDoc = ((!host) && await hostAdapter.getConfiguration("last-document"));
        if (lastDoc && (lastDoc.blob instanceof Blob)) {
            CustomDocument.SetTemplateDetail(lastDoc.defaultSheets, lastDoc.defaultTopic, lastDoc.defaultAttachments);
            await Promise.resolve(app.callAction("openMindmap-detail", (lastDoc.filePath || "") + ".felis", lastDoc.blob));
            hostAdapter.setDocumentFilePath(lastDoc.filePath || "");
            lastDoc.currentSheetID && app.doc.switchToSheet(lastDoc.currentSheetID);
        } else {
            app.callAction("newFile-detail");
        }
    }

    window.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "hidden") {
            (!host) && (await backupWorkspaceInBrowser());
        } else {
            env.fireEvent("topic-event-refresh-display");
        }
    });

    (!host) && env.addEventListener("topic-event-new-document", () => Promise.resolve().then(backupWorkspaceInBrowser));

    // DEBUG: 
    window.$env = env;
    window.$doc = doc;
    window.$view = view;
    window.$svg = document.querySelector("svg");
    window.$i18n = i18n;
    window.$host = host;
}