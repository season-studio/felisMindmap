import { MindmapAddinPanel, Topic } from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";

const TopicBarPanelXML = `
<!--template XML-->
<style>
    .topic-bar-button > rect {
        /* clean-css ignore:start */x: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */y: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */rx: 5px;/* clean-css ignore:end */
        /* clean-css ignore:start */ry: 5px;/* clean-css ignore:end */
        width: 33px !important;
        height: 26px !important;
    }
    .topic-bar-button:not([d-primary]) > rect {
        /* clean-css ignore:start */x: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */y: 0;/* clean-css ignore:end */
        /* clean-css ignore:start */rx: 5px;/* clean-css ignore:end */
        /* clean-css ignore:start */ry: 5px;/* clean-css ignore:end */
        width: 26px !important;
        height: 26px !important;
    }
    .topic-bar-tip {
        display: none;
        opacity: 0;
        transform: translate(0px, 26px);
    }
    .topic-bar-tip > rect {
        fill: #ffeeaa;
        stroke: #333;
        stroke-width: 1px;
    }
    .topic-bar-tip > text {
        alignment-baseline: before-edge;
        dominant-baseline: text-before-edge;
        fill: #333;
    }
    .topic-bar-button:hover > .topic-bar-tip {
        display: unset;
        opacity: 1;
    }
    .component-list {
        overflow-y: scroll;
        overflow-x: hidden;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        border: 0px;
        border-left: 1px solid #ccc;
        box-sizing: border-box;
        padding: 0px 0px 0px 6px;
    }
    .component-item {
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        border: 0px;
        box-sizing: border-box;
        padding: 0px;
        background: none;
    }
    .component-item > span {
        margin-left: 5px;
    }
    .component-item:hover {
        background-color: #ccc;
    }
</style>
<g d-pname="normal" mmap-layout="line" mmap-layout-margin="9" mmap-layout-padding="0">
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onAddChild" d-primary="" mmap-layout-background="auto">
        <use href="#icon-add-child-topic" width="33" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Add Child Topic</text>
        </g>
    </g>
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onAddSibling" d-primary="" mmap-layout-background="auto">
        <use href="#icon-add-sibling-topic" width="33" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Add Sibling Topic</text>
        </g>
    </g>
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onDelete" d-primary="" d-svg-button-danger="" mmap-layout-background="auto">
        <use href="#icon-delete-topic" width="33" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Delete Topic</text>
        </g>
    </g>
    <rect width="1" height="26" fill="none" stroke="none" />
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onCopy" mmap-layout-background="auto">
        <use href="#icon-copy" width="26" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Copy Topic</text>
        </g>
    </g>
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onPaste" mmap-layout-background="auto">
        <use href="#icon-paste" width="26" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Paste Topic</text>
        </g>
    </g>
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onCut" mmap-layout-background="auto">
        <use href="#icon-cut" width="26" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Cut Topic</text>
        </g>
    </g>
    <rect width="1" height="26" fill="none" stroke="none" />
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onComponent" mmap-layout-background="auto">
        <use href="#icon-component" width="26" height="26" />
        <g class="topic-bar-tip" mmap-layout-background="auto">
            <text>Add Content of Topic</text>
        </g>
    </g>
</g>
<g d-pname="component" mmap-layout="line" mmap-layout-margin="9" mmap-layout-padding="0">
    <g class="season-topic-svg-button topic-bar-button" mmap-event-click="onBackToNormal" mmap-layout-background="auto">
        <use href="#icon-arrow-left" width="26" height="26" />
    </g>
    <foreignObject width="170" height="130">
        <div class="component-list">
        </div>
    </foreignObject>
</g>
`;

const TopicComponentList = [{
    icon: "#icon-picture",
    text: "Picture",
    contentType: "image"
}, {
    icon: "#icon-label",
    text: "Labels",
    contentType: "labels"
}, {
    icon: "#icon-notes",
    text: "Notes",
    contentType: "notes"
}, {
    icon: "#icon-flag",
    text: "Task progress",
    contentType: "task-marker"
}, {
    icon: "#icon-information",
    text: "Priority",
    contentType: "priority"
}, {
    icon: "#icon-clip",
    text: "Link or Attachment",
    contentType: "href"
}];

export function registerTopicComponent(_contentType, _text, _icon) {
    let isRepeat = false;
    try {
        TopicComponentList.forEach(item => {
            if (item.contentType === _contentType) {
                isRepeat = true;
                throw null;
            }
        });
    } catch { }
    isRepeat || TopicComponentList.push({
        contentType: _contentType,
        text: _text,
        icon: _icon
    });
}

