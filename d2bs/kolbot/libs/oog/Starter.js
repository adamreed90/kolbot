/**
*  @filename    Starter.js
*  @author      theBGuy
*  @desc        Starter actions, locations, location actions/events
*
*/

const Starter = {
	Config: {},
	useChat: false,
	pingQuit: false,
	inGame: false,
	firstLogin: true,
	firstRun: false,
	isUp: "no",
	loginRetry: 0,
	deadCheck: false,
	chatActionsDone: false,
	gameStart: 0,
	gameCount: 0,
	lastGameStatus: "ready",
	handle: undefined,
	connectFail: false,
	connectFailRetry: 0,
	makeAccount: false,
	channelNotify: false,
	otherMultiLogin: [sdk.game.gametype.TcpIpHost, sdk.game.profiletype.OpenBattlenet].includes(Profile().type),
	gameMaker: true,
	chanInfo: {
		joinChannel: "",
		firstMsg: "",
		afterMsg: "",
		announce: false
	},
	gameInfo: {},
	joinInfo: {},
	profileInfo: {},

	timer: (tick) => " (" + new Date(getTickCount() - tick).toISOString().slice(11, -5) + ")",

	sayMsg: function (string) {
		this.useChat && say(string);
	},

	locationTimeout: function (time, location) {
		let endtime = getTickCount() + time;

		while (!me.ingame && getLocation() === location && endtime > getTickCount()) {
			delay(500);
		}

		return (getLocation() !== location);
	},

	setNextGame: function (gameInfo = {}) {
		let nextGame = (gameInfo.gameName || this.randomString(null, true));
		
		if ((this.gameCount + 1 >= Starter.Config.ResetCount) || (nextGame.length + this.gameCount + 1 > 15)) {
			nextGame += "1";
		} else {
			nextGame += (this.gameCount + 1);
		}

		DataFile.updateStats("nextGame", nextGame);
	},

	updateCount: function () {
		D2Bot.updateCount();
		delay(1000);
		Controls.BattleNet.click();

		try {
			login(me.profile);
		} catch (e) {
			return;
		}

		delay(1000);
		Controls.CharSelectExit.click();
	},

	scriptMsgEvent: function (msg) {
		if (msg && typeof msg !== "string") return;
		switch (msg) {
		case "mule":
			AutoMule.check = true;

			break;
		case "muleTorch":
			AutoMule.torchAnniCheck = 1;

			break;
		case "muleAnni":
			AutoMule.torchAnniCheck = 2;

			break;
		case "torch":
			TorchSystem.check = true;

			break;
		case "crafting":
			CraftingSystem.check = true;

			break;
		case "getMuleMode":
			if (AutoMule.torchAnniCheck === 2) {
				scriptBroadcast("2");
			} else if (AutoMule.torchAnniCheck === 1) {
				scriptBroadcast("1");
			} else if (AutoMule.check) {
				scriptBroadcast("0");
			}

			break;
		case "pingquit":
			this.pingQuit = true;

			break;
		}
	},

	receiveCopyData: function (mode, msg) {
		let obj;

		msg === "Handle" && typeof mode === "number" && (Starter.handle = mode);

		switch (mode) {
		case 1: // JoinInfo
			obj = JSON.parse(msg);
			Object.assign(Starter.joinInfo, obj);

			break;
		case 2: // Game info
			print("Recieved Game Info");
			obj = JSON.parse(msg);
			Object.assign(Starter.gameInfo, obj);

			break;
		case 3: // Game request
			// Don't let others join mule/torch/key/gold drop game
			if (AutoMule.inGame || Gambling.inGame || TorchSystem.inGame || CraftingSystem.inGame) {
				break;
			}

			if (Object.keys(Starter.gameInfo).length) {
				obj = JSON.parse(msg);

				if ([sdk.game.profiletype.TcpIpHost, sdk.game.profiletype.TcpIpJoin].includes(Profile().type)) {
					me.gameReady && D2Bot.joinMe(obj.profile, me.gameserverip.toString(), "", "", Starter.isUp);
				} else {
					if (me.gameReady) {
						D2Bot.joinMe(obj.profile, me.gamename.toLowerCase(), "", me.gamepassword.toLowerCase(), Starter.isUp);
					} else {
						D2Bot.joinMe(obj.profile, Starter.gameInfo.gameName.toLowerCase(), Starter.gameCount, Starter.gameInfo.gamePass.toLowerCase(), Starter.isUp);
					}
				}
			}

			break;
		case 4: // Heartbeat ping
			msg === "pingreq" && sendCopyData(null, me.windowtitle, 4, "pingrep");

			break;
		case 61732: // Cached info retreival
			msg !== "null" && (Starter.gameInfo.crashInfo = JSON.parse(msg));

			break;
		case 1638: // getProfile
			try {
				obj = JSON.parse(msg);
				Starter.profileInfo.profile = me.profile;
				Starter.profileInfo.account = obj.account;
				Starter.profileInfo.charName = obj.Character;
				obj.Realm = obj.Realm.toLowerCase();
				Starter.profileInfo.realm = ["east", "west"].includes(obj.Realm) ? "us" + obj.Realm : obj.Realm;
			} catch (e) {
				print(e);
			}

			break;
		}
	},

	randomString: function (len, useNumbers = false) {
		!len && (len = rand(5, 14));

		let rval = "";
		let letters = useNumbers ? "abcdefghijklmnopqrstuvwxyz0123456789" : "abcdefghijklmnopqrstuvwxyz";

		for (let i = 0; i < len; i += 1) {
			rval += letters[rand(0, letters.length - 1)];
		}

		return rval;
	},

	randomNumberString: function (len) {
		!len && (len = rand(2, 5));

		let rval = "";
		let vals = "0123456789";

		for (let i = 0; i < len; i += 1) {
			rval += vals[rand(0, vals.length - 1)];
		}

		return rval;
	},

	LocationEvents: {
		selectDifficultySP: function () {
			let diff = (Starter.gameInfo.difficulty || "Highest");
			diff === "Highest" && (diff = "Hell"); // starts from top with fall-through to select highest

			switch (diff) {
			case "Hell":
				if (Controls.HellSP.click() && Starter.locationTimeout(1e3, sdk.game.locations.SelectDifficultySP)) {
					break;
				}
			// eslint-disable-next-line no-fallthrough
			case "Nightmare":
				if (Controls.NightmareSP.click() && Starter.locationTimeout(1e3, sdk.game.locations.SelectDifficultySP)) {
					break;
				}
			// eslint-disable-next-line no-fallthrough
			case "Normal":
				Controls.NormalSP.click();

				break;
			}
			return Starter.locationTimeout(5e3, sdk.game.locations.SelectDifficultySP);
		},

		loginError: function () {
			let cdkeyError = false;
			let defaultPrint = true;
			let string = "";
			let text = (Controls.LoginErrorText.getText() || Controls.LoginInvalidCdKey.getText());

			if (text) {
				for (let i = 0; i < text.length; i += 1) {
					string += text[i];
					i !== text.length - 1 && (string += " ");
				}

				switch (string) {
				case getLocaleString(sdk.locale.text.UsenameIncludedIllegalChars):
				case getLocaleString(sdk.locale.text.UsenameIncludedDisallowedwords):
				case getLocaleString(sdk.locale.text.UsernameMustBeAtLeast):
				case getLocaleString(sdk.locale.text.PasswordMustBeAtLeast):
				case getLocaleString(sdk.locale.text.AccountMustBeAtLeast):
				case getLocaleString(sdk.locale.text.PasswordCantBeMoreThan):
				case getLocaleString(sdk.locale.text.AccountCantBeMoreThan):
					D2Bot.printToConsole(string);
					D2Bot.stop();

					break;
				case getLocaleString(sdk.locale.text.InvalidPassword):
					D2Bot.printToConsole("Invalid Password");
					ControlAction.timeoutDelay("Invalid password delay", Starter.Config.InvalidPasswordDelay * 6e4);
					D2Bot.printToConsole("Invalid Password - Restart");
					D2Bot.restart();

					break;
				case getLocaleString(sdk.locale.text.AccountDoesNotExist):
					if (!!Starter.Config.MakeAccountOnFailure) {
						Starter.makeAccount = true;
						Controls.LoginErrorOk.click();

						return;
					} else {
						D2Bot.printToConsole(string);
						D2Bot.updateStatus(string);
					}

					break;
				case getLocaleString(sdk.locale.text.AccountIsCorrupted):
				case getLocaleString(sdk.locale.text.UnableToCreateAccount):
					D2Bot.printToConsole(string);
					D2Bot.updateStatus(string);

					break;
				case getLocaleString(sdk.locale.text.Disconnected):
					D2Bot.updateStatus("Disconnected");
					D2Bot.printToConsole("Disconnected");
					Controls.OkCentered.click();
					Controls.LoginErrorOk.click();

					return;
				case getLocaleString(sdk.locale.text.CdKeyIntendedForAnotherProduct):
				case getLocaleString(sdk.locale.text.LoDKeyIntendedForAnotherProduct):
				case getLocaleString(sdk.locale.text.CdKeyDisabled):
				case getLocaleString(sdk.locale.text.LoDKeyDisabled):
					cdkeyError = true;

					break;
				case getLocaleString(sdk.locale.text.CdKeyInUseBy):
					string += (" " + Controls.LoginCdKeyInUseBy.getText());
					D2Bot.printToConsole(Starter.gameInfo.mpq + " " + string, sdk.colors.D2Bot.Gold);
					D2Bot.CDKeyInUse();

					if (Starter.gameInfo.switchKeys) {
						cdkeyError = true;
					} else {
						Controls.UnableToConnectOk.click();
						ControlAction.timeoutDelay("LoD key in use", Starter.Config.CDKeyInUseDelay * 6e4);
						
						return;
					}

					break;
				case getLocaleString(sdk.locale.text.LoginError):
				case getLocaleString(sdk.locale.text.OnlyOneInstanceAtATime):
					Controls.LoginErrorOk.click();
					Controls.LoginExit.click();
					D2Bot.printToConsole(string);
					ControlAction.timeoutDelay("Login Error Delay", 5 * 6e4);
					D2Bot.printToConsole("Login Error - Restart");
					D2Bot.restart();

					break;
				default:
					D2Bot.updateStatus("Login Error");
					D2Bot.printToConsole("Login Error - " + string);
					cdkeyError = true;
					defaultPrint = false;

					break;
				}

				if (cdkeyError) {
					defaultPrint && D2Bot.printToConsole(string + Starter.gameInfo.mpq, sdk.colors.D2Bot.Gold);
					defaultPrint && D2Bot.updateStatus(string);
					D2Bot.CDKeyDisabled();
					if (Starter.gameInfo.switchKeys) {
						ControlAction.timeoutDelay("Key switch delay", Starter.Config.SwitchKeyDelay * 1000);
						D2Bot.restart(true);
					} else {
						D2Bot.stop();
					}
				}

				Controls.LoginErrorOk.click();
				delay(1000);
				Controls.CharSelectExit.click();
		
				while (true) {
					delay(1000);
				}
			}
		},

		charSelectError: function () {
			let string = "";
			let text = Controls.CharSelectError.getText();
			let currentLoc = getLocation();

			if (text) {
				for (let i = 0; i < text.length; i += 1) {
					string += text[i];
					i !== text.length - 1 && (string += " ");
				}

				if (string === getLocaleString(sdk.locale.text.CdKeyDisabledFromRealm)) {
					D2Bot.updateStatus("Realm Disabled CDKey");
					D2Bot.printToConsole("Realm Disabled CDKey: " + Starter.gameInfo.mpq, sdk.colors.D2Bot.Gold);
					D2Bot.CDKeyDisabled();

					if (Starter.gameInfo.switchKeys) {
						ControlAction.timeoutDelay("Key switch delay", Starter.Config.SwitchKeyDelay * 1000);
						D2Bot.restart(true);
					} else {
						D2Bot.stop();
					}
				}
			}

			if (!Starter.locationTimeout(Starter.Config.ConnectingTimeout * 1e3, currentLoc)) {
				// Click create char button on infinite "connecting" screen
				Controls.CharSelectCreate.click();
				delay(1000);
				
				Controls.CharSelectExit.click();
				delay(1000);
				
				if (getLocation() !== sdk.game.locations.CharSelectConnecting) return true;
				
				Controls.CharSelectExit.click();
				Starter.gameInfo.rdBlocker && D2Bot.restart();

				return false;
			}

			return true;
		},

		realmDown: function () {
			D2Bot.updateStatus("Realm Down");
			delay(1000);

			if (!Controls.CharSelectExit.click()) return;

			Starter.updateCount();
			ControlAction.timeoutDelay("Realm Down", Starter.Config.RealmDownDelay * 6e4);
			D2Bot.CDKeyRD();

			if (Starter.gameInfo.switchKeys && !Starter.gameInfo.rdBlocker) {
				D2Bot.printToConsole("Realm Down - Changing CD-Key");
				ControlAction.timeoutDelay("Key switch delay", Starter.Config.SwitchKeyDelay * 1000);
				D2Bot.restart(true);
			} else {
				D2Bot.printToConsole("Realm Down - Restart");
				D2Bot.restart();
			}
		},

		waitingInLine: function () {
			let queue = ControlAction.getQueueTime();
			let currentLoc = getLocation();

			if (queue > 0) {
				switch (true) {
				case (queue < 10000):
					D2Bot.updateStatus("Waiting line... Queue: " + queue);

					// If stuck here for too long, game creation likely failed. Exit to char selection and try again.
					if (queue < 10) {
						if (!Starter.locationTimeout(Starter.Config.WaitInLineTimeout * 1e3, currentLoc)) {
							print("Failed to create game");
							Controls.CancelCreateGame.click();
							Controls.LobbyQuit.click();
							delay(1000);
						}
					}

					break;
				case (queue > 10000):
					if (Starter.Config.WaitOutQueueRestriction) {
						D2Bot.updateStatus("Waiting out Queue restriction: " + queue);
					} else {
						print("Restricted... Queue: " + queue);
						D2Bot.printToConsole("Restricted... Queue: " + queue, sdk.colors.D2Bot.Red);
						Controls.CancelCreateGame.click();

						if (Starter.Config.WaitOutQueueExitToMenu) {
							Controls.LobbyQuit.click();
							delay(1000);
							Controls.CharSelectExit.click();
						}

						// Wait out each queue as 1 sec and add extra 10 min
						ControlAction.timeoutDelay("Restricted", (queue + 600) * 1000);
					}

					break;
				}
			}
		},

		gameDoesNotExist: function () {
			let currentLoc = getLocation();
			console.log("Game doesn't exist");

			if (Starter.gameInfo.rdBlocker) {
				D2Bot.printToConsole(Starter.gameInfo.mpq + " is probably flagged.", sdk.colors.D2Bot.Gold);

				if (Starter.gameInfo.switchKeys) {
					ControlAction.timeoutDelay("Key switch delay", Starter.Config.SwitchKeyDelay * 1000);
					D2Bot.restart(true);
				}
			} else {
				Starter.locationTimeout(Starter.Config.GameDoesNotExistTimeout * 1e3, currentLoc);
			}

			Starter.lastGameStatus = "ready";
		},

		unableToConnect: function () {
			let currentLoc = getLocation();

			if (getLocation() === sdk.game.locations.TcpIpUnableToConnect) {
				D2Bot.updateStatus("Unable To Connect TCP/IP");
				Starter.connectFail && ControlAction.timeoutDelay("Unable to Connect", Starter.Config.TCPIPNoHostDelay * 1e3);
				Controls.OkCentered.click();
				Starter.connectFail = !Starter.connectFail;
			} else {
				D2Bot.updateStatus("Unable To Connect");

				if (Starter.connectFailRetry < 2) {
					Starter.connectFailRetry++;
					Controls.UnableToConnectOk.click();

					return;
				}

				Starter.connectFailRetry >= 2 && (Starter.connectFail = true);

				if (Starter.connectFail && !Starter.locationTimeout(10e4, currentLoc)) {
					let string = "";
					let text = Controls.LoginUnableToConnect.getText();

					if (text) {
						for (let i = 0; i < text.length; i++) {
							string += text[i];
							i !== text.length - 1 && (string += " ");
						}
					}
					
					switch (string) {
					case getLocaleString(sdk.locale.text.UnableToIndentifyVersion):
						Controls.UnableToConnectOk.click();
						ControlAction.timeoutDelay("Version error", Starter.Config.VersionErrorDelay * 1000);
						
						break;
					default: // Regular UTC and everything else
						Controls.UnableToConnectOk.click();
						ControlAction.timeoutDelay("Unable to Connect", Starter.Config.UnableToConnectDelay * 1000 * 60);
						
						break;
					}

					Starter.connectFail = false;
				}

				if (!Controls.UnableToConnectOk.click()) {
					return;
				}

				Starter.connectFail = true;
				Starter.connectFailRetry = 0;
			}
		},

		openCreateGameWindow: function () {
			let currentLoc = getLocation();

			if (!Controls.CreateGameWindow.click()) return true;
			// dead Hardcore character
			if (Controls.CreateGameWindow.control && Controls.CreateGameWindow.disabled === sdk.game.controls.Disabled) {
				if (Starter.Config.StopOnDeadHardcore) {
					D2Bot.printToConsole(Profile().character + " has died. They shall be remembered...maybe. Shutting down, better luck next time", sdk.colors.D2Bot.Gold);
					D2Bot.stop();
				} else {
					D2Bot.printToConsole(Profile().character + " has died. They shall be remembered...maybe. Better luck next time", sdk.colors.D2Bot.Gold);
					D2Bot.updateStatus(Profile().character + " has died. They shall be remembered...maybe. Better luck next time");
					Starter.deadCheck = true;
					Controls.LobbyQuit.click();
				}

				return false;
			}

			// in case create button gets bugged
			if (!Starter.locationTimeout(5000, currentLoc)) {
				if (!Controls.CreateGameWindow.click()) return true;
				if (!Controls.JoinGameWindow.click()) return true;
			}

			return (getLocation() === sdk.game.locations.CreateGame);
		},

		openJoinGameWindow: function () {
			let currentLoc = getLocation();

			if (!Controls.JoinGameWindow.click()) return;

			// in case create button gets bugged
			if (!Starter.locationTimeout(5000, currentLoc)) {
				if (!Controls.CreateGameWindow.click()) return;
				if (!Controls.JoinGameWindow.click()) return;
			}
		},

		login: function (otherMultiCheck = false) {
			Starter.inGame && (Starter.inGame = false);
			if (otherMultiCheck && [sdk.game.gametype.SinglePlayer, sdk.game.gametype.BattleNet].indexOf(Profile().type) === -1) {
				return ControlAction.loginOtherMultiplayer();
			}

			if (getLocation() === sdk.game.locations.MainMenu) {
				if (Profile().type === sdk.game.profiletype.SinglePlayer
					&& Starter.firstRun
					&& Controls.SinglePlayer.click()) {
					return true;
				}
			}

			// Wrong char select screen fix
			if (getLocation() === sdk.game.locations.CharSelect) {
				hideConsole(); // seems to fix odd crash with single-player characters if the console is open to type in
				if ((Profile().type === sdk.game.profiletype.Battlenet && !Controls.CharSelectCurrentRealm.control)
					|| ((Profile().type !== sdk.game.profiletype.Battlenet && Controls.CharSelectCurrentRealm.control))) {
					Controls.CharSelectExit.click();
				
					return false;
				}
			}

			// Multiple realm botting fix in case of R/D or disconnect
			Starter.firstLogin && getLocation() === sdk.game.locations.Login && Controls.CharSelectExit.click();
	
			D2Bot.updateStatus("Logging In");
					
			try {
				login(me.profile);
			} catch (e) {
				if (getLocation() === sdk.game.locations.CharSelect && Starter.loginRetry < 2) {
					if (!ControlAction.findCharacter(Starter.profileInfo)) {
						// dead hardcore character on sp
						if (getLocation() === sdk.game.locations.OkCenteredErrorPopUp) {
							// Exit from that pop-up
							Controls.OkCentered.click();
							D2Bot.printToConsole("Character died", sdk.colors.D2Bot.Red);
							D2Bot.stop();
						} else {
							Starter.loginRetry++;
						}
					} else {
						login(me.profile);
					}
				} else if (getLocation() === sdk.game.locations.TcpIpEnterIp && Profile().type === sdk.game.profiletype.TcpIpJoin) {
					return true; // handled in its own case
				} else {
					print(e + " " + getLocation());
				}
			}

			return true;
		},

		otherMultiplayerSelect: function () {
			if ([sdk.game.profiletype.TcpIpHost, sdk.game.profiletype.TcpIpJoin].includes(Profile().type)) {
				Controls.TcpIp.click() && (Profile().type === sdk.game.profiletype.TcpIpHost ? Controls.TcpIpHost.click() : Controls.TcpIpJoin.click());
			} else if (Profile().type === sdk.game.profiletype.OpenBattlenet) {
				Controls.OpenBattleNet.click();
			} else {
				Controls.OtherMultiplayerCancel.click();
			}
		},

		oogCheck: function () {
			return (AutoMule.outOfGameCheck() || TorchSystem.outOfGameCheck() || Gambling.outOfGameCheck() || CraftingSystem.outOfGameCheck());
		},

		lobbyChat: function () {
			D2Bot.updateStatus("Lobby Chat");
			Starter.lastGameStatus === "pending" && (Starter.gameCount += 1);

			if (Starter.inGame || Starter.gameInfo.error) {
				!Starter.gameStart && (Starter.gameStart = DataFile.getStats().ingameTick);

				if (getTickCount() - Starter.gameStart < Starter.Config.MinGameTime * 1e3) {
					ControlAction.timeoutDelay("Min game time wait", Starter.Config.MinGameTime * 1e3 + Starter.gameStart - getTickCount());
				}
			}

			if (Starter.inGame) {
				if (this.oogCheck()) return;

				console.log("updating runs");
				D2Bot.updateRuns();

				Starter.gameCount += 1;
				Starter.lastGameStatus = "ready";
				Starter.inGame = false;

				if (Starter.Config.ResetCount && Starter.gameCount > Starter.Config.ResetCount) {
					Starter.gameCount = 1;
					DataFile.updateStats("runs", Starter.gameCount);
				}

				Starter.chanInfo.afterMsg = Starter.Config.AfterGameMessage;

				// check that we are in the channel we are supposed to be in
				if (Starter.chanInfo.joinChannel.length) {
					let chanName = Controls.LobbyChannelName.getText();
					chanName && (chanName = chanName.toString());
					chanName && (chanName = chanName.slice(0, chanName.indexOf("(") - 1));
					Starter.chanInfo.joinChannel.indexOf(chanName) === -1 && (Starter.chatActionsDone = false);
				}

				if (Starter.chanInfo.afterMsg) {
					!Array.isArray(Starter.chanInfo.afterMsg) && (Starter.chanInfo.afterMsg = [Starter.chanInfo.afterMsg]);

					for (let i = 0; i < Starter.chanInfo.afterMsg.length; i++) {
						Starter.sayMsg(Starter.chanInfo.afterMsg[i]);
						delay(500);
					}
				}
			}

			if (!Starter.chatActionsDone) {
				Starter.chatActionsDone = true;
				Starter.chanInfo.joinChannel = Starter.Config.JoinChannel;
				Starter.chanInfo.firstMsg = Starter.Config.FirstJoinMessage;

				if (Starter.chanInfo.joinChannel) {
					!Array.isArray(Starter.chanInfo.joinChannel) && (Starter.chanInfo.joinChannel = [Starter.chanInfo.joinChannel]);
					!Array.isArray(Starter.chanInfo.firstMsg) && (Starter.chanInfo.firstMsg = [Starter.chanInfo.firstMsg]);

					for (let i = 0; i < Starter.chanInfo.joinChannel.length; i++) {
						ControlAction.timeoutDelay("Chat delay", Starter.Config.ChatActionsDelay * 1e3);

						if (ControlAction.joinChannel(Starter.chanInfo.joinChannel[i])) {
							Starter.useChat = true;
						} else {
							console.log("ÿc1Unable to join channel, disabling chat messages.");
							Starter.useChat = false;
						}

						if (Starter.chanInfo.firstMsg[i] !== "") {
							Starter.sayMsg(Starter.chanInfo.firstMsg[i]);
							delay(500);
						}
					}
				}
			}

			// Announce game
			Starter.chanInfo.announce = Starter.Config.AnnounceGames;

			if (Starter.chanInfo.announce) {
				Starter.sayMsg("Next game is " + Starter.gameInfo.gameName + Starter.gameCount + (Starter.gameInfo.gamePass === "" ? "" : "//" + Starter.gameInfo.gamePass));
			}

			Starter.LocationEvents.openCreateGameWindow();
		},

		charSelect: function () {
			let string = "";
			let text = Controls.CharSelectError.getText();

			if (text) {
				for (let i = 0; i < text.length; i++) {
					string += text[i];

					if (i !== text.length - 1) {
						string += " ";
					}
				}

				// CDKey disabled from realm play
				if (string === getLocaleString(sdk.locale.text.CdKeyDisabledFromRealm)) {
					D2Bot.updateStatus("Realm Disabled CDKey");
					D2Bot.printToConsole("Realm Disabled CDKey: " + Starter.gameInfo.mpq, sdk.colors.D2Bot.Gold);
					D2Bot.CDKeyDisabled();

					if (Starter.gameInfo.switchKeys) {
						ControlAction.timeoutDelay("Key switch delay", Starter.Config.SwitchKeyDelay * 1000);
						D2Bot.restart(true);
					} else {
						D2Bot.stop();
					}
				}
			}

			if (Object.keys(Starter.profileInfo).length) {
				if (!ControlAction.findCharacter(Starter.profileInfo)) {
					ControlAction.timeoutDelay("Character not found ", 18e4);
				} else {
					ControlAction.loginCharacter(Starter.profileInfo, false);
				}
			}

			if (!Starter.locationTimeout(Starter.Config.ConnectingTimeout * 1e3, currentLoc)) {
				// Click create char button on infinite "connecting" screen
				Controls.CharSelectCreate.click();
				delay(1000);
				
				Controls.CharSelectExit.click();
				delay(1000);
				
				if (getLocation() !== sdk.game.locations.CharSelectConnecting) return;
				
				Controls.CharSelectExit.click();
				Starter.gameInfo.rdBlocker && D2Bot.restart();
			}
		},
	},
};

