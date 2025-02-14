import { Editor, MarkdownView, Plugin, EditorPosition, PluginSettingTab, App, Setting } from 'obsidian';
import axios from "axios";

interface MyPluginSettings {
	key: string;
	endpoint: string;
	prompt: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	key: 'default',
	endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=',
	prompt: 'Generate me a TLDR Based off of the following text. Make it one to two sentences. DO NOT INCLUDE THE WORD TLDR, ONLY PROVIDE THE TLDR: '
}

export default class ExamplePlugin extends Plugin {
	settings: MyPluginSettings;

	onload() {
		this.addSettingTab(new SampleSettingTab(this.app, this));
		this.loadSettings();

		this.addCommand({
			id: "generate-tldr",
			name: 'Generate TLDR',
			editorCallback: this.generateTLDR.bind(this)
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async generateTLDR(editor: Editor, view: MarkdownView){
		const lineIndex: number | null = this.getFirstHashtagLineIndex(editor);
		if (!lineIndex) return;
		const line = editor.getLine(lineIndex);

		const lineLength = line.length;
		const position: EditorPosition = {line : lineIndex, ch: 0};
		const position2: EditorPosition = {line : lineIndex, ch: lineLength};
		const doesTLDRExist = line.substring(0,5) == "TLDR:";
		
		this.queryGemini(this.settings.prompt + editor.getValue()).then((response) => {
			const tldr = "###### TLDR: \n" + response;

			if(doesTLDRExist){
				editor.replaceRange(tldr, position, position2);
			} else {
				editor.replaceRange(tldr, position);
			}
		});
	}

	private getFirstHashtagLineIndex = (editor: Editor): number | null => {
		if (!editor) return 0;
		const lineCount = editor.lineCount();
		for (let i = 0; i < lineCount; i++) {
			const lineText = editor.getLine(i);
			if (lineText.substring(0,5) == "TLDR:") {
				return i;
			}
			if ((lineText.substring(0,1) == "#" && !lineText.includes("TLDR")) || (lineText == "")) {
				return i;
			}
		}
		return 0;
	};

	private async queryGemini(prompt: string): Promise<string | null> {
		try {
			const response = await axios.post(this.settings.endpoint + this.settings.key, {
				contents: [{ parts: [{ text: prompt }] }],
			});
			const modelResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
			return modelResponse || "No valid response from Gemini";
		} catch (error: any) {
			console.error("Error querying Gemini:", error.response?.data || error.message);
			return "Error querying Gemini";
		}
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: ExamplePlugin;

	constructor(app: App, plugin: ExamplePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Enter your API key')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.key)
				.onChange(async (value) => {
					this.plugin.settings.key = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API Endpoint')
			.setDesc('Enter the API endpoint')
			.addText(text => text
				.setPlaceholder('Enter endpoint URL')
				.setValue(this.plugin.settings.endpoint)
				.onChange(async (value) => {
					this.plugin.settings.endpoint = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Prompt')
			.setDesc('Enter the prompt used for TLDR generation')
			.addTextArea(text => text
				.setPlaceholder('Enter prompt')
				.setValue(this.plugin.settings.prompt)
				.onChange(async (value) => {
					this.plugin.settings.prompt = value;
					await this.plugin.saveSettings();
				}));
	}
}
