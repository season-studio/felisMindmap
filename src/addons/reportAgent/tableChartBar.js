import { $T } from "../locale";
import { localeInfo } from "./localeInfo";

const TableChartBarPanelXML = `
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
</style>
<g d-pname="normal" mmap-layout="line" mmap-layout-margin="9" mmap-layout-padding="0">
    <g class="season-topic-svg-button table-chart-bar-button" mmap-event-click="onAsTable" d-primary="" mmap-layout-background="auto">
        <use href="#icon-reportagent-table" width="26" height="26" />
        <g class="table-chart-bar-tip" mmap-layout-background="auto">
            <text>Set Topic As Table</text>
        </g>
    </g>
    <g class="season-topic-svg-button table-chart-bar-button" mmap-event-click="onAsChart" d-primary="" mmap-layout-background="auto">
        <use href="#icon-reportagent-chart" width="26" height="26" />
        <g class="table-chart-bar-tip" mmap-layout-background="auto">
            <text>Set Topic As Chart</text>
        </g>
    </g>
    <rect width="3" height="26" fill="none" stroke="none" />
    <g class="season-topic-svg-button table-chart-bar-button" d-svg-button-danger="" mmap-event-click="onRemove" mmap-layout-background="auto">
        <use href="#season-topic-predefine-image-delete" width="26" height="26" />
        <g class="table-chart-bar-tip" mmap-layout-background="auto">
            <text>Remove the table or chart flag</text>
        </g>
    </g>
</g>
`;

const ErrorInsideExistedTable = "Can not set a new table or chart inside an existed table or chart";

function checkNoInTableChart(_topic) {
    for (let parent = _topic.parentTopic; parent; parent = parent.parentTopic) {
        let data = parent.data;
        if (("table" in data) || ("chart" in data)) {
            return false;
        }
    }
    return true;
}

const TableChartBarPanelOptions = {
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
    singletonStamp: "table-chart-bar-panel",
    onInitialize(_opt) {
        this.rootNode.style.opacity = 0.9;
        this.rootNode.querySelectorAll(".table-chart-bar-tip > text").forEach((item) => {
            item.textContent = $T(String(item.textContent).trim(), localeInfo);
        });
    },
    onAfterLayout(_opt) {
        const panelBox = this.rootNode.getBBox();
        const topicBox = _opt.topic.getGraphicRect();
        this.rootNode.setAttribute("transform", `translate(${topicBox.x + (topicBox.width - panelBox.width) / 2}, ${topicBox.y + topicBox.height + 11})`);
        $felisApp.LibMindmap.Topic.showNodeInSvgView(this.rootNode, this.rootNode.ownerSVGElement);
    },
    onClose(_opt) {
        
    },
    onRemove(_event, _node, _opt, _key) {
        if (_opt.topic) {
            _opt.topic.changeData("table");
            _opt.topic.changeData("chart");
            _opt.topic.queueAction(() => _opt.topic.render());
        }
        this.close();
    },
    onAsTable(_event, _node, _opt, _key) {
        if (_opt.topic && checkNoInTableChart(_opt.topic)) {
            _opt.topic.changeData("table", true);
            _opt.topic.changeData("chart");
            _opt.topic.queueAction(() => _opt.topic.render());
        } else {
            app.TipKits.tip($T(ErrorInsideExistedTable, localeInfo), {
                type: "error",
                timeout: 1000
            });
        }
    },
    onAsChart(_event, _node, _opt, _key) {
        if (_opt.topic && checkNoInTableChart(_opt.topic)) {
            _opt.topic.changeData("table");
            _opt.topic.changeData("chart", true);
            _opt.topic.queueAction(() => _opt.topic.render());
        } else {
            app.TipKits.tip($T(ErrorInsideExistedTable, localeInfo), {
                type: "error",
                timeout: 1000
            });
        }
    }
};

export function activeTableChartBar(_eventDetail) {
    let type = _eventDetail.triggerContentType;
    TableChartBarPanelOptions.rootAttrs["mmap-bind-filter-edit"] = type;
    TableChartBarPanelOptions.rootAttrs["mmap-bind-filter-trigger"] = type;
    const topic = _eventDetail.eventTarget;
    if (topic instanceof $felisApp.LibMindmap.Topic) {
        if (checkNoInTableChart(topic)) {
            $felisApp.LibMindmap.MindmapAddinPanel(
                topic.$assignedNode.ownerSVGElement, 
                TableChartBarPanelXML, 
                Object.assign({topic, env: topic.env, singletonMutex: topic.id}, TableChartBarPanelOptions)
            );
        } else {
            app.TipKits.tip($T(ErrorInsideExistedTable, localeInfo), {
                type: "error",
                timeout: 1000
            });
        }
    }
}