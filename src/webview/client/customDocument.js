import { MindmapDocument } from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";
import { cloneObject } from "../../thirdpart/toolkits/src/cloneObject";
import { FileProvider } from "../fileFormats";

const DefaultTopicTitle = "Empty Topic";
const DefaultSheetTitle = "Untitled Sheet";

const DefaultTopicValue = {
    title: DefaultTopicTitle
};

const DefaultSheetValue = {
    title: DefaultSheetTitle,
    topic: DefaultTopicValue
};

export class CustomDocument extends MindmapDocument {

    static #DefaultSheets = [DefaultSheetValue];

    static #DefaultTopic = DefaultTopicValue;

    static #DefaultAttachments = {

    };

    static get DefaultSheetTemplate() {
        return this.#DefaultSheets[0];
    }
    
    static get DefaultTopicTemplate() {
        return this.#DefaultTopic;
    }

    static get DefaultTemplateSheets() {
        return this.#DefaultSheets;
    }

    static get DefaultTemplateAttachments() {
        return this.#DefaultAttachments;
    }

    static async SetTemplate(_templateFile) {
        if ((_templateFile instanceof FileProvider) && (_templateFile.type === "mindmap-template")) {
            let sheets = await _templateFile.readSheets();
            (sheets instanceof Array) || (sheets = [DefaultSheetValue]);
            (sheets.length <= 0) && sheets.push(DefaultSheetValue);
            this.#DefaultSheets = sheets;
            this.#DefaultAttachments = {};
            for (let attachmentPath of _templateFile.enumerateAttachments()) {
                if (!String(attachmentPath).match(/^[Tt]humbnails[\\\/]/ig)) {
                    let data = await _templateFile.readContent(attachmentPath);
                    data && (this.#DefaultAttachments[attachmentPath] = data);
                }
            }
            try {
                let defaultTopic = await _templateFile.readContent("default-topic.json", "text");
                defaultTopic && (defaultTopic = JSON.parse(defaultTopic));
                this.#DefaultTopic = ((defaultTopic && defaultTopic.title) ? defaultTopic : DefaultTopicValue);
            } catch (err) {
                console.warn("Exception in read default topic", err);
                this.#DefaultTopic = DefaultTopicValue;
            }
        } else {
            DefaultSheetValue.title = i18n(DefaultSheetTitle);
            DefaultTopicValue.title = i18n(DefaultTopicTitle);
            this.#DefaultSheets = [DefaultSheetValue];
            this.#DefaultTopic = DefaultTopicValue;
            this.#DefaultAttachments = { };
        }
    }

    static SetTemplateDetail(_sheets, _topic, _attachments) {
        if (_sheets !== undefined) {
            this.#DefaultSheets = ((_sheets instanceof Array) ? _sheets : [DefaultSheetValue]);
        }
        if (_topic !== undefined) {
            this.#DefaultTopic = (_topic || DefaultTopicValue);
        }
        if (_attachments !== undefined) {
            this.#DefaultAttachments = (_attachments || {});
        }
    }

    constructor(env) {
        super(env);
    }

    newDocument(_fn) {
        const fnArgs = Array.prototype.slice.call(arguments, 1);
        return MindmapDocument.prototype.newDocument.call(this, async () => {
            let ret = (typeof _fn === "function") && _fn.apply(this, fnArgs);
            (ret instanceof Promise) && await ret;
            if (this.sheetCount <= 0) {
                CustomDocument.#DefaultSheets.forEach(item => {
                    this.addSheet(cloneObject({}, item, {id:undefined}));
                });
                for (let name in CustomDocument.#DefaultAttachments) {
                    this.setAttachment(name, CustomDocument.#DefaultAttachments[name]);
                }
            }
            $felisApp.env.fireEvent("topic-event-new-document", { doc: this });
        });
    }
}