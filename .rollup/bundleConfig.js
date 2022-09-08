/**
 * export a function generating the custom configure object or export the custom configure object directly
 * the members of the custom configure as follow:
 * {
 *      entries: String || Array, // the input sources
 *      defaultConfigs: {
 *          // see the rollup document
 *      }
 * }
 */

module.exports = function (/*predefinedConfigs*/) {
    return {
        entries: ["./src/webview/index.js", "./src/webview/sw.js"]
    }
}
