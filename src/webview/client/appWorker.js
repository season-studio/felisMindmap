const DEF_TIMEOUT = 3000;

let gLastError = undefined;

function getLastError() {
    return gLastError;
}

function clearLastError() {
    gLastError = undefined;
}

function getWorkerComm(_timeout) {
    _timeout || (_timeout = DEF_TIMEOUT);
    const startTick = Date.now();
    const fn = (r) => {
        if (navigator.serviceWorker.controller) {
            r(navigator.serviceWorker.controller);
        } else {
            if ((Date.now() - startTick) < _timeout) {
                setTimeout(fn, 10, r);
            } else {
                r(undefined);
            }
        }
    };
    return new Promise(fn);
}

export const AppWorker = Object.create(('serviceWorker' in navigator) ? {
    getLastError,
    clearLastError,

    addMessenger(_cb) {
        if (typeof _cb === "function") {
            let fn = function (msg) {
                _cb(msg ? msg.data : undefined);
            };
            navigator.serviceWorker.addEventListener("message", fn);
            return fn;
        }
    },

    removeMessenger(_fn) {
        navigator.serviceWorker.removeEventListener("message", _fn);
    },

    getMessage() {
        return new Promise(r => {
            navigator.serviceWorker.addEventListener("message", (msg) => {
                r(msg ? msg.data : undefined)
            }, { once: true });
        })
    },

    async postMessage(_msgType, _param, _timeout) {
        try {
            clearLastError();
            let comm = await getWorkerComm(_timeout); 
            if (comm) {
                comm.postMessage({
                    msg: _msgType,
                    param: _param
                });
                return comm;
            }
        } catch (error) {
            gLastError = error;
        }
    },

    async sendMessage(_msgType, _param, _timeout) {
        try {
            clearLastError();
            let comm = await getWorkerComm(_timeout);
            if (comm) {
                return await new Promise((resolve, reject) => {
                    let channel = new MessageChannel();
                    let timeId = setTimeout(reject, (_timeout || DEF_TIMEOUT), undefined);
                    channel.port1.onmessage = e => {
                        timeId && clearTimeout(timeId);
                        resolve(e.data);
                    }
                    comm.postMessage({
                        msg: _msgType,
                        param: _param
                    }, [channel.port2]);
                });
            }
        } catch (error) {
            gLastError = error;
        }
    },

    async start(_script, _opt, _cb, _catch) {
        try {
            clearLastError();
            let registration = await navigator.serviceWorker.register(_script, _opt || {});
            (typeof _cb === "function") && _cb(registration);
            return registration;
        } catch (error) {
            gLastError = error;
            if (typeof _catch === "function") {
                _catch(error);
            } else {
                throw error;
            }
        }
    }
} : {
    getLastError,
    clearLastError,

    addMessenger(_cb) { },

    removeMessenger(_fn) { },

    getMessage() {
        return new Promise((resolve, reject) => {
            gLastError = new Error("ServiceWorker is not supported");
            reject();
        });
    },

    async postMessage(_msgType, _param, _timeout) { },

    async sendMessage(_msgType, _param, _timeout) { },

    async start(_script, _opt, _cb, _catch) { }
});

export default AppWorker;
