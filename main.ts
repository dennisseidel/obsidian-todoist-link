import { Editor, App, EditorPosition, MarkdownView, Plugin, HeadingCache, PluginSettingTab, Setting } from 'obsidian';
import { TodoistApi } from '@doist/todoist-api-typescript'


interface TodoistLinkSettings {
	apikey: string;
}

const DEFAULT_SETTINGS: TodoistLinkSettings = {
	apikey: ''
}

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return lineText
}

function prepareTask(line: string) {
	line = line.trim()
	//remove all leading non-alphanumeric characters
	line = line.replace(/^\W+|\W+$/, '')
	//line = urlEncode(line)
	return line
}

// https://github.com/mgmeyers/obsidian-copy-block-link/blob/9f9ce83ecabeda03528fe3efddbd2d766d280821/main.ts#L120
// https://github.com/blacksmithgu/obsidian-dataview/blob/60455e5aaf98bfea3848431c7cc3efbb5e2f4427/src/data/parse/markdown.ts#L118
export function findPreviousHeader(line: number, headers: HeadingCache[]): string | undefined {
    if (headers.length == 0) return undefined;
    if (headers[0].position.start.line > line) return undefined;

    let index = headers.length - 1;
    while (index >= 0 && headers[index].position.start.line > line) index--;

    return headers[index].heading;
}


function urlEncode(line: string) {
	line = encodeURIComponent(line)
	return line
}


function createProject(title: string, deepLink: string, api: TodoistApi) {
	api.addProject({ name: title })
    .then((project) => {
		api.addComment({
			projectId: project.id,
			content: `[o](${deepLink})`,
		}).catch((error) => console.log(error))
		const workspace = this.app.workspace;
			const view = workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const todoistLink = project.url;
				let fileText = editor.getValue()
				const lines: string[] = fileText.split('\n');
				const h1Index = lines.findIndex(line => line.startsWith('#'));
				if (h1Index !== -1) {
					let startRange: EditorPosition = {
						line: h1Index,
						ch:lines[h1Index].length
					}
					let endRange: EditorPosition = {
						line: h1Index,
						ch:lines[h1Index].length
					}
					editor.replaceRange(`\n\n[Todoist](${todoistLink})`, startRange, endRange);
				} else {
						let startRange: EditorPosition = {
						line: 0,
						ch:0
					}
					let endRange: EditorPosition = {
						line: 0,
						ch:0
					}
					editor.replaceRange(`[Todoist](${todoistLink})\n\n`, startRange, endRange);
				}
			}
	})
    .catch((error) => console.log(error))
}

function createTask(line: string, deepLink: string, api: TodoistApi) {
	api.addTask({
		content: `${line}`,
		description: `[o](${deepLink})`,
	}).then(
		(task) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const currentLine = getCurrentLine(editor, view)
				const firstLetterIndex = currentLine.search(/[a-zA-Z]|[0-9]/);
				const line = currentLine.substring(firstLetterIndex, currentLine.length)
				let editorPosition = view.editor.getCursor()
				const lineLength = view.editor.getLine(editorPosition.line).length
				let startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex
				}
				let endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength
				}
				view.editor.replaceRange(`[${line}](${task.url})`, startRange, endRange);
			}
			console.log(task)
		})
	.catch((error) => console.log(error))
}


export default class TodoistLinkPlugin extends Plugin {

	settings: TodoistLinkSettings;

	getTodistApi(): TodoistApi {
		const api = new TodoistApi(this.settings.apikey);
		return api
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.onload();
	}

	async onload() {

		await this.loadSettings();

		this.addCommand({
			id: 'create-todoist-project',
			name: 'Create Todoist Project',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = fileTitle.name
					fileName = fileName.replace(/\.md$/, '')
					const obsidianDeepLink = (this.app as any).getObsidianUrl(fileTitle)
					createProject(fileName, obsidianDeepLink, this.getTodistApi());
				}
			}
		});
	
		this.addCommand({
			id: 'create-todoist-task',
			name: 'Create Todoist Task',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const workspace = this.app.workspace;
				const fileTitle = workspace.getActiveFile()
				if (fileTitle == null) {
					return;
				} else {
					let fileName = urlEncode(fileTitle.name)
					fileName = fileName.replace(/\.md$/, '')
					const obsidianDeepLink = (this.app as any).getObsidianUrl(fileTitle)
					const line = getCurrentLine(editor, view)
					const task = prepareTask(line)
					createTask(task, obsidianDeepLink, this.getTodistApi());
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TodoistLinkSettingTab(this.app, this));

	}
	onunload() {

	}

	
}


class TodoistLinkSettingTab extends PluginSettingTab {
	plugin: TodoistLinkPlugin;

	constructor(app: App, plugin: TodoistLinkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Get your api key and enter it here. From https://todoist.com/app/settings/integrations')
			.addText(text => text
				.setPlaceholder('Enter your API Key')
				.setValue(this.plugin.settings.apikey)
				.onChange(async (value) => {
					this.plugin.settings.apikey= value;
					await this.plugin.saveSettings();
				}));
	}
}