import JSZip from "jszip";
import { FileProvider } from "./fileProvider";
import { loadXMindXMLManifest, loadXMindXMLSheets } from "./xmindXMLLoader";
import { markersToFelisMap, felisToXMindMap } from "./xmindMarkerMap";

const classicContentPlaceholderXML = `<!--template XML-->
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" modified-by="bruce" timestamp="1503058545540" version="2.0">
    <sheet id="7abtd0ssc7n4pi1nu6i7b6lsdh" modified-by="bruce" theme="0kdeemiijde6nuk97e4t0vpp54" timestamp="1503058545540">
        <topic id="1vr0lcte2og4t2sopiogvdmifc" modified-by="bruce" structure-class="org.xmind.ui.logic.right" timestamp="1503058545417">
            <title>Warning
    警告
    Attention
    Warnung
    경고</title>
            <children>
                <topics type="attached">
                    <topic id="71h1aip2t1o8vvm0a41nausaar" modified-by="bruce" timestamp="1503058545423">
                        <title svg:width="500">This file can not be opened normally, please do not modify and save, otherwise the contents will be permanently lost！</title>
                        <children>
                            <topics type="attached">
                                <topic id="428akmkh9a0tog6c91qj995qdl" modified-by="bruce" timestamp="1503058545427">
                                    <title>You can try using XMind 8 Update 3 or later version to open</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="2kb87f8m38b3hnfhp450c7q35e" modified-by="bruce" timestamp="1503058545434">
                        <title svg:width="500">该文件无法正常打开，请勿修改并保存，否则文件内容将会永久性丢失！</title>
                        <children>
                            <topics type="attached">
                                <topic id="3m9hoo4a09n53ofl6fohdun99f" modified-by="bruce" timestamp="1503058545438">
                                    <title>你可以尝试使用 XMind 8 Update 3 或更新版本打开</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="7r3r4617hvh931ot9obi595r8f" modified-by="bruce" timestamp="1503058545444">
                        <title svg:width="500">該文件無法正常打開，請勿修改並保存，否則文件內容將會永久性丟失！</title>
                        <children>
                            <topics type="attached">
                                <topic id="691pgka6gmgpgkacaa0h3f1hjb" modified-by="bruce" timestamp="1503058545448">
                                    <title>你可以嘗試使用 XMind 8 Update 3 或更新版本打開</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="0f2e3rpkfahg4spg4nda946r0b" modified-by="bruce" timestamp="1503058545453">
                        <title svg:width="500">この文書は正常に開かないので、修正して保存しないようにしてください。そうでないと、書類の内容が永久に失われます。！</title>
                        <children>
                            <topics type="attached">
                                <topic id="4vuubta53ksc1falk46mevge0t" modified-by="bruce" timestamp="1503058545457">
                                    <title>XMind 8 Update 3 や更新版を使って開くこともできます</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="70n9i4u3lb89sq9l1m1bs255j5" modified-by="bruce" timestamp="1503058545463">
                        <title svg:width="500">Datei kann nicht richtig geöffnet werden. Bitte ändern Sie diese Datei nicht und speichern Sie sie, sonst wird die Datei endgültig gelöscht werden.</title>
                        <children>
                            <topics type="attached">
                                <topic id="1qpc5ee298p2sqeqbinpca46b7" modified-by="bruce" timestamp="1503058545466">
                                    <title svg:width="500">Bitte versuchen Sie, diese Datei mit XMind 8 Update 3 oder später zu öffnen.</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="4dmes10uc19pq7enu8sc4bmvif" modified-by="bruce" timestamp="1503058545473">
                        <title svg:width="500">Ce fichier ne peut pas ouvert normalement, veuillez le rédiger et sauvegarder, sinon le fichier sera perdu en permanence. </title>
                        <children>
                            <topics type="attached">
                                <topic id="5f0rivgubii2launodiln7sdkt" modified-by="bruce" timestamp="1503058545476">
                                    <title svg:width="500">Vous pouvez essayer d'ouvrir avec XMind 8 Update 3 ou avec une version plus récente.</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                    <topic id="10pn1os1sgfsnqa8akabom5pej" modified-by="bruce" timestamp="1503058545481">
                        <title svg:width="500">파일을 정상적으로 열 수 없으며, 수정 및 저장하지 마십시오. 그렇지 않으면 파일의 내용이 영구적으로 손실됩니다!</title>
                        <children>
                            <topics type="attached">
                                <topic id="0l2nr0fq3em22rctapkj46ue58" modified-by="bruce" timestamp="1503058545484">
                                    <title svg:width="500">XMind 8 Update 3 또는 이후 버전을 사용하여</title>
                                </topic>
                            </topics>
                        </children>
                    </topic>
                </topics>
            </children>
            <extensions>
                <extension provider="org.xmind.ui.map.unbalanced">
                    <content>
                        <right-number>-1</right-number>
                    </content>
                </extension>
            </extensions>
        </topic>
        <title>Sheet 1</title>
    </sheet>
</xmap-content>
`;

