import { MindmapEnvironment } from "mindmap.svg.js";

export class CustomEnvironment extends MindmapEnvironment {
    #dragContext;

    constructor() {
        super();

        Object.defineProperty(this, "dragContext", {
            get: () => this.#dragContext,
            set: (_val) => {
                this.#dragContext = _val;
                (!_val) && this.fireEvent("topic-event-end-dragdrop");
            },
            configurable: false
        })
        this.#dragContext = undefined;
    }
}