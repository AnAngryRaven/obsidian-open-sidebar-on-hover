import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface OpenSidebarHoverSettings {
	leftSidebar: boolean;
	rightSidebar: boolean;
	enforceSameDelay: boolean;
	sidebarDelayBoth: int;
	sidebarDelayRight: int;
	sidebarDelayLeft: int;
	speedDetection: boolean;
}

const DEFAULT_SETTINGS: OpenSidebarHoverSettings = {
	leftSidebar: true,
	rightSidebar: false,
	enforceSameDelay: true,
	sidebarDelayBoth: '300',
	sidebarDelayLeft: '300',
	sidebarDelayRight: '300',
	speedDetection: false
}

export default class OpenSidebarHover extends Plugin {
	settings: OpenSidebarHoverSettings;

	async onload() {
		await this.loadSettings();		
		
		/*
		Believe me, I'm aware of how terrible this looks. But the way it works means I'm kind of inducing a race
		condition. So, it sort of has to be in one big thing in order to access the appropriate variable. I'm sure
		with enough time I could make it look good, but right now I'm more concerned with getting it to work :p
		*/
		this.app.workspace.onLayoutReady(() => {
			//Split constants -- Just streamlines calling them
			const leftSplit = this.app.workspace.leftSplit;
			const rightSplit = this.app.workspace.rightSplit;
			
			//Ribbon constants -- Just streamlines calling them a bit
			const leftRibbon = this.app.workspace.leftRibbon;
			const rightRibbon = this.app.workspace.rightRibbon;
			
			//Settings constant -- Same as above
			const settingsConst = this.settings;
			
			//Variables
			let isHovering = false; //Variable to check if the cursor is hovering. Needed due to Obsidian's behaviour on the top bar.
			
			let delayTime;
			
			//Check to see if the cursor has left the leftSplit area...
			this.registerDomEvent(leftSplit.containerEl, "mouseleave", () => {
				if(settingsConst.leftSidebar){ //Check to see if the user has the 'Left Sidebar Hover' setting enabled.
					isHovering = false;
					
					if(settingsConst.enforceSameDelay){
						delayTime = settingsConst.sidebarDelayBoth;
					}else {
						delayTime = settingsConst.sidebarDelayLeft;
					}
					
					setTimeout(() => {
						if(!isHovering)
							leftSplit.collapse(); //...if it has after the appropriate delay length, close the leftSplit...
					}, delayTime);

					this.registerDomEvent(leftSplit.containerEl, "mouseenter", () => {
						isHovering = true; //...but if the mouse reenters before the delay length, set 'isHovering' to true, preventing the above from happening.
					});
				}
			});
			
			//Check to see if the cursor has left the leftSplit area...
			this.registerDomEvent(rightSplit.containerEl, "mouseleave", () => {
				//Check to see if the user has the 'Right Sidebar Hover' setting enabled.
				if(settingsConst.rightSidebar){
					isHovering = false;
					
					if(settingsConst.enforceSameDelay){
						let delayTime = settingsConst.sidebarDelayBoth;
					}else {
						let delayTime = settingsConst.sidebarDelayLeft;
					}
					
					setTimeout(() => {
						if(!isHovering)
							rightSplit.collapse(); //...if it has after the appropriate delay length, close the rightSplit...
					}, delayTime);

					this.registerDomEvent(rightSplit.containerEl, "mouseenter", () => {
						isHovering = true; //...but if the mouse reenters before the delay length, set 'isHovering' to true, preventing the above from happening.
					});
				}
			});
			
			this.registerDomEvent(document, "mouseleave", () => { isHovering = true; }) //Any time the cursor leaves the application (which includes the top bar), set 'isHovering' to true.
			
			this.registerDomEvent(leftRibbon.containerEl, "mouseenter", () => {
				if(settingsConst.leftSidebar){
					this.app.workspace.leftSplit.expand(); 
					isHovering = true;
				}
			});
			this.registerDomEvent(rightRibbon.containerEl, "mouseenter", () => {
				if(settingsConst.rightSidebar){
					this.app.workspace.rightSplit.expand();
					isHovering = true;
				}
			});
			this.registerDomEvent(document, "mouseenter", () => {
				isHovering = false;
				
				let delayTimeLeft;
				let delayTimeRight;
				
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
						if(settingsConst.leftSidebar){
							leftSplit.collapse();
						}
						if(settingsConst.rightSidebar){
							rightSplit.collapse();
						}
					}
				}, delayTimeLeft);
			})
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SidebarHoverSettingsTab(this.app, this));
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