export function unregisterTopicComponent(_contentType) {
    let itemPos = -1;
    try {
        TopicComponentList.forEach((item, index) => {
            if (item.contentType === _contentType) {
                itemPos = index;
                throw null;
            }
        });
    } catch { }
    (itemPos >= 0) && TopicComponentList.splice(itemPos, 1);
}

function initComponentList(_node, _list) {
    const listNode = _node.querySelector(".component-list");
    listNode && (_list instanceof Array) && _list.forEach((item, index) => {
        listNode.insertAdjacentHTML(
            "beforeend",
            `
            <div class="component-item" mmap-event-click="onEditComponent" d-content-type="${item.contentType}">
                <svg width="26" height="26" viewBox="0 0 26 26">
                    <use href="${item.icon}" width="26" height="26" />
                </svg>
                <span>${i18n(item.text || "")}</span>
            </div>
            `
        );
    })
}

const TopicBarPanelOptions = {
    rootAttrs: {
        "mmap-layout": "line",
        "mmap-layout-margin": "0",
        "mmap-layout-padding": "5",
        "mmap-layout-background": "dialogBubble",
        "mmap-bind-cancel-edit": "",
        "mmap-bind-hide-in-render": "relayout",
        "mmap-bind-filter-edit": "",
        "mmap-bind-filter-trigger": ""
    },
    singletonStamp: "topic-bar-panel",
    onInitialize(_opt) {
        this.rootNode.style.opacity = 0.9;
        this.rootNode.querySelectorAll(".topic-bar-tip > text").forEach((item) => {
            item.textContent = i18n(String(item.textContent).trim());
        });
        if (_opt.topic.level === 0) {
            this.rootNode.querySelectorAll('[mmap-event-click="onDelete"]').forEach(item => item.remove());
            this.rootNode.querySelectorAll('[mmap-event-click="onCut"]').forEach(item => item.remove());
            this.rootNode.querySelectorAll('[mmap-event-click="onAddSibling"]').forEach(item => item.remove());
        }
        this.onLostFocus = () => {
            this.close();
        }
        _opt.env.addEventListener("topic-event-kill-focus", this.onLostFocus);
        this.normalPanel = this.rootNode.querySelector('[d-pname="normal"]');
        this.componentPanel = this.rootNode.querySelector('[d-pname="component"]');
        initComponentList(this.componentPanel, TopicComponentList);
        _opt.startComponent ? this.normalPanel.remove() : this.componentPanel.remove();
    },
    onAfterLayout(_opt) {
        const panelBox = this.rootNode.getBBox();
        const topicBox = _opt.topic.getGraphicRect();
        this.rootNode.setAttribute("transform", `translate(${topicBox.x + (topicBox.width - panelBox.width) / 2}, ${topicBox.y + topicBox.height + 11})`);
        Topic.showNodeInSvgView(this.rootNode, this.rootNode.ownerSVGElement);
    },
    onClose(_opt) {
        _opt.env.removeEventListener("topic-event-kill-focus", this.onLostFocus);
    },
    onDelete(_event, _node, _opt, _key) {
        _opt.view.deleteFocusTopic();
    },
    onAddChild(_event, _node, _opt, _key) {
        _opt.view.createChildTopic();
    },
    onAddSibling(_event, _node, _opt, _key) {
        _opt.view.createSiblingTopic();
    },
    onCopy(_event, _node, _opt, _key) {
        _opt.view.copyTopic(null, _opt.topic);
    },
    onCut(_event, _node, _opt, _key) {
        _opt.view.cutTopic(null, _opt.topic);
    },
    onPaste(_event, _node, _opt, _key) {
        _opt.view.pasteTopic(null, _opt.topic);
    },
    onComponent(_event, _node, _opt, _key) {
        this.rootNode.appendChild(this.componentPanel);
        this.normalPanel.remove();
        this.relayout();
    },
    onBackToNormal(_event, _node, _opt, _key) {
        this.rootNode.appendChild(this.normalPanel);
        this.componentPanel.remove();
        this.relayout();
    },
    onEditComponent(_event, _node, _opt, _key) {
        const topic = _opt.topic;
        (topic instanceof Topic) && topic.notify("topic-event-edit", { triggerContentType:_node.getAttribute("d-content-type"), force: true })
    }
};

export function activeTopicBar(_view, _startComponent) {
    const topic = _view && _view.focusTopic;
    (topic instanceof Topic) && MindmapAddinPanel(topic.$assignedNode.ownerSVGElement, TopicBarPanelXML, Object.assign({view: _view, topic, env: topic.env, singletonMutex: topic.id, startComponent: _startComponent}, TopicBarPanelOptions));
}