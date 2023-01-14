import { $T } from "../locale";
import { localeInfo } from "./localeInfo";

const CategoryBarPanelXML = `
<!--template XML-->
<style>
    .table-chart-bar-button > rect {
        /* clean-css ignore:start */x: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */y: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */rx: 5px;/* clean-css ignore:end */
        /* clean-css ignore:start */ry: 5px;/* clean-css ignore:end */
        width: 26px !important;
        height: 26px !important;
    }
    .table-chart-bar-tip {
        display: none;
        opacity: 0;
        transform: translate(0px, 26px);
    }
    .table-chart-bar-tip > rect {
        fill: #ffeeaa;
        stroke: #333;
        stroke-width: 1px;
    }
    .table-chart-bar-tip > text {
        alignment-baseline: before-edge;
        dominant-baseline: text-before-edge;
        fill: #333;
        padding: 6px;
    }
    .table-chart-bar-button:hover > .table-chart-bar-tip {
        display: unset;
        opacity: 1;
    }
    .category-editor {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 0px 6px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 6px;
    }
    .category-editor > input {
        border-color: transparent;
        outline: none;
        box-sizing: border-box;
        background: transparent;
        width: 100%;
        padding-left: 0px;
        border-left-width: 0px;
    }
    .category-list {
        overflow-y: scroll;
        overflow-x: hidden;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border: 0px;
        border-top: 1px solid #eee;
        box-sizing: border-box;
        outline: #f00;
        flex: 1;
    }
    .category-item {
        width: 100%;
    }
    .category-item[d-category-select], [d-category-mouse] .category-item:hover {
        color: #0af;
        background-color: #eee;
    }
</style>
<g d-pname="component" mmap-layout="row" mmap-layout-margin="9" mmap-layout-padding="0">
    <foreignObject width="170" height="100">
        <div class="category-editor">
            <input mmap-event-keydown="onInputKeydown"></input>
            <div class="category-list"></div>
        </div>
    </foreignObject>
    <g class="season-topic-svg-button table-chart-bar-button" d-svg-button-danger="" mmap-event-click="onRemove" mmap-layout-background="auto" mmap-layout-align="right">
        <use href="#season-topic-predefine-image-delete" width="26" height="26" />
        <g class="table-chart-bar-tip" mmap-layout-background="auto">
            <text>Remove</text>
        </g>
    </g>
</g>
`;

const ErrorWithoutTable = "Category is only available in the grandchild topic of a table or chart";

function checkInsideTableChart(_topic) {
    let parent = _topic?.parentTopic?.parentTopic;
    if (parent) {
        let data = parent.data;
        return ("table" in data) || ("chart" in data);
    }
    return false;
}

function pickExistedCategories(_topic) {
    let parent = _topic?.parentTopic?.parentTopic;
    return new Set([...parent?.$assignedNode.querySelectorAll(".report-agent-category tspan[d-category]")].map(e => e?.textContent));
}

function selectFromCategoryList(_this, _step) {
    let listNode = _this.listNode;
    let inputNode = _this.inputNode;
    let index = (Number(_this.selectIndex) || 0);
    index += _step;
    if (index <= 0) {
        index = listNode.childElementCount;
    } else if (index > listNode.childElementCount) {
        index = 1;
    }
    _this.selectIndex = index;
    let item = listNode.querySelector(".category-item[d-category-select]");
    item?.removeAttribute("d-category-select");
    item = listNode.querySelector(`.category-item:nth-of-type(${index})`);
    if (item) {
        listNode.removeAttribute("d-category-mouse");
        item.scrollIntoView();
        item.setAttribute("d-category-select", "1");
        inputNode.value = item.textContent;
    }
}

