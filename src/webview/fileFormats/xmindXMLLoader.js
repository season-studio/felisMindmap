import { markersToFelisMap } from "./xmindMarkerMap";

export async function loadXMindXMLManifest(_zip, _manifest) {
    let manifestContent = _zip.file("META-INF/manifest.xml");
    if (manifestContent) {
        manifestContent = await manifestContent.async("text");
        manifestContent = (new DOMParser()).parseFromString(manifestContent, "text/xml");
        const manifestList = manifestContent?.documentElement?.childNodes;
        const fileEntries = _manifest["file-entries"];
        (manifestList instanceof NodeList) && manifestList.forEach(item => {
            if ((String(item.nodeName).toLocaleLowerCase() === "file-entry")
                && item.hasAttribute("full-path")) {
                let path = String(item.getAttribute("full-path") || "").trim();
                if (!path.endsWith("/")) {
                    let mediaType = String(item.getAttribute("media-type") || "").trim();
                    fileEntries[path] = (mediaType ? { "media-type": mediaType } : { });
                }
            }
        });
    }
}

function parseXmlContent(_obj, _node, _map, _undefinedParser) {
    (typeof _undefinedParser === "function") || (_undefinedParser = undefined);
    const children = _node.childNodes;
    (children instanceof NodeList) && children.forEach(item => {
        const tagName = String(item.nodeName || "").toLocaleLowerCase();
        const parser = (tagName && _map && _map[tagName]);
        if (parser) {
            (typeof parser === "string") ? (_obj[parser] = item.textContent) : ((typeof parser === "function") && parser(_obj, item));
        } else if (_undefinedParser) {
            _undefinedParser(_obj, item);
        }
    });
    return _obj;
}

function parseXmlAttrs(_obj, _node, _map) {
    for (let key in _map) {
        let attr = _map[key];
        let fn = attr.fn;
        (typeof fn === "function") ? (attr = attr.n) : (fn = undefined);
        if (_node.hasAttribute(attr)) {
            let value = String(_node.getAttribute(attr) || "");
            fn && (value = fn(value));
            _obj[key] = value;
        }
    }
    return _obj;
}

const topicTopicParserMap = {
    "topic": (_list, _child) => {
        _list.push(loadTopicItem(_child));
    }
};

const childrenTopicsParserMap = {
    "topics": (_children, _itemNode) => {
        // const type = _itemNode.getAttribute("type");
        // console.log(type);
        parseXmlContent(_children, _itemNode, topicTopicParserMap);
    }
}

const topicContentParserMap = {
    "title": "title",
    "children": (_topic, _node) => {
        _topic.children = parseXmlContent([], _node, childrenTopicsParserMap);
    },
    "xhtml:img": (_topic, _node) => {
        _topic.image = parseXmlAttrs({}, _node, {
            src: "xhtml:src",
            width: { n: "svg:width", fn: parseInt },
            height: { n: "svg:height", fn: parseInt }
        });
    },
    "labels": (_topic, _node) => {
        _topic.labels = parseXmlContent([], _node, {
            "label": (_labels, _item) => {
                _labels.push(String(_item.textContent));
            }
        })
    },
    "notes": (_topic, _node) => {
        _topic.notes = parseXmlContent({}, _node, {
            "plain": (_notes, _nodeItem) => {
                if (_notes.plain && _notes.plain.content) {
                    _notes.plain.content += `\r\n${_nodeItem.textContent}`;
                } else {
                    _notes.plain = { content: _nodeItem.textContent };
                }
            }
        });
    },
    "marker-refs": (_topic, _node) => {
        parseXmlContent(undefined, _node, undefined, (_, _markerNode) => {
            try {
                let markerID = String(_markerNode.getAttribute("marker-id") || "");
                for (let prefix in markersToFelisMap) {
                    if (markerID.startsWith(prefix)) {
                        markersToFelisMap[prefix](_topic, markerID);
                        break;
                    }
                }
            } catch (err) {
                console.warn("Exception raised in parse xmind classic marker", err);
            }
        });
    },
    "position": (_topic, _node) => {
        _topic.position = parseXmlAttrs({}, _node, {
            "x": { n: "svg:x", fn: parseInt},
            "y": { n: "svg:y", fn: parseInt}
        })
    },
    "extensions": (_topic, _node) => {
        _topic.extensions = parseXmlContent([], _node, {
            "extension": (_extensions, _itemNode) => {
                let extension = parseXmlAttrs({}, _itemNode, {
                    provider: "provider"
                });
                extension.content = [];
                parseXmlContent(undefined, _itemNode, {
                    "content": (_nouse, _contentNode) => {
                        parseXmlContent(extension.content, _contentNode, {}, (_list, _childNode) => {
                            _list.push({
                                name: _childNode.tagName,
                                content: _childNode.textContent
                            })
                        });
                    }
                })
                _extensions.push(extension);
            }
        });
    }
}

function loadTopicItem(_node) {
    let topic = parseXmlAttrs({}, _node, {
        id: "id",
        href: "xlink:href",
        structureClass: "structure-class"
    });
    parseXmlContent(topic, _node, topicContentParserMap);
    return topic;
}

const relationCtrlPointParserMap = {
    "control-point": (_cpSet, _node) => {
        const index = String(_node.getAttribute("index") || "");
        _cpSet[index] = parseXmlAttrs({}, _node, {
            amount: { n: "amount", fn: parseFloat },
            angle: { n: "angle", fn: parseFloat }
        });
    }
}

const relationshipParserMap = {
    "title": "title",
    "control-points": (_rel, _node) => {
        _rel.controlPoints = parseXmlContent({}, _node, relationCtrlPointParserMap);
    }
}

function relationshipParser(_relList, _relNode) {
    let _relationship = parseXmlAttrs({}, _relNode, {
        id: "id",
        end1Id: "end1",
        end2Id: "end2"
    });
    parseXmlContent(_relationship, _relNode, relationshipParserMap);
    _relList.push(_relationship);
}

const sheetParserMap = {
    "topic": (_sheet, _node) => {
        _sheet.topic = loadTopicItem(_node);
    },
    "title": "title",
    "relationships": (_sheet, _node) => {
        _sheet.relationships = parseXmlContent([], _node, {
            "relationship": relationshipParser
        });
    }
};

function loadSheetItem(_sheetNode) {
    let sheet = parseXmlAttrs({}, _sheetNode, {
        id: "id"
    });
    parseXmlContent(sheet, _sheetNode, sheetParserMap);
    return sheet;
}

export async function loadXMindXMLSheets(_zip) {
    const sheets = [];
    let sheetsXML = _zip.file("content.xml");
    if (sheetsXML) {
        sheetsXML = await sheetsXML.async("text");
        sheetsXML = (new DOMParser()).parseFromString(sheetsXML, "text/xml");
        parseXmlContent(undefined, sheetsXML.documentElement, {
            "sheet": (_, _sheetNode) => sheets.push(loadSheetItem(_sheetNode))
        })
    }
    return sheets;
}
