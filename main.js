const { Plugin, MarkdownView, PluginSettingTab, Notice, Setting } = require('obsidian');

module.exports = class HeadingPathPlugin extends Plugin {
    settings = {
        concatSymbol: ">",
        convertLatex: false
    };

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SettingTab(this.app, this));

        this.developerMode = this.app.vault.getConfig('developerMode') || false;
        if (this.developerMode) {
            console.log("Loading Heading Path plugin in developer mode");
        }

        this.addCommand({
            id: 'copy',
            name: 'Copy',
            callback: () => this.Copy(),
            hotkeys: []
        });
    }

    onunload() {
        if (this.developerMode) {
            console.log("Unloading Heading Path plugin");
        }
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, this.settings, data);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    convertLatexToPlainText(text) {
        return text.replace(/\$(.*?)\$/g, (match, p1) => {
            let cleaned = p1
                .replace(/\\(?:text|mathrm|mathbf|mathit)\{([^}]*)\}/g, '$1')  // Convert LaTeX text commands to plain text
                .replace(/\\[a-z]+\s*/gi, '')  // Remove other LaTeX commands
                .replace(/\{/g, '(')  // Replace left curly braces
                .replace(/\}/g, ')')  // Replace right curly braces
                .replace(/_([^_()]+)/g, (_, subscript) => `_${this.parseSubscript(subscript)}`)  // Handle subscripts
                .replace(/_([(])/g, '_$1');  // Adjust subscript formatting if followed by a parenthesis
    
            return cleaned;
        });
    }
    
    parseSubscript(content) {
        let result = '';
        let depth = 0;
        for (let i = 0; i < content.length; i++) {
            let char = content[i];
            if (char === ',' && depth === 0) {
                result += ', ';
            } else if (char === '_') {
                let subContent = '';
                let skip = i + 1;
                if (content[skip] === '{') {
                    depth++;
                    skip++;
                    while (depth > 0 && skip < content.length) {
                        if (content[skip] === '{') depth++;
                        if (content[skip] === '}') depth--;
                        if (depth > 0) subContent += content[skip];
                        skip++;
                    }
                } else {
                    while (skip < content.length && content[skip].match(/[\w\\]/)) {
                        subContent += content[skip];
                        skip++;
                    }
                }
                result += '_(' + this.parseSubscript(subContent) + ')';
                i = skip - 1;  // Ensure i skips over the processed substring
            } else {
                result += char;
            }
        }
        return result;
    }

    Copy() {
        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (!editor) {
            new Notice('No active editor', 3000);
            return;
        }
    
        const cursor = editor.getCursor();
        let line = cursor.line;
        let headingFound = false;
        let headingPath = "";
    
        while (line >= 0 && !headingFound) {
            const lineText = editor.getLine(line);
            const headingMatch = lineText.match(/^(#{1,6})\s*(.*)/);
    
            if (headingMatch) {
                headingFound = true;
                let headingLevel = headingMatch[1].length;
                let headingText = headingMatch[2].trim();
    
                if (this.settings.convertLatex) {
                    headingText = this.convertLatexToPlainText(headingText);
                }
    
                headingPath = headingText;
                for (let upperLine = line - 1; upperLine >= 0; upperLine--) {
                    const currentLineText = editor.getLine(upperLine);
                    const currentHeadingMatch = currentLineText.match(/^(#{1,6})\s*(.*)/);
    
                    if (currentHeadingMatch) {
                        let currentHeadingLevel = currentHeadingMatch[1].length;
                        if (currentHeadingLevel < headingLevel) {
                            headingText = currentHeadingMatch[2].trim();
                            if (this.settings.convertLatex) {
                                headingText = this.convertLatexToPlainText(headingText);
                            }
                            headingPath = `${headingText}${this.settings.concatSymbol}${headingPath}`;
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
        });
    }
}

class SettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
    
        containerEl.createEl('h1', { text: 'Custom concatenation' });
    
        const concatContainer = containerEl.createDiv({
            cls: 'settings-container'
        });
    
        new Setting(concatContainer)
            .setName('Concatenation string')
            .setDesc("Define the string used to concatenate headings when copying a selection's heading path.")
            .addText(text => text
                .setValue(this.plugin.settings.concatSymbol)
                .onChange(async (value) => {
                    this.plugin.settings.concatSymbol = value;
                    dynamic_stringText.textContent = `"${value}"`;
                    dynamic_pathText.textContent = `"...{heading}${value}{heading}..."`;
                    await this.plugin.saveSettings();
                })); 

        // Container for demo string settings
        const demo_stringContainer = concatContainer.createDiv({
            cls: 'demo-string-container',
            attr: { style: 'display: flex; justify-content: space-between; margin-bottom: 5px'}
        });
        // Static text on the left
        demo_stringContainer.createEl('span', {
            text: "Your concatenation string:"
        });
        // Dynamic text on the right
        const dynamic_stringText = demo_stringContainer.createEl('span', {
            text: `"${this.plugin.settings.concatSymbol}"`
        });

        // Container for default string settings
        const default_stringContainer = concatContainer.createDiv({
            cls: 'default-string-container',
            attr: { style: 'display: flex; justify-content: space-between; margin-bottom: 10px'}
        });
        // Create first span element with text "Default:"
        const span1s = default_stringContainer.createEl('span', {
            text: "Default concatenation string:"
        });
        span1s.style.fontSize = '12px'; // Correct property name for font size
        span1s.style.color = '#aaaaaa'; // Correct hexadecimal color value
        // Create second span element with dynamic text
        const span2s = default_stringContainer.createEl('span', {
            text: `">"`
        });
        span2s.style.fontSize = '12px'; // Apply styles to the second span
        span2s.style.color = '#aaaaaa';
        
        // Container for demo path settings
        const demo_pathContainer = concatContainer.createDiv({
            cls: 'demo-path-container',
            attr: { style: 'display: flex; justify-content: space-between;margin-bottom: 5px' }
        });
        // Static text on the left
        demo_pathContainer.createEl('span', {
            text: "Your heading path will be copied as:"
        });
        // Dynamic text on the right
        const dynamic_pathText = demo_pathContainer.createEl('span', {
            text: `"...{heading}${this.plugin.settings.concatSymbol}{heading}..."`
        });   

        // Container for default path settings
        const default_pathContainer = concatContainer.createDiv({
            cls: 'default-path-container',
            attr: { style: 'display: flex; justify-content: space-between; margin-bottom: 10px'}
        });
        // Create first span element with text "Default:"
        const span1p = default_pathContainer.createEl('span', {
            text: "Default heading path:"
        });
        span1p.style.fontSize = '12px'; // Correct property name for font size
        span1p.style.color = '#aaaaaa'; // Correct hexadecimal color value
        // Create second span element with dynamic text
        const span2p = default_pathContainer.createEl('span', {
            text: `"...{heading}>{heading}..."`
        });
        span2p.style.fontSize = '12px'; // Apply styles to the second span
        span2p.style.color = '#aaaaaa';  

        containerEl.createEl('hr');

        containerEl.createEl('h1', { text: 'Handle LaTeX' });

        const latexContainer = containerEl.createDiv({
            cls: 'latex-container'
        });

        new Setting(latexContainer)
            .setName('Convert LaTeX in heading path to plain text')
            .setDesc('Depending on use case, LaTeX characters may be problematic. Does not affect headings, only the copied path.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.convertLatex)
                .onChange(async (value) => {
                    this.plugin.settings.convertLatex = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('hr');

        containerEl.createEl('p', { text: 'GitHub Repository: ' });
        const link = containerEl.createEl('a', { href: 'https://github.com/19msb/obsidian-heading-path', text: 'https://github.com/19msb/obsidian-heading-path' });
        link.style.display = 'block';

        containerEl.createEl('hr');

        containerEl.createEl('p', { text: ' If you find this plugin useful and would like to support its development, you can buy me a coffee:' });    
        const koFiButton = containerEl.createEl('a', { href: 'https://ko-fi.com/I2I2ZHYPA', target: '_blank' });
        koFiButton.createEl('img', {
            attr: {
                height: '36',
                style: 'border:0px;height:36px;',
                src: 'https://storage.ko-fi.com/cdn/kofi2.png?v=3',
                border: '0',
                alt: 'Buy Me a Coffee at ko-fi.com'
            }
        });
        koFiButton.style.display = 'block';
        koFiButton.style.textAlign = 'left';
    }
}