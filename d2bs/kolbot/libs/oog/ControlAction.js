/**
*  @filename    ControlAction.js
*  @author      theBGuy
*  @desc        Control based actions
*
*/

const ControlAction = {
	mutedKey: false,
	realms: { "uswest": 0, "useast": 1, "asia": 2, "europe": 3 },

	timeoutDelay: function (text, time, stopfunc, arg) {
		let currTime = 0;
		let endTime = getTickCount() + time;

		while (getTickCount() < endTime) {
			if (typeof stopfunc === "function" && stopfunc(arg)) {
				break;
			}

			if (currTime !== Math.floor((endTime - getTickCount()) / 1000)) {
				currTime = Math.floor((endTime - getTickCount()) / 1000);

				D2Bot.updateStatus(text + " (" + Math.max(currTime, 0) + "s)");
			}

			delay(10);
		}
	},

	click: function (type, x, y, xsize, ysize, targetx, targety) {
		let control = getControl(type, x, y, xsize, ysize);

		if (!control) {
			print("control not found " + type + " " + x + " " + y + " " + xsize + " " + ysize + " location " + getLocation());

			return false;
		}

		control.click(targetx, targety);

		return true;
	},

	setText: function (type, x, y, xsize, ysize, text) {
		if (!text) return false;

		let control = getControl(type, x, y, xsize, ysize);
		if (!control) return false;

		let currText = control.text;
		if (currText && currText === text) return true;

		currText = control.getText();

		if (currText && ((typeof currText === "string" && currText === text) || (typeof currText === "object" && currText.includes(text)))) {
			return true;
		}

		control.setText(text);

		return true;
	},

	getText: function (type, x, y, xsize, ysize) {
		let control = getControl(type, x, y, xsize, ysize);

		return (!!control ? control.getText() : false);
	},

	joinChannel: function (channel) {
		me.blockMouse = true;

		let tick;
		let rval = false;
		let timeout = 5000;

		MainLoop:
		while (true) {
			switch (getLocation()) {
			case sdk.game.locations.Lobby:
				Controls.LobbyEnterChat.click();

				break;
			case sdk.game.locations.LobbyChat:
				let currChan = Controls.LobbyChannelName.getText(); // returns array

				if (currChan) {
					for (let i = 0; i < currChan.length; i += 1) {
						if (currChan[i].split(" (") && currChan[i].split(" (")[0].toLowerCase() === channel.toLowerCase()) {
							rval = true;

							break MainLoop;
						}
					}
				}

				!tick && Controls.LobbyChannel.click() && (tick = getTickCount());

				break;
			case sdk.game.locations.ChannelList: // Channel
				Controls.LobbyChannelText.setText(channel);
				Controls.LobbyChannelOk.click();

				break;
			}

			if (getTickCount() - tick >= timeout) {
				break;
			}

			delay(100);
		}

		me.blockMouse = false;

		return rval;
	},

	createGame: function (name, pass, diff, delay) {
		Controls.CreateGameName.setText(name);
		Controls.CreateGamePass.setText(pass);

		switch (diff) {
		case "Normal":
			Controls.Normal.click();

			break;
		case "Nightmare":
			Controls.Nightmare.click();

			break;
		case "Highest":
			if (Controls.Hell.disabled !== 4 && Controls.Hell.click()) {
				break;
			}

			if (Controls.Nightmare.disabled !== 4 && Controls.Nightmare.click()) {
				break;
			}

			Controls.Normal.click();

			break;
		default:
			Controls.Hell.click();

			break;
		}

		!!delay && this.timeoutDelay("Make Game Delay", delay);

		if (Starter.chanInfo.announce) {
			Starter.sayMsg("Next game is " + name + (pass === "" ? "" : "//" + pass));
		}

		me.blockMouse = true;

		print("Creating Game: " + name);
		Controls.CreateGame.click();

		me.blockMouse = false;
	},

	clickRealm: function (realm) {
		if (realm === undefined || typeof realm !== "number" || realm < 0 || realm > 3) {
			throw new Error("clickRealm: Invalid realm!");
		}

		let retry = 0;

		me.blockMouse = true;

		MainLoop:
		while (true) {
			switch (getLocation()) {
			case sdk.game.locations.MainMenu:
				let control = Controls.Gateway.control;
				if (!control) {
					if (retry > 3) return false;
					retry++;

					break;
				}

				let gateText = getLocaleString(sdk.locale.text.Gateway);
				let currentRealm = (() => {
					switch (control.text.split(gateText.substring(0, gateText.length - 2))[1]) {
					case "U.S. WEST":
						return 0;
					case "ASIA":
						return 2;
					case "EUROPE":
						return 3;
					case "U.S. EAST":
					default:
						return 1;
					}
				})();

				if (currentRealm === realm) {
					break MainLoop;
				}

				Controls.Gateway.click();

				break;
			case sdk.game.locations.GatewaySelect:
				this.click(4, 257, 500, 292, 160, 403, 350 + realm * 25);
				Controls.GatewayOk.click();

				break;
			}

			delay(500);
		}

		me.blockMouse = false;

		return true;
	},

	loginAccount: function (info) {
		me.blockMouse = true;

		let locTick;
		let tick = getTickCount();

		MainLoop:
		while (true) {
			switch (getLocation()) {
			case sdk.game.locations.PreSplash:
				break;
			case sdk.game.locations.MainMenu:
				info.realm && ControlAction.clickRealm(this.realms[info.realm]);
				Controls.BattleNet.click();

				break;
			case sdk.game.locations.Login:
				Controls.LoginUsername.setText(info.account);
				Controls.LoginPassword.setText(info.password);
				Controls.Login.click();

				break;
			case sdk.game.locations.LoginUnableToConnect:
			case sdk.game.locations.RealmDown:
				// Unable to connect, let the caller handle it.
				me.blockMouse = false;

				return false;
			case sdk.game.locations.CharSelect:
				break MainLoop;
			case sdk.game.locations.SplashScreen:
				Controls.SplashScreen.click();

				break;
			case sdk.game.locations.CharSelectPleaseWait:
			case sdk.game.locations.MainMenuConnecting:
			case sdk.game.locations.CharSelectConnecting:
				break;
			case sdk.game.locations.CharSelectNoChars:
				// make sure we're not on connecting screen
				locTick = getTickCount();

				while (getTickCount() - locTick < 3000 && getLocation() === sdk.game.locations.CharSelectNoChars) {
					delay(25);
				}

				if (getLocation() === sdk.game.locations.CharSelectConnecting) {
					break;
				}

				break MainLoop; // break if we're sure we're on empty char screen
			default:
				console.log(getLocation());
				me.blockMouse = false;

				return false;
			}

			if (getTickCount() - tick >= 20000) return false;
			delay(100);
		}

		delay(1000);

		me.blockMouse = false;

		return getLocation() === sdk.game.locations.CharSelect || getLocation() === sdk.game.locations.CharSelectNoChars;
	},

	setEmail: function (email = "", domain = "@email.com") {
		if (getLocation() !== sdk.game.locations.RegisterEmail) return false;
		(!email || !email.length) && (email = Starter.randomString(null, true));
		
		while (getLocation() !== sdk.game.locations.CharSelect) {
			switch (getLocation()) {
			case sdk.game.locations.RegisterEmail:
				if (Controls.EmailSetEmail.setText(email + domain) && Controls.EmailVerifyEmail.setText(email + domain)) {
					Controls.EmailRegister.click();
					delay(100);
				}

				break;
			case sdk.game.locations.LoginError:
				// todo test what conditions get here other than email not matching
				D2Bot.printToConsole("Failed to set email");
				Controls.LoginErrorOk.click();
				
				return false;
			case sdk.game.locations.CharSelectNoChars:
				// fresh acc
				return true;
			}
		}

		return true;
	},

	makeAccount: function (info) {
		me.blockMouse = true;

		let openBnet = Profile().type === sdk.game.profiletype.OpenBattlenet;
		// cycle until in empty char screen
		MainLoop:
		while (getLocation() !== sdk.game.locations.CharSelectNoChars) {
			switch (getLocation()) {
			case sdk.game.locations.MainMenu:
				ControlAction.clickRealm(this.realms[info.realm]);
				if (openBnet) {
					Controls.OtherMultiplayer.click() && Controls.OpenBattleNet.click();
				} else {
					Controls.BattleNet.click();
				}

				break;
			case sdk.game.locations.Login:
				Controls.CreateNewAccount.click();

				break;
			case sdk.game.locations.SplashScreen:
				Controls.SplashScreen.click();

				break;
			case sdk.game.locations.CharacterCreate:
				Controls.CharSelectExit.click();

				break;
			case sdk.game.locations.TermsOfUse:
				Controls.TermsOfUseAgree.click();

				break;
			case sdk.game.locations.CreateNewAccount:
				Controls.CreateNewAccountName.setText(info.account);
				Controls.CreateNewAccountPassword.setText(info.password);
				Controls.CreateNewAccountConfirmPassword.setText(info.password);
				Controls.CreateNewAccountOk.click();

				break;
			case sdk.game.locations.PleaseRead:
				Controls.PleaseReadOk.click();

				break;
			case sdk.game.locations.RegisterEmail:
				Controls.EmailDontRegisterContinue.control ? Controls.EmailDontRegisterContinue.click() : Controls.EmailDontRegister.click();

				break;
			case sdk.game.locations.CharSelect:
				if (openBnet) {
					break MainLoop;
				}

				break;
			default:
				break;
			}

			delay(100);
		}

		me.blockMouse = false;

		return true;
	},

	scrollDown: function () {
		me.blockMouse = true;
		for (let i = 0; i < 4; i++) {
			sendKey(sdk.keys.code.DownArrow);
		}
		me.blockMouse = false;
	},

	findCharacter: function (info) {
		let count = 0;
		let tick = getTickCount();

		while (getLocation() !== sdk.game.locations.CharSelect) {
			if (getTickCount() - tick >= 5000) {
				break;
			}

			delay(25);
		}

		// start from beginning of the char list
		sendKey(sdk.keys.code.Home);

		// @todo - refactor these repeated while loops, they are all only slightly different

		while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
			let control = Controls.CharSelectCharInfo0.control;

			if (control) {
				do {
					let text = control.getText();

					if (text instanceof Array && typeof text[1] === "string") {
						if (text[1].toLowerCase() === info.charName.toLowerCase()) return true;
						count++;
					}
				} while (count < 24 && control.getNext());
			}

			// check for additional characters up to 24
			if (count === 8 || count === 16) {
				Controls.CharSelectChar6.click() && this.scrollDown();
			} else {
				// no further check necessary
				break;
			}
		}

		return false;
	},

	// get all characters
	getCharacters: function () {
		let count = 0;
		let list = [];

		// start from beginning of the char list
		sendKey(sdk.keys.code.Home);

		while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
			let control = Controls.CharSelectCharInfo0.control;

			if (control) {
				do {
					let text = control.getText();

					if (text instanceof Array && typeof text[1] === "string") {
						count++;

						if (list.indexOf(text[1]) === -1) {
							list.push(text[1]);
						}
					}
				} while (count < 24 && control.getNext());
			}

			// check for additional characters up to 24
			if (count === 8 || count === 16) {
				Controls.CharSelectChar6.click() && this.scrollDown();
			} else {
				// no further check necessary
				break;
			}
		}

		// back to beginning of the char list
		sendKey(0x24);

		return list;
	},

	getPermStatus: function (info) {
		let count = 0;
		let tick = getTickCount();
		let expireStr = getLocaleString(sdk.locale.text.ExpiresIn);
		expireStr = expireStr.slice(0, expireStr.indexOf("%")).trim();

		while (getLocation() !== sdk.game.locations.CharSelect) {
			if (getTickCount() - tick >= 5000) {
				break;
			}

			delay(25);
		}

		// start from beginning of the char list
		sendKey(sdk.keys.code.Home);

		while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
			let control = Controls.CharSelectCharInfo0.control;

			if (control) {
				do {
					let text = control.getText();

					if (text instanceof Array && typeof text[1] === "string") {
						count++;

						if (text[1].toLowerCase() === info.charName.toLowerCase()) {
							return !text.some(el => el.includes(expireStr));
						}
					}
				} while (count < 24 && control.getNext());
			}

			// check for additional characters up to 24
			if (count === 8 || count === 16) {
				Controls.CharSelectChar6.click() && this.scrollDown();
			} else {
				// no further check necessary
				break;
			}
		}

		return false;
	},

	// get character position
	getPosition: function () {
		let position = 0;

		if (getLocation() === sdk.game.locations.CharSelect) {
			let control = Controls.CharSelectCharInfo0.control;

			if (control) {
				do {
					let text = control.getText();

					if (text instanceof Array && typeof text[1] === "string") {
						position += 1;
					}
				} while (control.getNext());
			}
		}

		return position;
	},

	loginCharacter: function (info, startFromTop = true) {
		me.blockMouse = true;

		let count = 0;

		// start from beginning of the char list
		startFromTop && sendKey(sdk.keys.code.Home);

		MainLoop:
		// cycle until in lobby or in game
		while (getLocation() !== sdk.game.locations.Lobby) {
			switch (getLocation()) {
			case sdk.game.locations.CharSelect:
				let control = Controls.CharSelectCharInfo0.control;

				if (control) {
					do {
						let text = control.getText();

						if (text instanceof Array && typeof text[1] === "string") {
							count++;

							if (text[1].toLowerCase() === info.charName.toLowerCase()) {
								control.click();
								Controls.CreateNewAccountOk.click();
								me.blockMouse = false;

								if (getLocation() === sdk.game.locations.SelectDifficultySP) {
									try {
										login(info.profile);
									} catch (err) {
										break MainLoop;
									}
								}

								return true;
							}
						}
					} while (control.getNext());
				}

				// check for additional characters up to 24
				if (count === 8 || count === 16) {
					Controls.CharSelectChar6.click() && this.scrollDown();
				} else {
					// no further check necessary
					break MainLoop;
				}

				break;
			case sdk.game.locations.CharSelectNoChars:
				Controls.CharSelectExit.click();

				break;
			case sdk.game.locations.Disconnected:
			case sdk.game.locations.OkCenteredErrorPopUp:
				break MainLoop;
			default:
				break;
			}

			delay(100);
		}

		me.blockMouse = false;

		return false;
	},

	makeCharacter: function (info) {
		me.blockMouse = true;
		!info.charClass && (info.charClass = "barbarian");
		
		if (info.charName.match(/\d+/g)) {
			console.warn("Invalid character name, cannot contain numbers");

			return false;
		}

		let clickCoords = [];

		// cycle until in lobby
		while (getLocation() !== sdk.game.locations.Lobby) {
			switch (getLocation()) {
			case sdk.game.locations.CharSelect:
			case sdk.game.locations.CharSelectNoChars:
				// Create Character greyed out
				if (Controls.CharSelectCreate.disabled === sdk.game.controls.Disabled) {
					me.blockMouse = false;

					return false;
				}

				Controls.CharSelectCreate.click();

				break;
			case sdk.game.locations.CharacterCreate:
				clickCoords = (() => {
					switch (info.charClass) {
					case "barbarian":
						return [400, 280];
					case "amazon":
						return [100, 280];
					case "necromancer":
						return [300, 290];
					case "sorceress":
						return [620, 270];
					case "assassin":
						return [200, 280];
					case "druid":
						return [700, 280];
					case "paladin":
					default:
						return [521, 260];
					}
				})();

				getControl().click(clickCoords[0], clickCoords[1]);
				delay(500);

				break;
			case sdk.game.locations.NewCharSelected:
				if (Controls.CharCreateHCWarningOk.control) {
					Controls.CharCreateHCWarningOk.click();
				} else {
					Controls.CharCreateCharName.setText(info.charName);

					if (!info.expansion) {
						if (["druid", "assassin"].includes(info.charClass)) {
							D2Bot.printToConsole("Error in profile name. Expansion characters cannot be made in classic", sdk.colors.D2Bot.Red);
							D2Bot.stop();

							return false;
						}

						Controls.CharCreateExpansion.click();
					}

					!info.ladder && Controls.CharCreateLadder.click();
					info.hardcore && Controls.CharCreateHardcore.click();

					Controls.CreateNewAccountOk.click();
				}

				break;
			case sdk.game.locations.OkCenteredErrorPopUp:
				// char name exists (text box 4, 268, 320, 264, 120)
				Controls.OkCentered.click();
				Controls.CharSelectExit.click();

				me.blockMouse = false;

				return false;
			default:
				break;
			}

			// Singleplayer loop break fix.
			if (me.ingame) {
				break;
			}

			delay(500);
		}

		me.blockMouse = false;

		return true;
	},

	// Test version - modified core only
	getGameList: function () {
		let text = Controls.JoinGameList.getText();

		if (text) {
			let gameList = [];

			for (let i = 0; i < text.length; i += 1) {
				gameList.push({
					gameName: text[i][0],
					players: text[i][1]
				});
			}

			return gameList;
		}

		return false;
	},

	deleteCharacter: function (info) {
		me.blockMouse = true;

		// start from beginning of the char list
		sendKey(0x24);
		
		// cycle until in lobby
		while (getLocation() === sdk.game.locations.CharSelect) {
			let count = 0;
			let control = Controls.CharSelectCharInfo0.control;

			if (control) {
				do {
					let text = control.getText();

					if (text instanceof Array && typeof text[1] === "string") {
						count++;

						if (text[1].toLowerCase() === info.charName.toLowerCase()) {
							print("delete character " + info.charName);
							
							control.click();
							Controls.CharSelectDelete.click() && delay(500);
							Controls.CharDeleteYes.click() && delay(500);
							me.blockMouse = false;
							
							return true;
						}
					}
				} while (control.getNext());
			}

			// check for additional characters up to 24
			if (count === 8 || count === 16) {
				Controls.CharSelectChar6.click() && this.scrollDown();
			} else {
				// no further check necessary
				break;
			}

			delay(100);
		}

		me.blockMouse = false;

		return false;
	},

	getQueueTime: function() {
		// You are in line to create a game.,Try joining a game to avoid waiting.,,Your position in line is: ÿc02912
		const text = Controls.CreateGameInLine.getText();
		if (text && text.indexOf(getLocaleString(sdk.locale.text.YourPositionInLineIs)) > -1) {
			const result = /ÿc0(\d*)/gm.exec(text);
			if (result && typeof result[1] === "string") {
				return parseInt(result[1]) || 0;
			}
		}

		return 0; // You're in line 0, aka no queue
	},

	loginOtherMultiplayer: function () {
		MainLoop:
		while (true) {
			switch (getLocation()) {
			case sdk.game.locations.CharSelect:
				if (Controls.CharSelectCurrentRealm.control) {
					console.log("Not in single player character select screen");
					Controls.CharSelectExit.click();

					break;
				}

				Starter.LocationEvents.login(false);

				break;
			case sdk.game.locations.SelectDifficultySP:
				Starter.LocationEvents.selectDifficultySP();
				
				break;
			case sdk.game.locations.SplashScreen:
				ControlAction.click();

				break;
			case sdk.game.locations.MainMenu:
				if (Profile().type === sdk.game.profiletype.OpenBattlenet) {
					// check we are on the correct gateway
					let realms = {"west": 0, "east": 1, "asia": 2, "europe": 3};
					ControlAction.clickRealm(realms[Profile().gateway.toLowerCase()]);
					try {
						login(me.profile);
					} catch (e) {
						print(e);
					}

					break;
				}
				
				Controls.OtherMultiplayer.click();

				break;
			case sdk.game.locations.OtherMultiplayer:
				Starter.LocationEvents.otherMultiplayerSelect();

				break;
			case sdk.game.locations.TcpIp:
				// handle this in otherMultiplayerSelect
				// not sure how to handle enter ip though, should that be left to the starter to decide?
				Controls.TcpIpCancel.click();

				break;
			case sdk.game.locations.TcpIpEnterIp:
				break MainLoop;
			case sdk.game.locations.Login:
				login(me.profile);

				break;
			case sdk.game.locations.LoginUnableToConnect:
			case sdk.game.locations.TcpIpUnableToConnect:
				Starter.LocationEvents.unableToConnect();

				break;
			case sdk.game.locations.Lobby:
			case sdk.game.locations.LobbyChat:
				D2Bot.updateStatus("Lobby");

				if (me.charname !== Starter.profileInfo.charName) {
					Controls.LobbyQuit.click();
					
					break;
				}

				me.blockKeys = false;
				!Starter.firstLogin && (Starter.firstLogin = true);

				break MainLoop;
			default:
				if (me.ingame) {
					break MainLoop;
				}

				break;
			}
		}
		
		// handling Enter Ip inside entry for now so that location === sucess
		return (me.ingame || getLocation() === sdk.game.locations.TcpIpEnterIp);
	}
};