class SidebarHoverSettingsTab extends PluginSettingTab {
	plugin: OpenSidebarHover;

	constructor(app: App, plugin: OpenSidebarHover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		
		/*
			+==================+
			| GENERAL SETTINGS |
			+==================+
		*/
		
		new Setting(containerEl).setName('Left Sidebar Hover')
			.setDesc("Enables the expansion and collapsing of the left sidebar on hover.")
			.addToggle(t => t
				.setValue(this.plugin.settings.leftSidebar)
				.onChange(async (value) => {
					this.plugin.settings.leftSidebar = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl).setName('Right Sidebar Hover')
			.setDesc("Enables the expansion and collapsing of the right sidebar on hover. Only collapses the right panel unless you have a right ribbon.")
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
		
		new Setting(containerEl).setName("Collapse Delay").setHeading();
		
		//'Same Collapse Delay' setting
		new Setting(containerEl).setName('Same Collapse Delay')
			.setDesc("Makes the delay for the left and right sidebars the same.")
			.addToggle(t => t
				.setValue(this.plugin.settings.enforceSameDelay)
				.onChange(async (value) => {
					//Set plugin setting according to toggle value
					this.plugin.settings.enforceSameDelay = value;
					
					//Set the delay settings for the right, left, and both sidebars accordingly
					rightSidebarDelaySetting.setDisabled(value);
					leftSidebarDelaySetting.setDisabled(value);
					bothSidebarDelaySetting.setDisabled(!value);
					
					//Save the plugin setting
					await this.plugin.saveSettings();
				}));
				
		//'Sidebar Collapse Delay (Both)' setting
		const bothSidebarDelaySetting = new Setting(containerEl)
		.setName('Sidebar Collapse Delay (Both)')
		.setDesc('The delay in milliseconds before the right sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayBoth)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayBoth = value;
				await this.plugin.saveSettings();
			}))
		.setClass("expand-sidebar-hover-disabled");
		
		//'Left Sidebar Collapse Delay' setting
		const leftSidebarDelaySetting = new Setting(containerEl)
		.setName('Left Sidebar Collapse Delay')
		.setDesc('The delay in milliseconds before the left sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayLeft)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayLeft = value;
				await this.plugin.saveSettings();
			}))
		.setClass("expand-sidebar-hover-disabled");
		
		//'Right Sidebar Collapse Delay' setting
		const rightSidebarDelaySetting = new Setting(containerEl)
		.setName('Right Sidebar Collapse Delay')
		.setDesc('The delay in milliseconds before the right sidebar collapses after the mouse has left. Enter \'0\' to disable delay.')
		.addText(text => text
			.setPlaceholder('0')
			.setValue(this.plugin.settings.sidebarDelayRight)
			.onChange(async (value) => {
				this.plugin.settings.sidebarDelayRight = value;
				await this.plugin.saveSettings();
			}))
		.setClass("expand-sidebar-hover-disabled");
		
		//Note: This conditional seems to only be checked once, when the plugin is enabled. Hence why it's written as such.
		//Check to see if 'Same Collapse Delay' is set to true...
		if(this.plugin.settings.enforceSameDelay){
			rightSidebarDelaySetting.setDisabled(true);
			leftSidebarDelaySetting.setDisabled(true); //...if so, disable the left and right 'Sidebar Collapse Delay' settings...
		}else {
			bothSidebarDelaySetting.setDisabled(true); //...otherwise, only disable the 'Sidebar Collapse Delay (Both)' setting!
		}
		
		/*
			+=======================+
			| EXPERIMENTAL SETTINGS |
			+=======================+
		*/
		
		new Setting(containerEl).setName("Experimental Features").setHeading().setDesc("Settings to enable experimental features. Note that such settings may not always be present.");
		
		containerEl.createEl("i", { text: "Sorry, nothin' to report right now boss!" });
		
		/**
		//May or may not ever get implemented.
		new Setting(containerEl).setName('High Speed Detection (BETA)')
			.setDesc("If enabled, prevents the sidebar from expanding if the cursor is moving too quickly.")
			.addToggle(t => t
				.setValue(this.plugin.settings.speedDetection)
				.onChange(async (value) => {
					this.plugin.settings.speedDetection = value;
					await this.plugin.saveSettings();
				}));
		**/
	}
}