const CategoryBarPanelOptions = {
    rootAttrs: {
        "mmap-layout": "line",
        "mmap-layout-margin": "0",
        "mmap-layout-padding": "5",
        "mmap-layout-background": "dialogBubble",
        "mmap-bind-cancel-edit": "",
        "mmap-bind-hide-in-render": "relayout",
        "mmap-bind-filter-edit": "category",
        "mmap-bind-filter-trigger": "category"
    },
    singletonStamp: "table-chart-bar-panel",
    onInitialize(_opt) {
        this.rootNode.querySelectorAll(".table-chart-bar-tip > text").forEach((item) => {
            item.textContent = $T(String(item.textContent).trim(), localeInfo);
        });
        this.selectIndex = 0;
        let inputNode = (this.inputNode = this.rootNode.querySelector("input"));
        if (inputNode) {
            inputNode.setAttribute("placeholder", $T("Input the category", localeInfo));
            inputNode.value = String(_opt.topic.data.category||"").trim();
            Promise.resolve().then(() => {
                inputNode?.focus();
            });
        }
        let listNode = (this.listNode = this.rootNode.querySelector(".category-list"));
        if (listNode) {
            for (let item of pickExistedCategories(_opt.topic)) {
                if (item) {
                    let itemNode = document.createElement("div");
                    if (itemNode) {
                        itemNode.setAttribute("class", "category-item");
                        itemNode.setAttribute("mmap-event-click", "onSelectCategory");
                        itemNode.textContent = item;
                        listNode.appendChild(itemNode);
                    }
                }
            }
            this.onListMouseMove = () => {
                listNode.setAttribute("d-category-mouse", "1");
                let item = listNode.querySelector(".category-item[d-category-select]");
                item?.removeAttribute("d-category-select");
            };
            listNode.addEventListener("mousemove", this.onListMouseMove);
        }
    },
    onAfterLayout(_opt) {
        const panelBox = this.rootNode.getBBox();
        const topicBox = _opt.topic.getGraphicRect();
        this.rootNode.setAttribute("transform", `translate(${topicBox.x + (topicBox.width - panelBox.width) / 2}, ${topicBox.y + topicBox.height + 11})`);
        $felisApp.LibMindmap.Topic.showNodeInSvgView(this.rootNode, this.rootNode.ownerSVGElement);
    },
    onClose(_opt) {
        if (this.onListMouseMove) {
            this.listNode?.removeEventListener("mousemove", this.onListMouseMove);
            this.onListMouseMove = undefined;
        }
    },
    onRemove(_event, _node, _opt, _key) {
        if (_opt.topic) {
            _opt.topic.changeData("category");
            _opt.topic.queueAction(() => _opt.topic.render());
        }
        this.close();
    },
    onInputKeydown(_event, _node, _opt, _key) {
        if (_event.keyCode == 38) {
            selectFromCategoryList(this, -1);
        } else if (_event.keyCode == 40) {
            selectFromCategoryList(this, 1);
        } else if (_event.keyCode == 13) {
            let value = String(this.inputNode.value || "").trim();
            if (value) {
                _opt.topic.changeData("category", value);
            } else {
                _opt.topic.changeData("category");
            }
            _opt.topic.queueAction(() => _opt.topic.render());
            this.close();
        } else if (_event.keyCode == 27) {
            this.close();
        }
    },
    onSelectCategory(_event, _node, _opt, _key) {
        if (_node.classList.contains("category-item")) {
            let value = _node.textContent.trim();
            if (value) {
                _opt.topic.changeData("category", value);
                _opt.topic.queueAction(() => _opt.topic.render());
                this.close();
            }
        }
    }
};

export function activeCategoryBar(_eventDetail) {
    const topic = _eventDetail.eventTarget;
    if (topic instanceof $felisApp.LibMindmap.Topic) {
        if (checkInsideTableChart(topic)) {
            $felisApp.LibMindmap.MindmapAddinPanel(
                topic.$assignedNode.ownerSVGElement, 
                CategoryBarPanelXML, 
                Object.assign({topic, env: topic.env, singletonMutex: topic.id}, CategoryBarPanelOptions)
            );
        } else {
            app.TipKits.tip($T(ErrorWithoutTable, localeInfo), {
                type: "error",
                timeout: 1000
            });
        }
    }
}