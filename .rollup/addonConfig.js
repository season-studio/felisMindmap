const fs = require("fs");
const path = require("path");

const defaultOutputOption = {
    strict: false,
    format: "cjs"
};

module.exports = function (predefinedConfigs) {
    const walkPath = path.resolve(process.cwd(), "./src/addons");
    const fileList = fs.readdirSync(walkPath);
    const entries = [];
    (fileList instanceof Array) && fileList.forEach(item => {
        const itemPath = path.join(walkPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
            entries.push({
                input: path.join(itemPath, "index.js"),
                output: Object.assign({
                    $dir: "./.addonDist/" + item
                }, defaultOutputOption)
            });
        }
    });
    return { entries };
}
