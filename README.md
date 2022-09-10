# felisMindmap: a Mindmap Editor in Visual Studio Code
This extension support editing the mindmap in WYSIWYG mode in VSCode.
![screenshots](https://season-studio.github.io/felis-mindmap/screensnapshot.png)

## Features
- Show and edit mindmap
- The default file format is felis, also support xmind format
- Support multiple sheet in a mindmap file
- Switch English and Simplified Chinese for UI automatically according to the enviroment of vscode
- Support external functions by using the addons, such as import from/export to markdown

## Installation
Install through VS Code extensions. Search for "felis mindmap"

Visual Studio Code Market Place: felis-mindmap

## Usage
- Open any file with extension named ".felis" or ".xmind" after install this extension
- Edit the mindmap by using the shortcuts or the button commands in the menu and floating bar
- Create an empty file by executing command "new mindmap" in VSCode

## Commands
|Command|Feature|
|-------|-------|
|new mindmap|Create an empty mindmap file|

## Default Keyboard Shortcuts
|Key|Feature|
|---|-------|
|Ctrl+N|Create an empty mind map file|
|Ctrl+O|Open a mind map file|
|Ctrl+S|Save current mind map file|
|Ctrl+Z|Undo the last edit operation|
|Ctrl+Y|Redo the last operation you had undo|
|Tab|Add a new topic as a child of the focus topic|
|Enter|Add a new topic as a sibling of the focus topic|
|F2|Edit the title of the current focus topic|
|Ctrl+F|Search a topic|
|Home|Select the root topic|
|Arrow Down|Select the next sibling topic of the current focus topic|
|Arrow Up|Select the previous sibling topic of the current focus topic|
|Arrow Right|Select the topic in the right of the current focus topic|
|Arrow Left|Select the topic in the left of the current focus topic|
|Delete|Remove the focus topic|

Any other shortcut can be found in the menus. 
The shortcuts can be changed in the "Preference" options.

## FAQ
- we don't support the relationship line in the mindmap at this time
- we only support automatic layout mode, so you can NOT location the topic in a absolute postion
- the operations "delete the current sheet" and "rename the current sheet" can NOT be revoked
- for saving memory, we clear all no-used attachments when you change the page. So all the edit operations you have done in the page can NOT be revoked once you change the page.

## Release Notes

### 1.0.1
- Enable customize the shape of the topic box
- Enhance compatibility in Safari

### 1.0.0

- Initial release of felisMindmap

## Contact
Please report the issues on https://github.com/season-studio/felisMindmap/issues

Or mail to [season-studio@outlook.com](mailto:season-studio@outlook.com) if you have any question.
