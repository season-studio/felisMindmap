import { blobFromBase64, blobToBase64, blobToText } from "../../thirdpart/toolkits/src/blobKits";
import { $T } from "../locale";
import { localeInfo } from "./localeInfo";
import { lexer } from 'marked';

function markdown2TopicAndNotes(topic, ops, token) {
    if (token.type === "text") {
        (String(token.text).trim() || (ops.length > 0)) && ops.push({insert: token.text});
    } else if (token.type === "em") {
        ops.push({insert: token.text, attributes: { italic: true }});
    } else if (token.type === "strong") {
        ops.push({insert: token.text, attributes: { bold: true }});
    } else if (token.type === "code") {
        ops.push({insert: token.text, attributes: { code: true }});
    } else if (token.type === "space") {
        (ops.length > 0) && ops.push({insert: token.raw});
    } else if (token.type === "image") {
        topic.image = { src: token.href };
    } else if (token.type === "link") {
        let href = String(token.href || "");
        if (href) {
            if (href.startsWith("data:")) {
                let blob = blobFromBase64(href);
                if (blob instanceof Blob) {
                    href = app.env.config.defaultResourceAttachmentPrefix + app.LibMindmap.generateID();
                    app.doc.setAttachment(href, blob);
                    href = app.env.config.resourceScheme + ":" + href;
                }
            }
            topic.href = href;
        }
        
    }
}

async function importMarkdown() {
    let blob = await app.hostAdapter.openFile(".md");
    let content = await blobToText(blob);
    (typeof content === "string") && (content = lexer(content));
    let stackRoot = { topic: {}, level: 0 };
    let stack = stackRoot;
    (content instanceof Array) && content.forEach(item => {
        if (item.type === "list") {
            (item.items instanceof Array) && item.items.forEach(item.ordered ? (token) => {
                if (token.type === "list_item") {
                    (stack.topic.labels instanceof Array) || (stack.topic.labels = []);
                    stack.topic.labels.push(token.text);
                }
            } : (token) => {
                if (token.type === "list_item") {
                    let components = String(token.text || "").split(":");
                    if (components.length > 1) {
                        let key = components[0].trim();
                        let value = components[1].trim();
                        stack.topic[key] = (isNaN(value) ? value : Number(value));
                    }
                }
            });
        } else if (item.type === "heading") {
            if (item.depth > stack.level) {
                (stack.topic.children instanceof Array) || (stack.topic.children = []);
                let topic = { title: item.text };
                stack.topic.children.push(topic);
                stack = { topic, level: item.depth, parent: stack };
            } else if (item.depth === stack.level) {
                let parentStack = (stack.parent || stackRoot);
                (parentStack.topic.children instanceof Array) || (parentStack.topic.children = []);
                let topic = { title: item.text };
                parentStack.topic.children.push(topic);
                stack = { topic, level: item.depth, parent: parentStack };
            } else {
                let parentStack;
                for (parentStack = stack.parent; parentStack && (parentStack.level >= item.depth); parentStack = parentStack.parent) {

                }
                parentStack || (parentStack = stackRoot);
                (parentStack.topic.children instanceof Array) || (parentStack.topic.children = []);
                let topic = { title: item.text };
                parentStack.topic.children.push(topic);
                stack = { topic, level: item.depth, parent: parentStack };
            }
        } else if (item.type === "paragraph") {
            let topic = stack.topic;
            topic.notes || (topic.notes = { });
            topic.notes.ops || (topic.notes.ops = { });
            (topic.notes.ops.ops instanceof Array) || (topic.notes.ops.ops = []);
            let ops = topic.notes.ops.ops;
            (item.tokens instanceof Array) && item.tokens.forEach(token => markdown2TopicAndNotes(topic, ops, token));
            (ops.length <= 0) && (delete topic.notes);
        } else {
            markdown2TopicAndNotes(stack.topic, [], item);
        }
    });
    let topic = stackRoot.topic;
    if ((topic.children instanceof Array) && (topic.children.length === 1)) {
        topic = topic.children[0];
    } else {
        topic.title = ((blob && blob.name) || "Markdown");
    }
    let sheet = {
        title: topic.title,
        topic
    };
    app.doc.addSheet(sheet);
    app.doc.switchToSheet(sheet.id, true);
    app.callAction("backupWorkspaceInBrowser");
}

