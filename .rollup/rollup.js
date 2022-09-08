const packageInfo = require('../package.json');
const path = require('path');
const rollup = require('rollup');
const fs = require('fs');
const crypto = require('crypto');

// function to get an argument for command line
function getArg(_entry) {
    const entryPos = process.argv.indexOf(_entry);
    return ((entryPos > 1) && process.argv[entryPos + 1]) || "";
}

function hasArgFlag(_entry) {
    return process.argv.indexOf(_entry) > 1;
}

//#region the log functions
const LogFormat = {
    infoTitle: "\x1b[46;30m",
    info: "\x1b[36m",
    warnTitle: "\x1b[43;30m",
    warn: "\x1b[33m",
    errorTitle: "\x1b[41;37m\x1b[1m",
    error: "\x1b[31m",
    commentTitle: "\x1b[42;30m",
    comment: "\x1b[32m",
    none: "\x1b[0m"
};

function log(_type) {
    const args = [...arguments];
    args[0] = LogFormat[_type] || `${_type}:`;
    args.push(LogFormat.none);
    console.log.apply(console, args);
}

function logEx(_type) {
    const args = [...arguments];
    args[0] = LogFormat[_type + "Title"] || `${_type}:`;
    args.splice(2, 0, `${LogFormat.none}${LogFormat[_type] || ""}`);
    args.push(LogFormat.none);
    console.log.apply(console, args);
}

function logTitle(_type) {
    const args = [...arguments];
    args[0] = LogFormat[_type + "Title"] || `${_type}:`;
    args.push(LogFormat.none);
    console.log.apply(console, args);
}

global.$log = {
    log,
    logEx,
    logTitle
}
//#endregion

