const taskMarkerToFelisMap = ["task-start", "task-oct", "task-quarter", "task-3oct", "task-half", "task-5oct", "task-3quar", "task-7oct", "task-done"];

export const markersToFelisMap = {
    "priority-": function (_topic, _value) {
        _topic.priority = (parseInt(String(_value).substring(9)) || 0);
    },
    "task-": function (_topic, _value) {
        let idx = taskMarkerToFelisMap.indexOf(_value);
        _topic["task-marker"] = ((idx >= 0) ? idx : "unknown");
    }
}

export const felisToXMindMap = {
    "priority": function (_topic, _value) {
        let markers = _topic.markers;
        (markers instanceof Array) || (markers = (_topic.markers = []));
        markers.push({
            markerId: `priority-${_value}`
        });
    },
    "task-marker": function (_topic, _value) {
        let markers = _topic.markers;
        (markers instanceof Array) || (markers = (_topic.markers = []));
        markers.push({
            markerId: (taskMarkerToFelisMap[_value] || "task-unknown")
        });
    },
}