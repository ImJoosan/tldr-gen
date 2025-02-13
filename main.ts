import { Plugin } from 'obsidian';

export default class ExamplePlugin extends Plugin {
	statusBarTextElement: HTMLSpanElement;

	onload() {
		this.statusBarTextElement = this.addStatusBarItem().createEl('span');
		this.readActiveFileAndUpdateLineCount()
		
		this.app.workspace.on('active-leaf-change', async () => {
			this.readActiveFileAndUpdateLineCount()
		});

		this.app.workspace.on('editor-change', editor => {
			const content = editor.getDoc().getValue();
			this.updateLineCount(content);
		});
	}
	private updateLineCount(fileContent?: string){
		const count = fileContent ? fileContent.split(/\r\n|\r|\n/).length : 0;
		const linesWord = count === 1 ? "line" : "lines";

		this.statusBarTextElement.textContent = `${count} ${linesWord}`
	};

	private async readActiveFileAndUpdateLineCount(){
		const file = this.app.workspace.getActiveFile();
		if (file) {
			const content = await this.app.vault.read(file);
			this.updateLineCount(content)
		} else {
			this.updateLineCount(undefined);
		}
	}
}