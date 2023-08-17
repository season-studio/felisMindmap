import { MindmapViewer, MindmapAddinPanel, Topic } from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";

const GraphicStyleDialogXML = `
<!--template XML-->
<g mmap-layout="line" mmap-layout-margin="9" mmap-layout-padding="0">
    <foreignObject width="100" height="50" style="overflow:visible">
        <style>
            .graphicStylePanel {
                padding: 3px;
                display: inline-flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: flex-start;
            }
            .graphicStylePanel input {
                padding: 0.2em;
                outline: none;
                box-sizing: content-box;
                border: solid 1px #999;
                font-size: 1em;
            }
            .graphicStylePanel p {
                white-space: nowrap;
                margin: 0.2em 0;
                display: inline-flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
            }
        </style>
        <div class="graphicStylePanel">
            <p>
                <input type="checkbox" d-bind-data="customWidth" d-enable="1" />
                <label d-i18n="1">Title Width</label>
                <input type="number" style="width: 4em;" min="1" d-bind-data="customWidth" />
            </p>
        </div>
    </foreignObject>
</g>
`;

function syncCheckStatus(_checkNode) {
    if (_checkNode) {
        let disable = !_checkNode.checked;
        _checkNode.parentElement?.querySelectorAll("input")?.forEach(node => {
            if (node !== _checkNode) {
                node.disabled = disable;
            }
        });
    }
}

