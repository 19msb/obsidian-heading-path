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
            new Notice('No active editor', 3000);
            return;
        }

        const cursor = editor.getCursor();
        let line = cursor.line;

        // Traverse upwards to find the nearest heading
        let headingFound = false;
        let headingPath = "";
        while (line >= 0 && !headingFound) {
            const lineText = editor.getLine(line);
            const headingMatch = lineText.match(/^(#{1,6})\s*(.*)/);

            if (headingMatch) {
                headingFound = true;
                let headingLevel = headingMatch[1].length;
                const headingText = headingMatch[2];

                headingPath = headingText;
                // Continue to build the full path upwards
                for (let upperLine = line - 1; upperLine >= 0; upperLine--) {
                    const currentLineText = editor.getLine(upperLine);
                    const currentHeadingMatch = currentLineText.match(/^(#{1,6})\s*(.*)/);

                    if (currentHeadingMatch) {
                        let currentHeadingLevel = currentHeadingMatch[1].length;
                        if (currentHeadingLevel < headingLevel) {
                            headingPath = `${currentHeadingMatch[2]} > ${headingPath}`;
                            headingLevel = currentHeadingLevel;
                        }
                    }
                }
            }
            line--;
        }

        if (!headingFound) {
            new Notice("No heading found above the selected text", 3000);
            return;
        }

        navigator.clipboard.writeText(headingPath).then(() => {
            new Notice('Heading path copied to clipboard', 3000);
        }, () => {
            new Notice('Failed to copy heading path', 3000);
        });
    }
}