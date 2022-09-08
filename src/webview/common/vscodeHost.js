/**
 * VSCode宿主基本功能封装类
 */
export default class VSCodeHost extends EventTarget {
    #host;

    constructor (_host) {
        super();

        let queueID = 0;

        this.#host = _host;
        window.addEventListener('message', this.onMessage.bind(this));
        Object.defineProperties(this, {
            queueID: {
                get: () => {
                    return (queueID >= Number.MAX_SAFE_INTEGER) ? (queueID = 0) : (queueID++);
                },
                configurable: false
            }
        });
    }

    /**
     * 收到宿主的消息时的统一分发函数
     * @param {*} _event 
     */
    onMessage(_event) {
        const msg = _event.data;
        let eventType = msg.$notify ? "$notify" : (msg.$return ? (msg.$queueID ? `$return.${msg.$return}.${msg.$queueID}` : `$return.${msg.$return}`) : undefined);
        eventType && this.dispatchEvent(
            new CustomEvent(eventType, { detail: msg })
        );
    }

    postMessageRaw(_raw) {
        this.#host.postMessage(_raw);
    }

    postMessage(_cmd, _param) {
        this.#host.postMessage(Object.assign({command:_cmd}, _param));
    }

    sendMessage(_cmd, _param, _timeout) {
        return new Promise((resolve, reject) => {
            let queueID = `${Date.now()}.${this.queueID}`;
            let event = `$return.${_cmd}.${queueID}`;
            let thisArg = { event, resolve, reject, site: this };
            let fn = VSCodeHost.onResultReturn.bind(thisArg);
            thisArg.fn = fn;
            (_timeout > 0) && (thisArg.timerID = setTimeout(VSCodeHost.onTimeOut, _timeout, thisArg));
            this.addEventListener(event, fn, { once: true });
            this.postMessage(_cmd, Object.assign({}, _param, {$queueID: queueID}));
        });
    }

    static onTimeOut(item) {
        item.site?.removeEventListener(item.event, item.fn);
        item.timerID = undefined;
        (typeof item.reject === "function") && item.reject();
    }

    static onResultReturn(_event) {
        this.timerID && (clearTimeout(this.timerID), this.timerID = undefined);
        (typeof this.resolve === "function") && this.resolve(_event.detail);
    }
}