/**
*  @filename    CloneKilla.js
*  @author      kolton
*  @desc        Kill Diablo Clone when he walks in game. Uses Fire Eye location.
*
*/
include("json2.js");
include("NTItemParser.dbl");
include("OOG.js");
include("automule.js");
include("craftingsystem.js");
include("gambling.js");
include("torchsystem.js");
include("mulelogger.js");
include("common/util.js");
includeCommonLibs();
includeSystemLibs();

function main() {
	D2Bot.init();
	Config.init();
	Pickit.init();
	Attack.init();
	Storage.Init();
	CraftingSystem.buildLists();
	Runewords.init();
	Cubing.init();
	include("bots/KillDclone.js");

	if (typeof KillDclone === "function") {
		try {
			D2Bot.printToConsole("Trying to kill DClone.", sdk.colors.D2Bot.DarkGold);
			KillDclone.call();
		} catch (e) {
			Misc.errorReport(e, "CloneKilla.js");
		}
	}

	quit();

	return true;
}