if (require.main === module) {
    /**
     * launch rollup progress if invoked as the main module 
     */

    const loadConfigFile = require('rollup/dist/loadConfigFile');

    /**
     * the default handler for processing warning message
     * @param {*} _warning 
     */
    function onWarnHandler(_warning) {
        logEx("warn", _warning.code, _warning.message);
        _warning.source && log("warn", "   source:", _warning.source);
    }

    /**
     * the main function
     */
    (async function() {
        // peek config information
        logTitle("info", "Peek Configure");
        log("info", __filename);
        const { options, warnings } = await loadConfigFile(__filename);
        warnings.count > 0 && (logEx("warn", "Config Warning", "We currently have", warnings.count, "warnings"), warnings.flush());
        
        logTitle("info", "Packing");
        try {
            const writePromises = [];

            const flush = hasArgFlag("--flush");

            let externalOutput = getArg("--external-ouput");
            externalOutput = (externalOutput && require(path.resolve(process.cwd(), externalOutput)));
            (typeof externalOutput === "function") || (externalOutput = function () {});
    
            // rollup each bundle
            for (const inputOption of options) {
                inputOption.onwarn = onWarnHandler;
                const bundle = await rollup.rollup(inputOption);
                for (const outputOption of inputOption.output) {
                    // generate the output data
                    const out = await bundle.generate(outputOption);
                    const { output } = out;
                    // check if there is any change by checking the hash of the output
                    let content = "";
                    for (const chunk of output) {
                        content += (chunk.source || chunk.code);
                    }
                    const distPath = path.resolve(process.cwd(), outputOption.file);
                    const distHashPath = `${distPath}:hash`;
                    const distHash = crypto.createHash('md5').update(content).digest("hex");
                    if (fs.existsSync(distHashPath)) {
                        const oriHash = fs.readFileSync(distHashPath, {encoding:"utf8"});
                        if ((oriHash === distHash) && (!flush)) {
                            content = undefined;
                            log("comment", `"${inputOption.input}" --> "${outputOption.file}" has no change.`);
                        }
                    }
                    // trigger the written action for the changed bundles
                    if (content) {
                        writePromises.push(bundle.write(outputOption).then(() => {
                            fs.writeFileSync(distHashPath, distHash, {encoding:"utf8"});
                        }).then(() => {
                            externalOutput(inputOption, outputOption, distPath, getArg);
                        }));
                    }
                }
            }
    
            // wait until any written action has finished.
            await Promise.all(writePromises);
            log("info", "All bundles have been saved.");
    
            // trigger the entry module
            const entryPos = process.argv.indexOf("--entry");
            const entryFilePath = ((entryPos > 1) && process.argv[entryPos + 1]);
            entryFilePath && (
                logEx("info", "Starting", entryFilePath), 
                require(path.resolve(process.cwd(), entryFilePath))
            );
    
            logEx("info", "Done", (new Date()).toLocaleString());
        } catch (error) {
            logEx("error", "EXCEPTION", error);
        }
    })();
} else {
    /**
     * prepare the config for rollup if invoked as a submodule
     */

    const bundleConfigs = packageInfo.bundleConfigs || {};

    // function to throw and show an error
    function error(_tip) {
        logEx("error", "ERROR", _tip);
        throw _tip;
    }

    // function to generate the configs
    function configGenerator(predefinedConfigs) {
        predefinedConfigs || (predefinedConfigs = {});

        // peek the custom config
        const customConfigFile = getArg("--config") || bundleConfigs.configFile;
        if (!customConfigFile) {
            error("Must specified a config file in the command line or in the package.json file");
        }

        const customConfigGenerator = require(path.resolve(process.cwd(), customConfigFile));
        const customConfigs = (typeof customConfigGenerator === "function") ? customConfigGenerator(predefinedConfigs) : customConfigGenerator;
        if (!customConfigs || !customConfigs.entries) {
            error("no valid information in the config file");
        }
        const entries = (customConfigs.entries instanceof Array) ? customConfigs.entries: [customConfigs.entries];
        const defaultConfigs = customConfigs.defaultConfigs || predefinedConfigs;

        // generate the config items for rollup
        return entries.map(_item => {
            if (_item) {
                typeof _item === "string" && (_item = { input: _item });
                const output = (_item.output || (_item.output = {}));
                const defOutput = defaultConfigs.output;
                for (let cName in defOutput) {
                    (cName in output) || (output[cName] = defOutput[cName]);
                }
                output.name || (output.name = path.basename(_item.input, path.extname(_item.input)));
                output.file || (output.file = `${output.$dir}/${path.basename(_item.input)}`);
                for (let cName in output) {
                    cName.startsWith("$") && (delete output[cName]);
                }
                for (let cName in defaultConfigs) {
                    (cName !== "output") && ((cName in _item) || (_item[cName] = defaultConfigs[cName]));
                }
            }
            return _item;
        });
    }

    /** 
     * generate the config items for rollup
     */
    const json = require('@rollup/plugin-json');
    const babel = require('@rollup/plugin-babel').babel;
    const resolve = require("@rollup/plugin-node-resolve").nodeResolve;
    const commonjs = require('@rollup/plugin-commonjs');
    const nodePolyfills = require('rollup-plugin-node-polyfills');
    const terser = require('rollup-plugin-terser').terser;
    const minifyHTML = require('rollup-plugin-html-literals');
    const defaultMinifyOptions = require('minify-html-literals').defaultMinifyOptions;
    // import builtins from 'builtin-modules';
    module.exports = configGenerator({
        output: {
            $dir: getArg("--outputDir") || bundleConfigs.outputDir || ".dist",
            format: bundleConfigs.format || "umd",
            sourcemap: true,
            name: getArg("--name") || bundleConfigs.libName || packageInfo.name,
            intro: `var __STAMP__ = ${bundleConfigs.stamp !== undefined ? '"' + String(bundleConfigs.stamp) + '"' : Date.now()};\nvar __VERSION__ = "${packageInfo.version}";`,
            globals: {
                'regenerator-runtime': 'regeneratorRuntime'
            }
        },
        plugins: [
            commonjs(),
            minifyHTML({
                options: {
                    minifyOptions: {
                        ...defaultMinifyOptions,
                        keepClosingSlash: true
                    },
                    shouldMinify(_template) {
                        return _template && (_template.parts instanceof Array) && _template.parts.some(part => {
                            return part.text.includes('<!--template XML-->');
                        });
                    },
                    generateSourceMap(_magicStr, _fileName) {
                        return _magicStr.generateMap({
                            file: `${_fileName}-converted.map`,
                            source: _fileName,
                            includeContent: true
                        });
                    }
                }
            }),
            nodePolyfills(),
            resolve({
                browser: true,
                preferBuiltins: true,
                //resolveOnly: [ /^.\/src\/*$/, /^@babel\/runtime\/*$/]
            }),
            babel({
                include: 'src/**',
                exclude: 'node_modules/**',
                babelHelpers: 'runtime',
                babelrc: false,
                presets: [
                    "@babel/env"
                ],
                plugins: [
                    ['@babel/plugin-proposal-class-properties'],
                    ['@babel/plugin-transform-classes'],
                    [
                        '@babel/plugin-transform-runtime',
                        {
                            corejs: false,
                            helpers: true,
                            useESModules: true,
                            regenerator: true
                        }
                    ]
                ],
            }),
            json(),
            getArg("--compress") === "true" ? terser() : undefined
        ],
        external: []
    });
}
