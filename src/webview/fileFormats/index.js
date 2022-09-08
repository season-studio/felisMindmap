import { FelisFile } from "./felis";
import { XMindFile } from "./xmind";

export * from "./fileProvider";

const fileFormatMap = new Map([
    [".felis", {
        name: "Felis Mind",
        constructor: FelisFile
    }],
    [".xmind", {
        name: "XMind",
        image: "./assets/icon/xmind.png",
        constructor: XMindFile
    }]
]);

export default function FileFormats(_format) {
    return fileFormatMap.get(_format);
}

FileFormats.enumerate = function * () {
    for (let item of fileFormatMap) {
        yield {
            key: item[0],
            provider: item[1]
        };
    }
}

FileFormats.register = function (_type, _opt) {
    _type = String(_type || "").trim();
    if (_type && _opt && _opt.constructor) {
        _opt.name || (_opt.name = _type);
        fileFormatMap.has(_type) && fileFormatMap.delete(_type);
        fileFormatMap.set(_type, _opt);
    }
}

FileFormats.unregister = function (_type) {
    fileFormatMap.has(_type) && fileFormatMap.delete(_type);
}