const GraphicStyleDialogOptions = {
    rootAttrs: {
        "mmap-layout": "line",
        "mmap-layout-margin": "0",
        "mmap-layout-padding": "10",
        "mmap-layout-background": "dialogBubble",
        "mmap-bind-cancel-edit": "",
        "mmap-bind-hide-in-render": "relayout",
        "mmap-bind-filter-edit": "graphicStyle",
        "mmap-bind-filter-trigger": "graphicStyle"
    },
    singletonStamp: "topic-graphic-style-dialog",
    onInitialize(_opt) {
        this.rootNode.style.opacity = 1;
        this.rootNode.querySelectorAll("[d-i18n]").forEach((item) => {
            item.textContent = i18n(String(item.textContent).trim());
        });
        this.onLostFocus = () => {
            this.close();
        }
        _opt.env.addEventListener("topic-event-kill-focus", this.onLostFocus);

        const panelNode = this.rootNode.querySelector(".graphicStylePanel");
        if (panelNode) {
            const { width, height } = panelNode.getBoundingClientRect();
            const parentNode = panelNode.parentElement;
            if (parentNode) {
                parentNode.setAttribute("width", Math.ceil(width));
                parentNode.setAttribute("height", Math.ceil(height));
            }

            this.onInputKeydown = (e) => _opt.onInputKeydown?.call(this, e, _opt);
            this.onInputBlur = (e) => _opt.onInputBlur?.call(this, e, _opt);
            this.onCheckChange = (e) => _opt.onCheckChange?.call(this, e, _opt);
            this.onCheckClick = (e) => e.stopPropagation();
            this.syncDatas = () => {
                panelNode.querySelectorAll("input[d-bind-data],textarea[d-bind-data]").forEach(inputNode => {
                    let dataName = (inputNode.getAttribute("d-bind-data")||"");
                    if (inputNode.type === "checkbox") {
                        let fn = _opt["onInitCheckData" + dataName[0].toUpperCase() + dataName.substring(1)];
                        if (typeof fn === "function") {
                            inputNode.checked = fn.call(this, _opt, dataName, inputNode);
                        }
                        (inputNode.getAttribute("d-enable") === "1") && syncCheckStatus(inputNode);
                    } else {
                        let fn = _opt["onInitData" + dataName[0].toUpperCase() + dataName.substring(1)];
                        if (typeof fn === "function") {
                            inputNode.value = fn.call(this, _opt, dataName, inputNode);
                        }
                    }
                });
            };

            panelNode.querySelectorAll("input[d-bind-data],textarea[d-bind-data]").forEach(inputNode => {
                let dataName = (inputNode.getAttribute("d-bind-data")||"");
                if (inputNode.type === "checkbox") {
                    let fn = _opt["onInitCheckData" + dataName[0].toUpperCase() + dataName.substring(1)];
                    if (typeof fn === "function") {
                        inputNode.checked = fn.call(this, _opt, dataName, inputNode);
                    }
                    inputNode.addEventListener("change", this.onCheckChange);
                    inputNode.addEventListener("click", this.onCheckClick);
                    (inputNode.getAttribute("d-enable") === "1") && syncCheckStatus(inputNode);
                } else {
                    let fn = _opt["onInitData" + dataName[0].toUpperCase() + dataName.substring(1)];
                    if (typeof fn === "function") {
                        inputNode.defaultValue = fn.call(this, _opt, dataName, inputNode);
                    }
                    inputNode.addEventListener("keydown", this.onInputKeydown);
                    inputNode.addEventListener("blur", this.onInputBlur);
                }
            });
        }
    },
    onAfterLayout(_opt) {
        const panelBox = this.rootNode.getBBox();
        const topicBox = _opt.topic.getGraphicRect();
        this.rootNode.setAttribute("transform", `translate(${topicBox.x + (topicBox.width - panelBox.width) / 2}, ${topicBox.y + topicBox.height + 11})`);
        Topic.showNodeInSvgView(this.rootNode, this.rootNode.ownerSVGElement);
    },
    onClose(_opt) {
        _opt.env.removeEventListener("topic-event-kill-focus", this.onLostFocus);
        const panelNode = this.rootNode.querySelector(".graphicStylePanel");
        panelNode?.querySelectorAll("input[d-bind-data],textarea[d-bind-data]")?.forEach(inputNode => {
            if (inputNode.type === "checkbox") {
                inputNode.removeEventListener("change", this.onCheckChange);
                inputNode.removeEventListener("click", this.onCheckClick);
            } else {
                inputNode.removeEventListener("keydown", this.onInputKeydown);
                inputNode.removeEventListener("blur", this.onInputBlur);
            }
        });
    },
    onCheckChange(_event, _opt) {
        let checkNode = _event?.target;
        if (checkNode) {
            let dataName = (checkNode.getAttribute("d-bind-data")||"");
            let fn = _opt["onChangeCheckData" + dataName[0].toUpperCase() + dataName.substring(1)];
            (typeof fn === "function") && fn.call(this, _opt, dataName, checkNode.checked, checkNode);
            (checkNode.getAttribute("d-enable") === "1") && syncCheckStatus(checkNode);
        }
    },
    onInputBlur(_event, _opt) {
        let inputNode = _event?.target;
        let dataName = (inputNode?.getAttribute("d-bind-data")||"");
        let fn = _opt["onChangeData" + dataName[0].toUpperCase() + dataName.substring(1)];
        (typeof fn === "function") && fn.call(this, _opt, dataName, inputNode.value, inputNode);
    },
    onInputKeydown(_event, _opt) {
        let inputNode = _event?.target; 
        let dataName = (inputNode?.getAttribute("d-bind-data")||"");
        if (inputNode?.hasAttribute("d-custom-keydown")) {
            let fn = _opt["onKeydown" + dataName[0].toUpperCase() + dataName.subtring(1)];
            (typeof fn === "function") && fn.call(this, _opt, _event, dataName, inputNode);
        } else {
            let key = String(_event.key).toLowerCase();
            if ((key === "enter") && (!_event.shiftKey)) {
                key = undefined;
                let fn = _opt["onChangeData" + dataName[0].toUpperCase() + dataName.substring(1)];
                (typeof fn === "function") && fn.call(this, _opt, _event, dataName, inputNode.value, inputNode);
            } else if (key === "escape") {
                key = undefined;
                let fn = _opt["onInitData" + dataName[0].toUpperCase() + dataName.substring(1)];
                if (typeof fn === "function") {
                    inputNode.value = fn.call(this, _opt, dataName, inputNode);
                }
            }
            (key === undefined) && (_event.preventDefault(), _event.stopPropagation());
        }
    },
    onInitDataCustomWidth(_opt, _name, _node) {
        const {width:titleWidth} = _opt.topic.getGraphicRect(".season-topic-title");
        _node?.setAttribute("min", Math.ceil(titleWidth / (Number(_opt.topic.data?.title?.length) || titleWidth)));
        return Math.ceil(Number(_opt.topic.data.customWidth) || titleWidth);
    },
    onChangeDataCustomWidth(_opt, _name, _val, _node) {
        _opt.topic.changeData("customWidth", _val);
        _opt.topic.queueAction(() => {
            _opt.topic.render();
            _opt.onAfterLayout.call(this, _opt);
        });
    },
    onInitCheckDataCustomWidth(_opt, _name, _node) {
        return _name in _opt.topic.data;
    },
    onChangeCheckDataCustomWidth(_opt, _name, _val, _node) {
        _opt.topic.changeData("customWidth", _val ? _opt.onInitDataCustomWidth.call(this, _opt, _name) : undefined);
        _opt.topic.queueAction(() => {
            _opt.topic.render();
            _opt.onAfterLayout.call(this, _opt);
        }).queueAction(() => this.syncDatas());
    }
};

export function activeTopicGraphicStyleDialog(_view, _topic) {
    (_view instanceof MindmapViewer) && (_topic instanceof Topic) && MindmapAddinPanel(_topic.$assignedNode.ownerSVGElement, GraphicStyleDialogXML, Object.assign({view: _view, topic: _topic, env: _topic.env, singletonMutex: _topic.id}, GraphicStyleDialogOptions));
}
