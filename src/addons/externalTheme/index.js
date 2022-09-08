import { $T } from "../locale";
import { colorfulThemeTemplate } from "./colorfulTheme";
import { localeInfo } from "./localeInfo";

const extensionList = {
    colorful: app.LibMindmap.CreateTopicExtensionFactor(colorfulThemeTemplate)
};

let activeExtension = undefined;

async function changeExternalTheme(_name, _noUpdateConfig) {
    activeExtension && activeExtension.unregister(app.view);
    activeExtension = undefined;
    if (_name) {
        activeExtension = extensionList[_name];
        activeExtension && activeExtension.register(app.view);
        _noUpdateConfig || await app.hostAdapter.setConfiguration("theme", _name);
    } else {
        await app.hostAdapter.deleteConfiguration("theme");
    }
    app.view.rootTopic?.render();
}

async function refreshDisplay() {
    let themeName = await app.hostAdapter.getConfiguration("theme");
    themeName && changeExternalTheme(themeName, true);
}

addon = {
    async active() {
        activeExtension = undefined;
        app.registerAction("changeExternalTheme", changeExternalTheme);
        app.menu.registerMenus({
            id: "addons.external-theme",
            title: $T("External Theme", localeInfo),
            menus: [{
                id: "addons.external-theme.clear-theme",
                title: $T("Clear", localeInfo),
                action: "changeExternalTheme"
            }, {}, {
                id: "addons.external-theme.colorful",
                title: $T("Colorful", localeInfo),
                action: "changeExternalTheme",
                arg: "colorful"
            }]
        }, "addons");
        app.env.addEventListener("topic-event-refresh-display", refreshDisplay);
        await refreshDisplay();
    },
    deactive() {
        activeExtension && activeExtension.unregister(app.view);
        app.view.rootTopic.render();
        activeExtension = undefined;
        app.menu.unregisterMenus("addons.external-theme");
        app.unregisterAction("changeExternalTheme");
        app.env.removeEventListener("topic-event-refresh-display", refreshDisplay);
    }
};

Object.defineProperty(addon, "name", {
    get() {
        return $T("External Theme", localeInfo);
    },
    configurable: false,
    enumerable: true
});