const felisExcludeTopicMembers = ["extensions", "summaries", "structureClass", "class", "boundaries"];

export class XMindFile extends FileProvider {
    #zip;
    #manifest;

    constructor() {
        super();

        this.#zip = null;
        this.#manifest = null;
    }

    async load(_src) {
        let zipfile = (this.#zip = await JSZip.loadAsync(_src, {
            base64: typeof _source === "string"
        }));
        if (zipfile) {
            let manifestContent = zipfile.file("manifest.json");
            if (manifestContent) {
                manifestContent = await manifestContent.async("text");
                this.#manifest = JSON.parse(manifestContent);
            } else {
                this.#manifest = {
                    "file-entries": {}
                }
                await loadXMindXMLManifest(zipfile, this.#manifest);
            }
        }
    }

    async save() {
        if (this.#zip) {
            if (!this.#zip.file("metadata.json")) {
                this.#zip.file("metadata.json", JSON.stringify({
                    creator: {
                        name: "felis",
                        version: "1.0.0.202208"
                    }
                }));
            }
            let manifest = this.#availableManifest;
            manifest["file-entries"]["metadata.json"] = {};
            this.#zip.file("manifest.json", JSON.stringify(manifest));
            this.#zip.file("content.xml", classicContentPlaceholderXML);
            return await this.#zip.generateAsync({
                type: "blob",
                mimeType: "application/xmind",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });
        }
    }

    async readSheets() {
        if (this.#zip) {
            let file = this.#zip.file("content.json");
            if (file) {
                return await this.#loadZenFile(file);
            } else {
                return await loadXMindXMLSheets(this.#zip);
            }
        }
    }

    async writeSheets(_sheets) {
        if (_sheets instanceof Array) {
            let sheetsContent = [];
            _sheets.forEach((item) => {
                let rootTopic = {};
                let sheet = {
                    id: item.id,
                    title: item.title,
                    rootTopic
                };
                sheetsContent.push(sheet);
                this.#saveTopicItem(rootTopic, item.topic);
            });
            (this.#zip || (this.#zip = new JSZip())).file("content.json", JSON.stringify(sheetsContent));
            this.#availableManifest["file-entries"]["content.json"] = {};
        }
    }

    * enumerateAttachments() {
        if (this.#zip && this.#manifest) {
            const entries = this.#manifest["file-entries"];
            for (let path in entries) {
                if (String(path).match(/[\\\/]/ig)) {
                    yield path;
                }
            }
        }
    }

    async readContent(_path, _type) {
        if (this.#zip) {
            let file = this.#zip.file(_path);
            return file && await file.async(_type || "blob");
        }
    }

    async writeContent(_path, _content) {
        (this.#zip || (this.#zip = new JSZip())).file(_path, _content, {
            createFolders: true
        });
        this.#availableManifest["file-entries"][_path] = {};
    }

    get #availableManifest() {
        return (this.#manifest || (this.#manifest = {
            "file-entries": {}
        }));
    }

    #saveTopicItem(_dest, _src) {
        for (let key in _src) {
            if (key === "children") {
                let attached = [];
                for (let item of _src.children) {
                    let subTopic = {};
                    this.#saveTopicItem(subTopic, item);
                    attached.push(subTopic);
                }
                _dest.children = { attached };
            } else {
                let fn = felisToXMindMap[key];
                if (typeof fn === "function") {
                    fn(_dest, _src[key]);
                } else {
                    _dest[key] = _src[key];
                }
            }
        }
    }

    #loadZenTopicItem(_dest, _src) {
        for (let key in _src) {
            if (key === "children") {
                let children = [];
                let list = _src.children.attached;
                (list instanceof Array) && list.forEach((item) => {
                    let subTopic = {};
                    this.#loadZenTopicItem(subTopic, item);
                    children.push(subTopic);
                });
                _dest.children = children;
            } else if (key === "markers") {
                (_src.markers instanceof Array) && _src.markers.forEach((item) => {
                    let markerId = String(item.markerId);
                    for (let prefix in markersToFelisMap) {
                        if (markerId.startsWith(prefix)) {
                            markersToFelisMap[prefix](_dest, markerId);
                            break;
                        }
                    }
                });
            } else if (!felisExcludeTopicMembers.includes(key)) {
                _dest[key] = _src[key];
            }
        }
    }

    async #loadZenFile(_file) {
        let content = await _file.async("text");
        content = JSON.parse(content);
        const sheets = [];
        (content instanceof Array) && content.forEach((item) => {
            let topic = {};
            let sheetItem = {
                id: item.id,
                title: item.title,
                topic
            };
            this.#loadZenTopicItem(topic, item.rootTopic);
            sheets.push(sheetItem);
        });
        return sheets;
    }
}
