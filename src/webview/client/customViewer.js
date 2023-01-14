import { MindmapViewer, Topic, TopicFactor } from "mindmap.svg.js";
import { cloneObject } from "../../thirdpart/toolkits/src/cloneObject";
import { i18n } from "../../thirdpart/toolkits/src/i18n";
import { confirm } from "../../thirdpart/toolkits/src/tip";
import tip from "../../thirdpart/toolkits/src/tip/tip";
import { notifyChanged } from "../common/hostAdapter";

export class CustomViewer extends MindmapViewer {
    #history;
    #historyCursor;
    #historyDirtyThredsold;

    constructor(_doc, _node) {
        super(_doc, _node);
        this.enableDomEvent("touchstart");
        this.enableDomEvent("touchend");
        this.enableDomEvent("touchmove");
        this.#resetHistory();
    }

    dispose() {
        this.disableDomEvent("touchstart");
        this.disableDomEvent("touchend");
        this.disableDomEvent("touchmove");
        MindmapViewer.prototype.dispose.call(this);
    }

    async copyTopic(_event, _topic) {
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-write' });
            if (permission.state === 'denied') {
                throw Error("Not allowed to write clipboard.");
            }

            _topic || (_topic = this.focusTopic);
            if (_topic instanceof Topic) {
                const ret = await _topic.exportImage({type: "png", /*fill: "#ffffff",*/ toBlob:true});
                if (ret) {
                    navigator.clipboard.write([
                        new ClipboardItem({ 
                            "image/png": ret.data,
                            "text/plain": new Blob([JSON.stringify({"season-mindmap-topic": _topic.exportTopicData(true)})], {type: "text/plain"})
                        })
                    ]);
                    tip(i18n("The topic has been copied"), {
                        type: "info",
                        timeout: 1000
                    });
                    return _topic;
                }
            }
        } catch (err) {
            err && confirm(i18n(err.message || String(err)), {
                icon: "error",
                buttons: ["OK"]
            });
        }
    }

    async cutTopic(_event, _topic) {
        _topic = await this.copyTopic(_event, _topic);
        if (_topic) {
            let newFocus = _topic && (_topic.nextSiblingTopic || _topic.previousSiblingTopic || _topic.parentTopic);
            _topic.drop();
            newFocus && newFocus.setFocus().render().showInView();
            this.render();
            return _topic;
        }
    }

    async pasteTopic(_event, _topic) {
        try {
            const permission = await navigator.permissions.query({ name: 'clipboard-read' });
            if (permission.state === 'denied') {
                throw Error("Not allowed to read clipboard.");
            }
            
            _topic || (_topic = this.focusTopic);

            if (_topic instanceof Topic) {
                const clipboards = await navigator.clipboard.read();
                for (const item of clipboards) {
                    if (item.types.includes("text/plain")) {
                        const blob = await item.getType("text/plain");
                        const reader = new FileReader();
                        reader.readAsText(blob, 'utf-8');
                        reader.onload = function () {
                            try {
                                const json = JSON.parse(reader.result);
                                const topicData = json["season-mindmap-topic"];
                                topicData && _topic.createChild(topicData) && _topic.render();
                                return true;
                            } catch(err) {

                            }
                        }
                    }
                }
            }
        } catch (err) {
            err && confirm(i18n(err.message || String(err)), {
                icon: "error",
                buttons: ["OK"]
            });
        }
    }

    ["@topic-domevent-touchstart"](_event) {
        const eventDetail = _event && _event.detail;
        const originEvent = eventDetail && eventDetail.originEvent;
        if (originEvent) {
            try {
                let type = originEvent.touches.length;
                let srcOpt = originEvent.changedTouches[0];
                if (type === 2) {
                    if (originEvent.changedTouches.length < 2) {
                        this.eventContainer.dispatchEvent(new MouseEvent("mouseup", {
                            button: 0,
                            screenX: srcOpt.screenX,
                            screenY: srcOpt.screenY,
                            clientX: srcOpt.clientX,
                            clientY: srcOpt.clientY,
                            ctrlKey: originEvent.ctrlKey,
                            shiftKey: originEvent.shiftKey,
                            altKey: originEvent.altKey,
                            metaKey: originEvent.metaKey
                        }));
                    }
                } else if (type !== 1) {
                    type = 0;
                }
                if (type) {
                    this.eventContainer.dispatchEvent(new MouseEvent("mousedown", {
                        button: ((type === 1) ? 0 : 2),
                        buttons: type,
                        screenX: srcOpt.screenX,
                        screenY: srcOpt.screenY,
                        clientX: srcOpt.clientX,
                        clientY: srcOpt.clientY,
                        ctrlKey: originEvent.ctrlKey,
                        shiftKey: originEvent.shiftKey,
                        altKey: originEvent.altKey,
                        metaKey: originEvent.metaKey
                    }));
                }
                //originEvent.preventDefault();
                //originEvent.stopPropagation();
            } catch (err) {
                this.env.warn("Exception raised in touchstart event", err);
            }
        }
    }

    ["@topic-domevent-touchend"](_event) {
        const eventDetail = _event && _event.detail;
        const originEvent = eventDetail && eventDetail.originEvent;
        if (originEvent) {
            try {
                let type = originEvent.touches.length + originEvent.changedTouches.length;
                let srcOpt = originEvent.changedTouches[0];
                if ((type === 1) || (type === 2)) {
                    this.eventContainer.dispatchEvent(new MouseEvent("mouseup", {
                        button: ((type === 1) ? 0 : 2),
                        buttons: ((originEvent.touches.length === 1) ? 1 : 0),
                        screenX: srcOpt.screenX,
                        screenY: srcOpt.screenY,
                        clientX: srcOpt.clientX,
                        clientY: srcOpt.clientY,
                        ctrlKey: originEvent.ctrlKey,
                        shiftKey: originEvent.shiftKey,
                        altKey: originEvent.altKey,
                        metaKey: originEvent.metaKey
                    }));
                    srcOpt = originEvent.touches[0];
                    srcOpt && this.eventContainer.dispatchEvent(new MouseEvent("mousedown", {
                        button: 0,
                        buttons: 1,
                        screenX: srcOpt.screenX,
                        screenY: srcOpt.screenY,
                        clientX: srcOpt.clientX,
                        clientY: srcOpt.clientY,
                        ctrlKey: originEvent.ctrlKey,
                        shiftKey: originEvent.shiftKey,
                        altKey: originEvent.altKey,
                        metaKey: originEvent.metaKey
                    }));
                }
                //originEvent.preventDefault();
                //originEvent.stopPropagation();
            } catch (err) {
                this.env.warn("Exception raised in touchstart event", err);
            }
        }
    }

    ["@topic-domevent-touchmove"](_event) {
        const eventDetail = _event && _event.detail;
        const originEvent = eventDetail && eventDetail.originEvent;
        if (originEvent) {
            try {
                let type = originEvent.touches.length;
                let srcOpt = originEvent.changedTouches[0];
                if ((type === 1) || (type === 2)) {
                    this.eventContainer.dispatchEvent(new MouseEvent("mousemove", {
                        button: ((type === 1) ? 0 : 2),
                        buttons: type,
                        screenX: srcOpt.screenX,
                        screenY: srcOpt.screenY,
                        clientX: srcOpt.clientX,
                        clientY: srcOpt.clientY,
                        ctrlKey: originEvent.ctrlKey,
                        shiftKey: originEvent.shiftKey,
                        altKey: originEvent.altKey,
                        metaKey: originEvent.metaKey
                    }));
                }
                originEvent.preventDefault();
                originEvent.stopPropagation();
            } catch (err) {
                this.env.warn("Exception raised in touchstart event", err);
            }
        }
    }

    ["@topic-event-change"](_event) {
        let detail = _event.detail;
        let topic = detail && detail.eventTarget;
        if (topic) {
            let action = CustomViewer.HistoryActionMap[detail.action];
            let logItem = action && action.log(topic, detail);
            if (logItem) {
                this.#history.splice(this.#historyCursor, this.#history.length, logItem);
                this.#historyCursor = this.#history.length;
                notifyChanged();
            }
        }
    }

    get canUndo() {
        return (this.#historyCursor > 0);
    }

    get canRedo() {
        return (this.#historyCursor < this.#history.length);
    }

    undo() {
        if (this.canUndo) {
            let logItem = this.#history[--this.#historyCursor];
            if (logItem) {
                let action = CustomViewer.HistoryActionMap[logItem.action];
                action && action.undo(this, logItem);
                this.render();
            }
        } else {
            tip(i18n("No history for undo"), {
                type: "info",
                timeout: 1000
            });
        }
    }

    redo() {
        if (this.canRedo) {
            let logItem = this.#history[this.#historyCursor++];
            if (logItem) {
                let action = CustomViewer.HistoryActionMap[logItem.action];
                action && action.redo(this, logItem);
                this.render();
            }
        } else {
            tip(i18n("No history for redo"), {
                type: "info",
                timeout: 1000
            });
        }
    }

    get dirty() {
        return this.#historyCursor > this.#historyDirtyThredsold;
    }

    resetViewer() {
        let rootTopic = this.rootTopic;
        if (rootTopic) {
            let data = rootTopic.exportTopicData();
            rootTopic.drop(a => a + 1);
            rootTopic = TopicFactor.generate(this.stageContainer, Topic, data, 0, this.env)
                    .render()
                    .queueAction(() => {
                        rootTopic && rootTopic.showInCenterOfView()
                    });
        }
    }

    #resetHistory() {
        this.#history = [];
        this.#historyCursor = 0;
        this.#historyDirtyThredsold = 0;
    }

    ["@topic-event-view-switch-sheet"](_event) {
        MindmapViewer.prototype["@topic-event-view-switch-sheet"].call(this, _event);
        this.#resetHistory();
        _event.detail && _event.detail.$setDirty && this.rootTopic.changeData("title", this.rootTopic.data.title);
    }

    ["@topic-event-view-submit"](_event) {
        if (this.dirty) {
            MindmapViewer.prototype["@topic-event-view-submit"].call(this, _event);
            this.#historyDirtyThredsold = this.#historyCursor;
        }
    }

    ["call-app-action"]() {
        $felisApp.callAction.apply($felisApp, Array.prototype.slice.call(arguments, 1));
    }

    static HistoryActionMap = {
        create: {
            log: function (_topic) {
                let log = {
                    action: "create",
                    topicID: _topic.id,
                    topicData: _topic.exportTopicData(),
                    parentID: _topic.parentTopic.id,
                    hasFocus: _topic.hasFocus
                };
                let siblingTopic = _topic.nextSiblingTopic;
                siblingTopic && (log.siblingID = siblingTopic.id);
                return log;
            },
            undo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                topic && topic.drop(null, true);
            },
            redo: function (_inst, _log) {
                let parent = _inst.getTopicByID(_log.parentID);
                let sibling = _log.siblingID && _inst.getTopicByID(_log.siblingID);
                let topic = (parent && parent.createChild(_log.topicData, sibling, true));
                topic && _log.hasFocus && topic.setFocus();
            }
        },
        changeData: {
            log: function (_topic, _detail) {
                return {
                    action: "changeData",
                    topicID: _topic.id,
                    key: _detail.key,
                    originValue: _detail.originValue,
                    topicData: cloneObject({}, _topic.data),
                    hasFocus: _topic.hasFocus
                };
            },
            undo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                if (topic) {
                    topic.changeData(_log.key, _log.originValue[_log.key], true);
                    _log.hasFocus && topic.setFocus();
                }
            },
            redo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                if (topic) {
                    topic.changeData(_log.key, _log.topicData[_log.key], true);
                    _log.hasFocus && topic.setFocus();
                }
            }
        },
        move: {
            log: function (_topic, _detail) {
                let log = {
                    action: "move",
                    topicID: _topic.id,
                    hasFocus: _topic.hasFocus,
                    originParentID: _detail.originParent.id,
                    originSiblingID: (_detail.originSibling ? _detail.originSibling.id : undefined),
                    parentID: _topic.parentTopic.id
                };
                let siblingTopic = _topic.nextSiblingTopic;
                siblingTopic && (log.siblingID = siblingTopic.id);
                return log;
            },
            undo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                let parent = _inst.getTopicByID(_log.originParentID);
                let sibling = _inst.getTopicByID(_log.originSiblingID);
                if (topic) {
                    parent && topic.moveTo(parent, sibling, true);
                    _log.hasFocus && topic.setFocus();
                }
            },
            redo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                let parent = _inst.getTopicByID(_log.parentID);
                let sibling = _inst.getTopicByID(_log.siblingID);
                if (topic) {
                    parent && topic.moveTo(parent, sibling, true);
                    _log.hasFocus && topic.setFocus();
                }
            }
        },
        drop: {
            log: function (_topic) {
                let log = {
                    action: "drop",
                    topicID: _topic.id,
                    parentID: _topic.parentTopic.id,
                    topicData: _topic.exportTopicData(),
                    hasFocus: _topic.hasFocus
                };
                let siblingTopic = _topic.nextSiblingTopic;
                siblingTopic && (log.siblingID = siblingTopic.id);
                return log;
            },
            undo: function (_inst, _log) {
                let parent = _inst.getTopicByID(_log.parentID);
                let sibling = _log.siblingID && _inst.getTopicByID(_log.siblingID);
                let topic = (parent && parent.createChild(_log.topicData, sibling, true));
                topic && _log.hasFocus && topic.setFocus();
            },
            redo: function (_inst, _log) {
                let topic = _inst.getTopicByID(_log.topicID);
                topic && topic.drop(null, true);
            }
        }
    }

    static DefaultUIControlMap = {
        "ctrl+wheel": { action: "zoom-view", args: [{}] },
        "mouseleft": { action: "move-view" },
        "arrowright": { action: "goto-topic-with-direction", args: ["right"]},
        "arrowleft": { action: "goto-topic-with-direction", args: ["left"]},
        "arrowup": { action: "gotoPreviousSiblingTopic" },
        "arrowdown": { action: "gotoNextSiblingTopic" }
    }
    
    UIControlMap = Object.assign({}, CustomViewer.DefaultUIControlMap)
}