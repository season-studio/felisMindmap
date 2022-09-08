import { ENoImplementation } from "../common/error";

export class FileProvider {
    constructor() {

    }

    async load(_src) {
        throw new ENoImplementation();
    }

    async save() {
        throw new ENoImplementation();
    }

    get type() {
        return "mindmap";
    }

    async readSheets() {
        throw new ENoImplementation();
    }

    async writeSheets(_sheets) {
        throw new ENoImplementation();
    }

    * enumerateAttachments() {
        throw new ENoImplementation();
    }

    async readContent(_path, _type) {
        throw new ENoImplementation();
    }

    async writeContent(_path, _content) {
        throw new ENoImplementation();
    }
}