import { $T } from "../locale";
import { activeCategoryBar } from "./categoryBar";
import { localeInfo } from "./localeInfo";
import { activeTableChartBar } from "./tableChartBar";
import { CategoryExtensionXML, ChartExtensionXML, ReportAgentPublicXML, TableExtensionXML } from "./tableChartExtensionXML";
import { showTemplateDialog } from "./templateDlg";
import { ServiceHost } from "./common";

const TableChartEditorTrigger = {
    edit: activeTableChartBar,
    trigger: activeTableChartBar
};

const ReportAgentPublicExtensionFactor = app.LibMindmap.CreateTopicExtensionFactor(ReportAgentPublicXML);
const TableExtensionFactor = app.LibMindmap.CreateTopicExtensionFactor(TableExtensionXML);
const ChartExtensionFactor = app.LibMindmap.CreateTopicExtensionFactor(ChartExtensionXML);
const CategoryExtensionFactor = app.LibMindmap.CreateTopicExtensionFactor(CategoryExtensionXML);

async function generatePresentation() {
    let template = String(await showTemplateDialog() || "").trim();
    if (template) {
        let waitDlg = $felisApp.TipKits.showWaitDialog($T("Generating presentation...", localeInfo));
        try {
            let blob = await $felisApp.callAction("dumpMindmap-toBlob", ".felis", true);
            window["$blob"] = blob;
            let resp = await fetch(`${ServiceHost}generate-presentation?t=${encodeURIComponent(template)}`, {
                method: "POST",
                body: blob,
                header: {
                    'Content-Type': 'application/octet-stream'
                }
            });
            if (!resp.ok) {
                throw `Response is ${resp.status}: ${resp.statusText}`;
            }
            let fileName = decodeURIComponent(String(resp.headers.get("x-report-file")||"").trim());
            if (!fileName) {
                throw "Response without the filename";
            }
            let file = await resp.blob();
            if (file instanceof Blob) {
                const aElement = document.createElement("a");
                if (aElement) {
                    let url = URL.createObjectURL(file);
                    aElement.href = url;
                    aElement.rel = "noopener";
                    aElement.download = fileName;
                    aElement.click();
                    URL.revokeObjectURL(url);
                }
                $felisApp.TipKits.confirm(
                    $T("The presentation has been generated\nThe generation principle of the report agent is to infer the template page closest to the data you provide, and then fill in the content. \nTherefore, there may be situations in the target presentation where the text does not perfectly match the layout. \nYou need to review the target presentation and make some manual adjustments if necessary.", localeInfo), {
                        icon: "info",
                        buttons: [$T("OK. I got it.", localeInfo)]
                    }
                );
            } else {
                throw "The response is not a blob";
            }
        } catch(err) {
            console.error(err);
            $felisApp.TipKits.tip($T("Fail in generating the presentation", localeInfo), {
                type: "error",
                timeout: 1700
            });
        }
        waitDlg?.close();
    }
}

addon = {
    async active() {
        app.registerAction("generatePresentation", generatePresentation);
        app.menu.registerMenus({
            id: "addons.reportAgent",
            title: $T("Report Agent", localeInfo),
            menus: [{
                id: "addons.reportAgent.generate",
                title: $T("Generate Presentation", localeInfo) + "...",
                action: "generatePresentation"
            }]
        }, "addons");
        app.registerTopicEditTiriggerAction("table", TableChartEditorTrigger);
        app.registerTopicEditTiriggerAction("chart", TableChartEditorTrigger);
        app.registerTopicEditTiriggerAction("category", { edit: activeCategoryBar });
        app.registerTopicComponent("table", $T("Table", localeInfo), "#icon-reportagent-table", "t");
        app.registerTopicComponent("chart", $T("Chart", localeInfo), "#icon-reportagent-chart", "c");
        app.registerTopicComponent("category", $T("Category", localeInfo), "#icon-reportagent-category", "y");
        ReportAgentPublicExtensionFactor.register(app.view);
        app.registerTopicExtensionFactor(TableExtensionFactor);
        app.registerTopicExtensionFactor(ChartExtensionFactor);
        app.registerTopicExtensionFactor(CategoryExtensionFactor);
    },
    deactive() {
        app.menu.unregisterMenus("addons.reportAgent");
        app.unregisterTopicComponent("category");
        app.unregisterTopicComponent("chart");
        app.unregisterTopicComponent("table");
        app.unregisterTopicEditTiriggerAction("table");
        app.unregisterTopicEditTiriggerAction("chart");
        app.unregisterTopicEditTiriggerAction("category");
        app.unregisterTopicExtensionFactor(TableExtensionFactor);
        app.unregisterTopicExtensionFactor(ChartExtensionFactor);
        app.unregisterTopicExtensionFactor(CategoryExtensionFactor);
        ReportAgentPublicExtensionFactor.unregister(app.view);
        //app.unregisterAction("importMarkdown", importMarkdown);
        //app.unregisterAction("exportMarkdown", exportMarkdown);
    }
};

Object.defineProperty(addon, "name", {
    get() {
        return $T("Report Agent", localeInfo);
    },
    configurable: false,
    enumerable: true
});
