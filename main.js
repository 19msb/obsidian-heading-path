const DEFAULT_SETTINGS = {
    concatSymbol: ">"
};

module.exports = class HeadingPathPlugin extends require('obsidian').Plugin {
    settings = DEFAULT_SETTINGS;

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

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }


    Copy() {
        const editor = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView)?.editor;
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
                const headingText = headingMatch[2];

                headingPath = headingText;
                for (let upperLine = line - 1; upperLine >= 0; upperLine--) {
                    const currentLineText = editor.getLine(upperLine);
                    const currentHeadingMatch = currentLineText.match(/^(#{1,6})\s*(.*)/);

                    if (currentHeadingMatch) {
                        let currentHeadingLevel = currentHeadingMatch[1].length;
                        if (currentHeadingLevel < headingLevel) {
                            headingPath = `${currentHeadingMatch[2]}${this.settings.concatSymbol}${headingPath}`;
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

const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class HeadingPathPlugin extends Plugin {
    settings = {
        concatSymbol: ">"
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

    Copy() {
        // Copy function logic remains the same
    }
}

class SettingTab extends PluginSettingTab {
    plugin;

    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();
    
        containerEl.createEl('h1', { text: 'Custom concatenation' });
    
        const settingsContainer = containerEl.createDiv({
            cls: 'settings-container'
        });
    
        // Input setting to update dynamic text
        new Setting(settingsContainer)
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
        const demo_stringContainer = settingsContainer.createDiv({
            cls: 'demo-string-container',
            attr: { style: 'display: flex; justify-content: space-between;margin-top: -5px; margin-bottom: 5px'}
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
        const default_stringContainer = settingsContainer.createDiv({
            cls: 'default-string-container',
            attr: { style: 'display: flex; justify-content: space-between; margin-bottom: 5px'}
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
        const demo_pathContainer = settingsContainer.createDiv({
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
        const default_pathContainer = settingsContainer.createDiv({
            cls: 'default-path-container',
            attr: { style: 'display: flex; justify-content: space-between'}
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