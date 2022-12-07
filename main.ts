import { Editor, App, EditorPosition, MarkdownView, Plugin, HeadingCache, PluginSettingTab, Setting, TFile } from 'obsidian';
import { TodoistApi } from '@doist/todoist-api-typescript'
import { findWikiLink, line } from './utility';

interface TodoistLinkSettings {
	transformToLink: boolean;
	apikey: string;
}

const DEFAULT_SETTINGS: TodoistLinkSettings = {
	apikey: '', 
	transformToLink: false,
}

function getCurrentLine(editor: Editor, view: MarkdownView) {
	const lineNumber = editor.getCursor().line
	const lineText = editor.getLine(lineNumber)
	return {
		lineText, lineNumber
	}
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


function prepareTask(line: string, app: any, activeFile: TFile): line {
	
	line = line.trim()
	//remove all leading non-alphanumeric characters
	let lineExternalLinkFormat = line
	lineExternalLinkFormat = lineExternalLinkFormat.replace(/^[^\\[a-zA-Z0-9]+|[^\\[a-zA-Z0-9]+$/, '')
	// replace wiki links with obisidian links
	const wikilinks = findWikiLink(lineExternalLinkFormat)
	wikilinks.forEach(wikilink => {
		const link = this.app.metadataCache.getFirstLinkpathDest(wikilink.text, activeFile.path)
		if (link) {
			const urlForWikiLink = app.getObsidianUrl(link)
			lineExternalLinkFormat = lineExternalLinkFormat.replace(wikilink.link, `[${wikilink.text}](${urlForWikiLink})`)
		}
	})
	const lineInternalLinkFormat = line.replace(/^[^\\[a-zA-Z0-9]+|[^\\[a-zA-Z0-9]+$/, '')
	//lineInternalLinkFormat = lineInternalLinkFormat.replace(/\[\[([^\]]+)\]\]/g, '[$1]($1)')
	
	return {
		externalLinkFormat: lineExternalLinkFormat,
		internalLinkFormat: lineInternalLinkFormat,
		wikilinks
	}
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
				const fileText = editor.getValue()
				const lines: string[] = fileText.split('\n');
				const h1Index = lines.findIndex(line => line.startsWith('#'));
				if (h1Index !== -1) {
					const startRange: EditorPosition = {
						line: h1Index,
						ch:lines[h1Index].length
					}
					const endRange: EditorPosition = {
						line: h1Index,
						ch:lines[h1Index].length
					}
					editor.replaceRange(`\n\n[Todoist](${todoistLink})`, startRange, endRange);
				} else {
						const startRange: EditorPosition = {
						line: 0,
						ch:0
					}
					const endRange: EditorPosition = {
						line: 0,
						ch:0
					}
					editor.replaceRange(`[Todoist](${todoistLink})\n\n`, startRange, endRange);
				}
			}
	})
    .catch((error) => console.log(error))
}

export function createTask(processedLine: line, deepLink: string, api: TodoistApi, transformToLink: boolean) {
	//console.log(processedLine)
	api.addTask({
		content: `${processedLine.externalLinkFormat}`,
		description: `[o](${deepLink})`,
	}).then(
		(task) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view == null) {
				return;
			} else {
				const editor = view.editor
				const currentLine = getCurrentLine(editor, view)
				const firstLetterIndex = currentLine.lineText.search(/[a-zA-Z\\[]|[0-9]/);
				const editorPosition = view.editor.getCursor()
				const lineLength = view.editor.getLine(editorPosition.line).length
				const startRange: EditorPosition = {
					line: editorPosition.line,
					ch: firstLetterIndex
				}
				const endRange: EditorPosition = {
					line: editorPosition.line,
					ch: lineLength
				}
				if (transformToLink) {
					view.editor.replaceRange(`[${processedLine.internalLinkFormat}](${task.url})`, startRange, endRange);
				} else {
					view.editor.replaceRange(` ([Todoist](${task.url}))`, endRange, endRange);
				}
				
			}
		})
	.catch((error) => console.log(error))
}

export function containsWikiLink(line: string): boolean {
	return line.includes('[[')
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
		//this.onload();
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
				const activeFile = workspace.getActiveFile()
				if (activeFile == null) {
					return;
				} else {
					const obsidianDeepLink = (this.app as any).getObsidianUrl(activeFile)
					const line = getCurrentLine(editor, view)
					const task = prepareTask(line.lineText, this.app, activeFile)
					createTask(task, obsidianDeepLink, this.getTodistApi(), this.settings.transformToLink);
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
		
		this.containerEl.createEl('h2', { text: 'Authentication' })


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

		this.containerEl.createEl('h2', { text: 'General' })

		new Setting(containerEl)
			.setName('Style: Transform Link to Link')
			.setDesc('If you enable this setting then then plugin transforms the complete line to a link to Todoist.')
			.addToggle( (toggle) => {
				toggle
				.setValue(this.plugin.settings.transformToLink)
				.onChange(async (value) => {
					this.plugin.settings.transformToLink = value;
					await this.plugin.saveSettings();
				})
			});
	}
}