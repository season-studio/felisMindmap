import { MindmapAddinPanel, Topic } from "mindmap.svg.js";
import { i18n } from "../../thirdpart/toolkits/src/i18n";
import tip from "../../thirdpart/toolkits/src/tip/tip";

const SearchBarPanelXML = `
<!--template XML-->
<div id="topic_search_panel" class="mindmap-menubar" style="margin-top: 6px; padding: 6px;">
    <style>
    .topic-search-bar-input {
        outline: none;
        border: 1px solid #777;
        box-sizing: border-box;
        color: #000;
        background-color: #fff;
    }
    </style>
    <span>{{Search:}}&nbsp;</span>
    <input class="topic-search-bar-input" tabindex="0" />&nbsp;
    <input type="button" value="{{Next}}" id="topic_search_next" />&nbsp;
    <input type="button" value="{{Cancel}}" id="topic_search_cancel" />
</div>
`;

function layoutPanel(_panel) {
    let menuBar = document.querySelector(".mindmap-menubar:not(#topic_search_panel)");
    _panel.style.top = menuBar.getBoundingClientRect().bottom;
    _panel.style.zIndex = (Number(getComputedStyle(menuBar)["z-index"]) || 0) - 1;
    document.body.appendChild(_panel);
    _panel.querySelector(".topic-search-bar-input").focus();
}

export function activeSearchBar() {
    let panel = document.getElementById("topic_search_panel");
    if (!panel) {
        const doc = (new DOMParser()).parseFromString(SearchBarPanelXML.replace(/\{\{.*?\}\}/ig, function (item) {
            item = item.substring(2, item.length - 2);
            return i18n(item);
        }), "text/html");
        panel = doc.getElementById("topic_search_panel");

        let searchText = undefined;
        let startTopic = undefined;
        let iteratorRoot = undefined;
        let iterator = undefined;

        function getNextIteratorRoot(_root) {
            let ret = _root.nextSiblingTopic;
            if (!ret) {
                ret = _root.parentTopic;
                ret = ret ? getNextIteratorRoot(ret) : _root;
            }
            return ret;
        }

        function iterateFn() {
            if (iterator) {
                let cursor = iterator.next();
                if (cursor.done) {
                    iteratorRoot = getNextIteratorRoot(iteratorRoot) || iteratorRoot;
                    iterator = iteratorRoot.enumerateTopics();
                } else {
                    let curTopic = cursor.value;
                    if (curTopic instanceof Topic) {
                        if (curTopic.equal(startTopic)) {
                            startTopic.setFocus();
                            searchText = undefined;
                            startTopic = undefined;
                            iteratorRoot = undefined;
                            iterator = undefined;
                            tip(i18n("Search to the end"), {
                                type: "info",
                                timeout: 1000
                            });
                            return;
                        } else {
                            startTopic || (startTopic = curTopic);
                            if (String(curTopic.data.title).toLowerCase().includes(searchText)) {
                                curTopic.setFocus().showInView();
                                return ;
                            }
                        }
                    }
                }
                Promise.resolve().then(iterateFn);
            }
        }

        panel.querySelector("#topic_search_next").addEventListener("click", function () {
            let inputText = String(panel.querySelector(".topic-search-bar-input").value).trim().toLowerCase();
            if ((inputText !== searchText) || !startTopic) {
                searchText = inputText;
                startTopic = undefined;
                if (inputText) {
                    iteratorRoot = ($felisApp.view.focusTopic || $felisApp.view.rootTopic);
                    iterator = (iteratorRoot && iteratorRoot.enumerateTopics());
                } else {
                    iterator = undefined;
                    iteratorRoot = undefined;
                }
            }
            Promise.resolve().then(iterateFn);
        });

        panel.querySelector("#topic_search_cancel").addEventListener("click", function () {
            panel.remove();
        });
    }

    layoutPanel(panel);
}