import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	leftSidebar: boolean;
	rightSidebar: boolean;
	enforceSameDelay: boolean;
	sidebarDelayBoth: int;
	sidebarDelayRight: int;
	sidebarDelayLeft: int;
	speedDetection: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	leftSidebar: true,
	rightSidebar: true,
	enforceSameDelay: true,
	sidebarDelayBoth: '300',
	sidebarDelayLeft: '300',
	sidebarDelayRight: '300',
	speedDetection: false
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'toggle-sidebar-state',
			name: 'Toggle sidebar state',
			callback: () => {
				//new SampleModal(this.app).open();
				if(this.app.workspace.leftSplit.collapsed){
					this.app.workspace.leftSplit.expand();
				}else {
					this.app.workspace.leftSplit.collapse();
				}
				
			}
		});
		
		
		
		this.app.workspace.onLayoutReady(() => {
			console.log(this.settings.enforceSameDelay);
			//Split constants -- Just streamlines calling them
			const leftSplit = this.app.workspace.leftSplit;
			const rightSplit = this.app.workspace.rightSplit;
			
			//Ribbon constants -- Just streamlines calling them a bit
			const leftRibbon = this.app.workspace.leftRibbon;
			const rightRibbon = this.app.workspace.rightRibbon;
			
			//Settings constant -- Same as above
			const settingsConst = this.settings;
			
			//Variables
			var isHovering = false; //Variable to check if the cursor is hovering. Needed due to Obsidian's behaviour on the top bar.
			
			//Check to see if the cursor has left the leftSplit area...
			this.registerDomEvent(leftSplit.containerEl, "mouseleave", () => {
				isHovering = false;
				var delayTime;
				
				if(settingsConst.enforceSameDelay){
					delayTime = settingsConst.sidebarDelayBoth;
				}else {
					delayTime = settingsConst.sidebarDelayLeft;
				}
				
				setTimeout(() => {
					if(!isHovering)
						leftSplit.collapse(); //...if it has after sideBarDelay
				}, delayTime);

				this.registerDomEvent(leftSplit.containerEl, "mouseenter", () => {
					isHovering = true;
				});
			});
			
			//TODO: Implement the right split fully
			/*
			this.registerDomEvent(rightSplit.containerEl, "mouseleave", () => {
				isHovering = false;
				var delayTime;
				
				if(settingsConst.enforceSameDelay){
					delayTime = settingsConst.sidebarDelayBoth;
				}else {
					delayTime = settingsConst.sidebarDelayLeft;
				}
				
				setTimeout(() => {
					if(!isHovering)
						rightSplit.collapse(); //...if it has after sideBarDelay
				}, delayTime);

				this.registerDomEvent(rightSplit.containerEl, "mouseenter", () => {
					isHovering = true;
				});
			});*/
			
			this.registerDomEvent(document, "mouseleave", () => {
				isHovering = true;
			})
			this.registerDomEvent(leftRibbon.containerEl, "mouseenter", () => { this.app.workspace.leftSplit.expand(); isHovering = true; } )
			//this.registerDomEvent(this.app.workspace.leftRibbon.containerEl, "mouseleave", () => {console.log("leftRibbon -- EXIT");} )
			this.registerDomEvent(document, "mouseenter", () => {
				isHovering = false;
				
				var delayTimeLeft;
				var delayTimeRight;
				
				//If 'Same delay' setting is enabled...
				if(settingsConst.enforceSameDelay){
					delayTimeLeft = settingsConst.sidebarDelayBoth;
					delayTimeRight = settingsConst.sidebarDelayBoth; //...set both the right and left sidebar's delay values to the delay value set for both by the user...
				}else {
					delayTimeLeft = settingsConst.sidebarDelayLeft;
					delayTimeRight = settingsConst.sidebarDelayRight; //...otherwise, set them according to their respective delay values!
				}
				
				setTimeout(() => {
					if(!isHovering){
						leftSplit.collapse();
						//rightSplit.collapse();
					}
				}, delayTimeLeft);
			})
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign(DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		
		new Setting(containerEl).setName('Left Sidebar Hover')
			.setDesc("Enables the expansion and collapsing of the left sidebar on hover.")
			.addToggle(t => t
				.setValue(this.plugin.settings.leftSidebar)
				.onChange(async (value) => {
					this.plugin.settings.leftSidebar = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl).setName('Right Sidebar Hover')
			.setDesc("Enables the expansion and collapsing of the right sidebar on hover.")
			.addToggle(t => t
				.setValue(this.plugin.settings.rightSidebar)
				.onChange(async (value) => {
					this.plugin.settings.rightSidebar = value;
					await this.plugin.saveSettings();
				}));
		
		/*
			+=========================+
			| COLLAPSE DELAY SETTINGS |
			+=========================+
		*/
		
		//'Same Collapse Delay' setting
		new Setting(containerEl).setName('Same Collapse Delay')
			.setDesc("Makes the delay for the left and right sidebars the same.")
			.addToggle(t => t
				.setValue(this.plugin.settings.enforceSameDelay)
				.onChange(async (value) => {
					this.plugin.settings.enforceSameDelay = value;
					rightSidebarDelaySetting.setDisabled(value);
					leftSidebarDelaySetting.setDisabled(value);
					bothSidebarDelaySetting.setDisabled(!value);
					console.log(value);
					console.log(this.plugin.settings.enforceSameDelay);
					await this.plugin.saveSettings();
				}));
				
		const bothSidebarDelaySetting = new Setting(containerEl)
		.setName('Sidebar Collapse Delay (Both)')
		.setDesc('The delay in milliseconds before the right sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayBoth)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayBoth = value;
				await this.plugin.saveSettings();
			}));
		
		const leftSidebarDelaySetting = new Setting(containerEl)
		.setName('Left Sidebar Collapse Delay')
		.setDesc('The delay in milliseconds before the left sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayLeft)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayLeft = value;
				await this.plugin.saveSettings();
			}));
		
		const rightSidebarDelaySetting = new Setting(containerEl)
		.setName('Right Sidebar Collapse Delay')
		.setDesc('The delay in milliseconds before the right sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayRight)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayRight = value;
				await this.plugin.saveSettings();
			}));
		
		if(this.plugin.settings.enforceSameDelay){
			rightSidebarDelaySetting.setDisabled(true);
			leftSidebarDelaySetting.setDisabled(true);
		}else {
			bothSidebarDelaySetting.setDisabled(true);
		}
		
		
		new Setting(containerEl).setName('High Speed Detection (BETA)')
			.setDesc("If enabled, prevents the sidebar from expanding if the cursor is moving too quickly.")
			.addToggle(t => t
				.setValue(this.plugin.settings.speedDetection)
				.onChange(async (value) => {
					this.plugin.settings.speedDetection = value;
					await this.plugin.saveSettings();
				}));
	}
}
