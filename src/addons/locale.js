export function $T(_text, _set) {
    let lang = String(navigator.language).toLocaleLowerCase();
    _set = _set && _set[_text];
    return (_set && _set[lang]) || _text;
}