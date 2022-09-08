import { privateMember } from "../../thirdpart/toolkits/src/privateMember";
import FelisDB from "felisdb";
import * as hostAdapter from "./hostAdapter";

function getAppActions() {
    let ret = privateMember($felisApp, "actions");
    ret || privateMember($felisApp, "actions", ret = {});
    return ret;
}

export default {
    registerAction(_name, _fn) {
        _name && (typeof _fn === "function") && (getAppActions()[_name] = _fn);
    },
    unregisterAction(_name) {
        if (_name) {
            delete getAppActions()[_name];
        }
    },
    callAction(_name) {
        let fn = getAppActions()[_name];
        return (typeof fn === "function") && fn.apply($felisApp, Array.prototype.slice.call(arguments, 1));
    },
    DB: FelisDB,
    hostAdapter,
};