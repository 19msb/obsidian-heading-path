// main.js
module.exports = class HeadingPathPlugin extends require('obsidian').Plugin {
    onload() {
        this.developerMode = this.app.vault.getConfig('developerMode') || false;

        if (this.developerMode) {
            console.log("Loading Heading Path plugin in developer mode");
        }

        this.addCommand({
            id: 'copy',
            name: 'Copy',
            callback: () => this.Copy(),
            hotkeys: [] // User can set their own hotkey
        });
    }

    onunload() {
        if (this.developerMode) {
            console.log("Unloading Heading Path plugin");
        }
    }

    Copy() {
        const editor = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView)?.editor;
        if (!editor) {
            new Notice('No active editor');
            return;
        }

        const cursor = editor.getCursor();
        const lineText = editor.getLine(cursor.line);
        const headingMatch = lineText.match(/^(#{1,6})\s*(.*)/);

        if (!headingMatch) {
            new Notice("Please select a heading to 'Copy' its path");
            return;
        }

        let headingLevel = headingMatch[1].length;
        const headingText = headingMatch[2];

        let headingPath = headingText;
        for (let line = cursor.line - 1; line >= 0; line--) {
            const currentLineText = editor.getLine(line);
            const currentHeadingMatch = currentLineText.match(/^(#{1,6})\s*(.*)/);

            if (currentHeadingMatch) {
                let currentHeadingLevel = currentHeadingMatch[1].length;
                const currentHeadingText = currentHeadingMatch[2];

                if (currentHeadingLevel < headingLevel) {
                    headingPath = `${currentHeadingText}>${headingPath}`;
                    headingLevel = currentHeadingLevel;
                }
            }
        }

        navigator.clipboard.writeText(headingPath).then(() => {
            new Notice('Heading path copied to clipboard');
        }, () => {
            new Notice('Failed to copy heading path');
        });
    }

    displayTimedNotice(message, duration) {
        const notice = new require('obsidian').Notice(message);
        setTimeout(() => {
            if (notice) notice.hide();
        }, duration);
    }
}