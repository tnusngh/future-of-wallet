ig.module(
	'game.entities.confirm'
)
.requires(
	'impact.entity',
	'impact.entity-pool'
)
.defines(function(){
	
EntityConfirm=ig.Entity.extend({
	size: {x: 1, y: 1},
	maxVel: {x: 000, y: 000},
	name: null,
	type: ig.Entity.TYPE.NONE,
	checkAgainst: ig.Entity.TYPE.NONE,
	collides: ig.Entity.COLLIDES.NEVER,
	
	oName: false,
	cType: false,
	cName: false,

	_wmDrawBox: true,
	_wmBoxColor: 'rgba(245, 66, 212, 1)',
	
	//clickSound: new ig.Sound( 'media/sounds/new-game.*' ),
	
	init: function( x, y, settings ) {
		this.parent(x, y, settings);
	},
	reset: function( x, y, settings ) {
		this.parent( x, y, settings );
		ig.game.noPromptHover = false;
		ig.game.yesPromptHover = false;
    },
	
	update: function() {
		
		this.size.x = ig.game.promptRespBoxWidth ;
		this.size.y = ig.game.promptBoxHeight; 
		this.pos.x = ig.game.promptRespYesX + ig.game.screen.x;
		this.pos.y = ig.game.promptRespY + ig.game.screen.y;
		
		
		if (this.name == "no"){
			this.pos.x = ig.game.promptRespNoX + ig.game.screen.x;
		}

		if (!ig.game.promptBoxOpen && !ig.game.showChatPrompt && !ig.game.gettingPlayerInput || ig.game.computerOn){
			this.kill();
		}
		//Click me
		if (ig.input.released('click') && this.inFocus() && ig.game.clickDelayTimer.delta() > 0 ) {
			this.clicked();

		}
		this.handleHoverEffect();
		
		this.parent();
	},
	handleHoverEffect: function(){
		//Hover
		if (this.inFocus()){
			if(this.name == "no"){
				ig.game.noPromptHover = true;
			}
			else if (this.name == "yes"){
				ig.game.yesPromptHover = true;
			}
		}
		else if (this.name == "no"){
			ig.game.noPromptHover = false;
			
		}
		else if (this.name == "yes"){
			ig.game.yesPromptHover = false;
		}
	},
	killBothButtons: function(){
		var yes = ig.game.getEntityByName("yes");
		var no = ig.game.getEntityByName("no");	
		this.name == "yes" ? no.kill() : yes.kill();
		this.kill();
	},
	clicked: function(){
		ig.game.clickDelayTimer.set(.33);
		
		/**************
			NOOOOO
		**************/
			
		if(this.name == "no"){
			if (this.cName){
				if (ig.game.getEntityByName(this.cName)){
					var npc = ig.game.getEntityByName(this.cName);
					npc.talking = false;
					ig.game.qCancelled = true;
				}
			}
			ig.game.resetTxtVars();
			ig.game.stopPlayerInput();
			ig.game.playClickSound1();
		}
		/**************
			Yes
		**************/
		else if (this.name == "yes"){
			ig.game.playClickSound2();
			//
			//Found coin
			//
			if (this.cType == "inspectPromptCoin"){
				var coinFound = ig.game.checkFoundCoin(ig.game.objTxt[this.oName].coinNumber);
				if (coinFound){
					ig.game.inspObjTxt = "You already found a coin here.";
				}
				else{
					ig.game.inspObjTxt = "You found a coin!";
					ig.game.findCoin(ig.game.objTxt[this.oName].coinNumber)
				}
				ig.game.objBoxOpen = true;
				ig.game.promptBoxOpen = false;
			}
			//
			//Inspecting Regular Object with One Slide Return
			//
			else if (this.cType == "inspectPrompt"){
				ig.game.promptBoxOpen = false;
				ig.game.objBoxOpen = true;
				//Set Inspection Text
				ig.game.inspObjTxt = ig.game.objTxt[this.oName].yResp
				ig.game.playMsgOpenSound1();
				
			}
			//
			//Conditional response
			//
			//
			else if (this.cType == "conditionalResponse"){
				//Get Name of Function that will handle the conditional response
				var functionName = ig.game.objTxt[this.oName].cRespFunction;
				//Get Function Parameters
				var params = ig.game.objTxt[this.oName].cRespParams || [];
				//Look for Function and Apply parameters
				if (functionName && typeof ig.game[functionName] == 'function') {
					ig.game[functionName].apply(ig.game, params);
				}
				else{
					console.error("Function not found: " + functionName);
				}
				//ig.game.objTxt[this.oName].cRespFunction = `openDoor(1)`
				//ig.game.openDoor(1);
				ig.game.promptBoxOpen = false;
				ig.game.playMsgOpenSound2();
			}
			else if (this.cType == "inspectPromptLongResp"){
				ig.game.dBoxUp = true;  
				//Set Long Object Text Control Variable (so buttons in object entity will advance dialogue)
				ig.game.longObjTxt = true;
				
				//Set Font to Italic
				if (ig.game.objTxt[this.oName].style &&  ig.game.objTxt[this.oName].style == "I"){
					ig.game.dTool.isItalic = true;
					ig.game.dTool.color2 = true;
				}
				//Set Inspection Text
				ig.game.npcTxt = ig.game.objTxt[this.oName].yResp;
				ig.game.playMsgOpenSound1();
			}
			else if (this.cType == "logOnComputer"){
				ig.game.playComputerSound1();
				//Turn on Desktop Simulation
				ig.game.computerOn = true;
				if (ig.game.computerDisplay == 1){
					ig.game.promptBoxOpen = false;
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "logOut"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "metaMask"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "phantom"});					
				}
				else if (ig.game.computerDisplay == 2){
					ig.game.promptBoxOpen = false;
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "logOut"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "ethereum"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "arbitrum"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "optimism"});
					ig.game.computerDispProgressLine = "Click an icon to switch networks.";
				}
				else if (ig.game.computerDisplay == 3){
					ig.game.promptBoxOpen = false;
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "logOut"});				
				}
				else if (ig.game.computerDisplay == 4){
					ig.game.promptBoxOpen = false;
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "copyAddress"});
					ig.game.spawnEntity( EntityComputerbutton, 0, 0, { name: "logOut"});
					ig.game.computerDispProgressLine = "Your Wallet Address: " + window['userAccountNumber'];			
				}
			}
			else if (this.cType == "npcConditional"){
				//Get Name of Function that will handle the conditional response
				var functionName = ig.game.chatTxt[this.cName].cRespFunction;
				//Get Function Parameters
				var params = ig.game.chatTxt[this.cName].cRespParams || [];
				//Look for Function and Apply parameters
				if (functionName && typeof ig.game[functionName] == 'function') {
					ig.game[functionName].apply(ig.game, params);
				}
				else{
					console.error("Function not found: " + functionName);
				}
				
			}
			//
			//Yes, I want to chat with this NPC
			//
			else if ( this.cType == "chatResp"){
				ig.game.qCancelled = false;
				ig.game.playMsgOpenSound2();
				if (!ig.game.gettingPlayerInput){
					ig.game.pInput = "";
					ig.game.playerLastInput = "";
					ig.game.gettingPlayerInput = true;
					ig.game.getPlayerInput();
				}
				else{
					ig.game.resetTxtVars();
					ig.game.stopPlayerInput();
				}
			}
		}
	},
	kill: function(){
		ig.game.noPromptHover = false;
		ig.game.yesPromptHover = false;
		this.parent();
	},
	inFocus: function() {
    return (
       (this.pos.x <= (ig.input.mouse.x + ig.game.screen.x)) &&
       ((ig.input.mouse.x + ig.game.screen.x) <= this.pos.x + this.size.x) &&
       (this.pos.y <= (ig.input.mouse.y + ig.game.screen.y)) &&
       ((ig.input.mouse.y + ig.game.screen.y) <= this.pos.y + this.size.y)
    );
 	}
		
});
ig.EntityPool.enableFor( EntityConfirm );
});