const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

module.exports = function (_input, _output, _dist, _getArg) {
    let zip = new JSZip();
    zip.file("metadata.json", '{"creator":{"name":"felis","version":"1.0.0.202208"}}');
    zip.file("manifest.json", '{"files":{"metadata.json":{},"entry.js":{}},"packageType":"mindmap-addon"}');
    let script = fs.readFileSync(_dist);
    zip.file("entry.js", script);
    return zip.generateAsync({type: "nodebuffer"}).then(buf => {
        let itemPath = path.dirname(_dist);
        let itemName = path.basename(itemPath);
        let destPath = (_getArg("--zip-path") || itemPath);
        fs.writeFileSync(path.join(path.resolve(process.cwd(), destPath), itemName + ".felis"), buf);
    });
};