Starter.locations = {};
Starter.locations[sdk.game.locations.PreSplash] = (loc) => {
	ControlAction.click();
	Starter.locationTimeout(5000, loc);
	getLocation() === sdk.game.locations.PreSplash && sendKey(sdk.keys.code.Enter);
};
Starter.locations[sdk.game.locations.GatewaySelect] = () => Controls.GatewayCancel.click();
Starter.locations[sdk.game.locations.SplashScreen] = () => Starter.LocationEvents.login(Starter.otherMultiLogin);
Starter.locations[sdk.game.locations.MainMenu] = () => Starter.LocationEvents.login(Starter.otherMultiLogin);
Starter.locations[sdk.game.locations.Login] = () => Starter.LocationEvents.login(Starter.otherMultiLogin);
Starter.locations[sdk.game.locations.OtherMultiplayer] = () => Starter.LocationEvents.otherMultiplayerSelect();
Starter.locations[sdk.game.locations.TcpIp] = () => Profile().type === sdk.game.profiletype.TcpIpHost ? Controls.TcpIpHost.click() : Controls.TcpIpCancel.click();
Starter.locations[sdk.game.locations.TcpIpEnterIp] = () => Controls.TcpIpCancel.click();
Starter.locations[sdk.game.locations.LoginError] = () => Starter.LocationEvents.loginError();
Starter.locations[sdk.game.locations.LoginUnableToConnect] = () => Starter.LocationEvents.unableToConnect();
Starter.locations[sdk.game.locations.TcpIpUnableToConnect] = () => Starter.LocationEvents.unableToConnect();
Starter.locations[sdk.game.locations.CdKeyInUse] = () => Starter.LocationEvents.loginError();
Starter.locations[sdk.game.locations.InvalidCdKey] = () => Starter.LocationEvents.loginError();
Starter.locations[sdk.game.locations.RealmDown] = () => Starter.LocationEvents.realmDown();
Starter.locations[sdk.game.locations.Disconnected] = () => {
	ControlAction.timeoutDelay("Disconnected", 3000);
	Controls.OkCentered.click();
};
Starter.locations[sdk.game.locations.RegisterEmail] = () => Controls.EmailDontRegisterContinue.control ? Controls.EmailDontRegisterContinue.click() : Controls.EmailDontRegister.click();
Starter.locations[sdk.game.locations.MainMenuConnecting] = (loc) => !Starter.locationTimeout(Starter.Config.ConnectingTimeout * 1e3, loc) && Controls.LoginCancelWait.click();
Starter.locations[sdk.game.locations.CharSelectPleaseWait] = (loc) => !Starter.locationTimeout(Starter.Config.PleaseWaitTimeout * 1e3, loc) && Controls.OkCentered.click();
Starter.locations[sdk.game.locations.CharSelect] = () => Starter.LocationEvents.charSelect();
Starter.locations[sdk.game.locations.CharSelectConnecting] = () => Starter.LocationEvents.charSelect();
Starter.locations[sdk.game.locations.CharSelectNoChars] = () => Starter.LocationEvents.charSelect();
Starter.locations[sdk.game.locations.SelectDifficultySP] = () => Starter.LocationEvents.selectDifficultySP();
Starter.locations[sdk.game.locations.CharacterCreate] = (loc) => !Starter.locationTimeout(5e3, loc) && Controls.CharSelectExit.click();
Starter.locations[sdk.game.locations.ServerDown] = () => {
	ControlAction.timeoutDelay("Server Down", Time.minutes(5));
	Controls.OkCentered.click();
};
Starter.locations[sdk.game.locations.LobbyPleaseWait] = (loc) => !Starter.locationTimeout(Starter.Config.PleaseWaitTimeout * 1e3, loc) && Controls.OkCentered.click();
Starter.locations[sdk.game.locations.Lobby] = () => {
	D2Bot.updateStatus("Lobby");

	me.blockKeys = false;

	Starter.loginRetry = 0;
	Starter.loginFail = 0;
	!Starter.firstLogin && (Starter.firstLogin = true);
	Starter.lastGameStatus === "pending" && (Starter.gameCount += 1);

	if (Starter.Config.PingQuitDelay && Starter.pingQuit) {
		ControlAction.timeoutDelay("Ping Delay", Starter.Config.PingQuitDelay * 1e3);
		Starter.pingQuit = false;
	}

	if (Starter.Config.JoinChannel !== "" && Controls.LobbyEnterChat.click()) return;

	if (Starter.inGame || Starter.gameInfo.error) {
		!Starter.gameStart && (Starter.gameStart = DataFile.getStats().ingameTick);

		if (getTickCount() - Starter.gameStart < Starter.Config.MinGameTime * 1e3 && !joinInfo) {
			ControlAction.timeoutDelay("Min game time wait", Starter.Config.MinGameTime * 1e3 + Starter.gameStart - getTickCount());
		}
	}

	if (Starter.inGame) {
		if (Starter.LocationEvents.oogCheck()) return;

		D2Bot.updateRuns();

		Starter.gameCount += 1;
		Starter.lastGameStatus = "ready";
		Starter.inGame = false;

		if (Starter.Config.ResetCount && Starter.gameCount > Starter.Config.ResetCount) {
			Starter.gameCount = 1;
			DataFile.updateStats("runs", Starter.gameCount);
		}
	}

	Starter.gameMaker ? Starter.LocationEvents.openCreateGameWindow() : Starter.LocationEvents.openJoinGameWindow();
};
Starter.locations[sdk.game.locations.LobbyChat] = () => Starter.LocationEvents.lobbyChat();
Starter.locations[sdk.game.locations.CreateGame] = (loc) => {
	ControlAction.timeoutDelay("Create Game Delay", Starter.Config.DelayBeforeLogin * 1e3);
	D2Bot.updateStatus("Creating Game");

	if (typeof Starter.Config.CharacterDifference === "number") {
		Controls.CharacterDifference.disabled === sdk.game.controls.Disabled && Controls.CharacterDifferenceButton.click();
		Controls.CharacterDifference.setText(Starter.Config.CharacterDifference.toString());
	} else if (!Starter.Config.CharacterDifference && Controls.CharacterDifference.disabled === 5) {
		Controls.CharacterDifferenceButton.click();
	}

	typeof Starter.Config.MaxPlayerCount === "number" && Controls.MaxPlayerCount.setText(Starter.Config.MaxPlayerCount.toString());

	// Get game name if there is none
	while (!Starter.gameInfo.gameName) {
		D2Bot.requestGameInfo();
		delay(500);
	}

	// FTJ handler
	if (Starter.lastGameStatus === "pending") {
		Starter.isUp = "no";
		D2Bot.printToConsole("Failed to create game");
		ControlAction.timeoutDelay("FTJ delay", Starter.Config.FTJDelay * 1e3);
		D2Bot.updateRuns();
	}

	let gameName = (Starter.gameInfo.gameName === "?" ? Starter.randomString(null, true) : Starter.gameInfo.gameName + Starter.gameCount);
	let gamePass = (Starter.gameInfo.gamePass === "?" ? Starter.randomString(null, true) : Starter.gameInfo.gamePass);

	ControlAction.createGame(gameName, gamePass, Starter.gameInfo.difficulty, Starter.Config.CreateGameDelay * 1000);
	Starter.lastGameStatus = "pending";
	Starter.setNextGame(Starter.gameInfo);
	Starter.locationTimeout(10000, loc);
};
Starter.locations[sdk.game.locations.GameNameExists] = () => {
	Controls.CreateGameWindow.click();
	Starter.gameCount += 1;
	Starter.lastGameStatus = "ready";
};
Starter.locations[sdk.game.locations.WaitingInLine] = () => Starter.gameMaker ? Starter.LocationEvents.waitingInLine() : Controls.CancelCreateGame.click() && Controls.JoinGameWindow.click();
Starter.locations[sdk.game.locations.JoinGame] = () => Starter.gameMaker ? Starter.LocationEvents.openCreateGameWindow() : Starter.LocationEvents.openJoinGameWindow();
Starter.locations[sdk.game.locations.Ladder] = () => Starter.gameMaker ? Starter.LocationEvents.openCreateGameWindow() : Starter.LocationEvents.openJoinGameWindow();
Starter.locations[sdk.game.locations.ChannelList] = () => Starter.gameMaker ? Starter.LocationEvents.openCreateGameWindow() : Starter.LocationEvents.openJoinGameWindow();
Starter.locations[sdk.game.locations.LobbyLostConnection] = () => {
	ControlAction.timeoutDelay("LostConnection", 3000);
	Controls.OkCentered.click();
};
Starter.locations[sdk.game.locations.GameDoesNotExist] = () => Starter.LocationEvents.gameDoesNotExist();
Starter.locations[sdk.game.locations.GameIsFull] = () => Starter.LocationEvents.openCreateGameWindow();