async function getAttachment(_name) {
    let data = app.doc.getAttachment(_name);
    (data instanceof Blob) && (data = await blobToBase64(data));
    return data;
}

async function exportMarkdown() {
    const markdown = [];
    const xapPrefix = app.env.config.resourceScheme + ":";
    for (let topic of app.view.rootTopic.enumerateTopics()) {
        let topicData = topic.data;
        markdown.push(`${"#".repeat((Number(topic.level) || 0) + 1)} ${topicData.title}\n`);
        for (let key in topicData) {
            let data = topicData[key];
            if (key === "labels") {
                (data instanceof Array) && data.forEach((item, index) => {
                    markdown.push(`${index + 1}. ${item}`);
                });
                markdown.push("");
            } else if (key === "image") {
                let href = String(data.src || "");
                markdown.push(`![image](${href.startsWith(xapPrefix) ? await getAttachment(href.substring(xapPrefix.length)) : href})`);
            } else if (key === "notes") {
                if (data.ops && (data.ops.ops instanceof Array)) {
                    const notes = [];
                    data.ops.ops.forEach(item => {
                        if (item.attributes) {
                            if (item.attributes.bold) {
                                notes.push(`**${item.insert}**`);
                            } else if (item.attributes.italic) {
                                notes.push(`*${item.insert}*`);
                            } else if (item.attributes.code) {
                                let lastIndex = notes.length - 1;
                                let lastItem = String(notes[lastIndex]);
                                if (lastItem.startsWith("\`\`\`\n")) {
                                    notes[lastIndex] = `${lastItem.slice(0, -5)}${item.insert}\n\`\`\`\n`;
                                } else {
                                    notes.push(`\`\`\`\n${item.insert}\n\`\`\`\n`);
                                }
                            } else {
                                notes.push(item.insert);
                            }
                        } else {
                            notes.push(item.insert);
                        }
                    });
                    markdown.push(notes.join(""));
                } else if (data.plain && data.plain.content) {
                    markdown.push(data.plain.content);
                }
            } else if (key === "href") {
                let href = String(data);
                markdown.push(`[link](${href.startsWith(xapPrefix) ? await getAttachment(href.substring(xapPrefix.length)) : href})`);
            } else if ((key !== "id") && (key !== "title")) {
                let lastIndex = markdown.length - 1;
                let lastItem = String(markdown[lastIndex]);
                if (lastItem.startsWith("-")) {
                    markdown[lastIndex] = lastItem.trim();
                }
                markdown.push(`- ${key}: ${data}\n`);
            }
        }
    }
    let blob = new Blob([markdown.join("\n")]);
    let filePath = String(await app.hostAdapter.getDocumentFilePath() || $T("Untitled", localeInfo)) + " ";
    filePath = filePath.slice(0, filePath.lastIndexOf(".")) + ".md";
    app.hostAdapter.saveToFile(blob, filePath, ".md");
}

addon = {
    async active() {
        app.registerAction("importMarkdown", importMarkdown);
        app.registerAction("exportMarkdown", exportMarkdown);
        app.menu.registerMenus({
            id: "addons.markdown",
            title: $T("Markdown", localeInfo),
            menus: [{
                id: "addons.markdown.import",
                title: $T("Import", localeInfo),
                action: "importMarkdown"
            }, {
                id: "addons.markdown.export",
                title: $T("Export", localeInfo),
                action: "exportMarkdown"
            }]
        }, "addons");
    },
    deactive() {
        app.menu.unregisterMenus("addons.markdown");
        app.unregisterAction("importMarkdown", importMarkdown);
        app.unregisterAction("exportMarkdown", exportMarkdown);
    }
};

Object.defineProperty(addon, "name", {
    get() {
        return $T("Markdown Addon", localeInfo);
    },
    configurable: false,
    enumerable: true
});
