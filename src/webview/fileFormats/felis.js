import JSZip from "jszip";
import { FileProvider } from "./fileProvider";

export class FelisFile extends FileProvider {
    #zip;
    #manifest;

    constructor() {
        super();

        this.#zip = null;
        this.#manifest = null;
    }

    get type() {
        return (this.#manifest && this.#manifest.packageType) ? this.#manifest.packageType : "mindmap";
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
                    files: {}
                }
            }
        }
    }

    async save(_type) {
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
            manifest.packageType || (manifest.packageType = (_type || "mindmap"));
            manifest.files["metadata.json"] = {};
            this.#zip.file("manifest.json", JSON.stringify(manifest));
            return await this.#zip.generateAsync({
                type: "blob",
                mimeType: "application/felis",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            });
        }
    }

    async readSheets() {
        if (this.#zip) {
            let file = this.#zip.file("sheets.json");
            if (file) {
                file = await file.async("text");
                return JSON.parse(file);
            }
        }
    }

    async writeSheets(_sheets) {
        if (_sheets instanceof Array) {
            (this.#zip || (this.#zip = new JSZip())).file("sheets.json", JSON.stringify(_sheets));
            this.#availableManifest.files["sheets.json"] = {};
        }
    }

    * enumerateAttachments() {
        if (this.#zip && this.#manifest) {
            const entries = this.#manifest.files;
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
        this.#availableManifest.files[_path] = {};
    }

    get #availableManifest() {
        return (this.#manifest || (this.#manifest = {
            files: {}
        }));
    }
}