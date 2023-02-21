export const ReportAgentPublicXML = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <style eblock-predefined="" d-tag="report-agent-public">
        .report-agent-flag > rect {
            fill: none;
            stroke: none;
        }
        .report-agent-flag > use {
            fill: #fff;
            stroke: none;
            filter: drop-shadow(0px 0px 1px #000);
        }
        [season-topic-focus] .report-agent-flag > use {
            filter: none;
        }
        .report-agent-flag:hover > rect {
            fill: #fff;
            opacity: 0.4;
        }
        .report-agent-category > rect {
            fill: rgba(255,255,255,0.5);
            stroke: #fff;
        }
        .report-agent-category:hover > rect {
            fill: #fff;
        }
        .report-agent-category > text {
            alignment-baseline: before-edge;
            dominant-baseline: text-before-edge;
            font-size: 0.8em;
            fill: var(--topic-font-color);
        }
        .report-agent-category:hover > text {
            fill: #000;
        }
        .report-agent-category tspan[d-flag] {
            font-style: italic;
            font-weight: bold;
        }
    </style>
    <script eblock-script="">
    <![CDATA[
        declarer.getExtensionInfo = function () {
            return {
                name: "report-agent-public"
            };
        };
    ]]>
    </script>
    <use eblock-template="" />
</svg>
`;

export const TableExtensionXML = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs eblock-predefined="" d-tag="report-agent-table">
        <symbol id="icon-reportagent-table" width="96" height="96" viewBox="0 0 96 96" preserveAspectRatio="none">
            <path d="M 82,38 H 62 V 26 h 20 z m 0,16 H 62 V 42 h 20 z m 0,16 H 62 V 58 H 82 Z M 38,70 V 58 H 58 V 70 Z M 14,70 V 58 H 34 V 70 Z M 14,42 H 34 V 54 H 14 Z M 14,26 H 34 V 38 H 14 Z M 58,42 V 54 H 38 V 42 Z M 58,26 V 38 H 38 V 26 Z M 8,20 V 76 H 88 V 20 Z"></path>
        </symbol>
    </defs>
    <script eblock-script="">
    <![CDATA[
        declarer.getExtensionInfo = function () {
            return {
                name: "table"
            };
        };
        declarer.onRendering = function (_data) {
            if (!_data || !("table" in _data)) {
                this.unmount();
            }
        };
    ]]>
    </script>
    <g eblock-template="" season-topic-content-type="table" ebevent-rendering="onRendering" class="report-agent-flag">
        <rect width="22" height="22" rx="3" ry="3" />
        <use width="22" height="22" href="#icon-reportagent-table" />
    </g>
</svg>
`;

export const ChartExtensionXML = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs eblock-predefined="" d-tag="report-agent-chart">
        <symbol id="icon-reportagent-chart" width="96" height="96" viewBox="0 0 96 96" preserveAspectRatio="none">
            <path d="M 14,14 V 82 H 82 V 76 H 20 V 14 Z m 27,0 V 70 H 52 V 14 Z M 26,35 V 70 H 37 V 35 Z m 30,0 V 70 H 67 V 35 Z M 71,52 V 70 H 82 V 52 Z"></path>
        </symbol>
    </defs>
    <script eblock-script="">
    <![CDATA[
        declarer.getExtensionInfo = function () {
            return {
                name: "chart"
            };
        };
        declarer.onRendering = function (_data) {
            if (!_data || !("chart" in _data)) {
                this.unmount();
            }
        };
    ]]>
    </script>
    <g eblock-template="" season-topic-content-type="chart" ebevent-rendering="onRendering" class="report-agent-flag">
        <rect width="22" height="22" rx="3" ry="3" />
        <use width="22" height="22" href="#icon-reportagent-chart" />
    </g>
</svg>
`;

export const CategoryExtensionXML = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs eblock-predefined="" d-tag="report-agent-category">
        <symbol id="icon-reportagent-category" width="96" height="96" viewBox="0 0 96 96" preserveAspectRatio="none">
            <path d="m 87.06,36.25 0.83,-6 H 67.78 L 70.71,9 H 64.65 L 61.73,30.25 H 38.78 L 41.71,9 H 35.65 L 32.73,30.25 H 12.89 l -0.82,6 H 31.9 l -3.24,23.5 H 8.827 L 8,65.75 H 27.83 L 24.9,87 h 6.06 L 33.89,65.75 H 56.83 L 53.91,87 h 6.05 L 62.89,65.75 H 83 l 0.83,-6 H 63.72 l 3.24,-23.5 z m -29.4,23.5 H 34.72 l 3.24,-23.5 H 60.9 Z"></path>
        </symbol>
    </defs>
    <script eblock-script="">
    <![CDATA[
        declarer.getExtensionInfo = function () {
            return {
                name: "category"
            };
        };
        declarer.onRendering = function (_data) {
            let str = _data && String(_data["category"] || "").trim();
            if (str) {
                let bgNode = this.$assignedNode.querySelector("rect");
                bgNode && (bgNode.style.display = "none");
                let textNode = this.$assignedNode.querySelector("tspan[d-category]");
                textNode && (textNode.textContent = str);
                textNode = this.$assignedNode.querySelector("text");
                let box = textNode.getBBox();
                if (bgNode && textNode) {
                    bgNode.setAttribute("width", box.width + 6);
                    bgNode.setAttribute("height", box.height + 6);
                    bgNode.style.display = "";
                }
            } else {
                this.unmount();
            }
        };
    ]]>
    </script>
    <g eblock-template="" season-topic-content-type="category" ebevent-rendering="onRendering" class="report-agent-category">
        <rect x="0" y="0" width="22" height="22" rx="3" ry="3" />
        <text x="3" y="3">
            <tspan d-flag="true">#&nbsp;</tspan>
            <tspan d-category="true"></tspan>
        </text>
    </g>
</svg>
`;