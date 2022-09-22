/**
*  @filename    AutoBoScript.js
*  @author      theBGuy
*  @desc        Base script file for AutoBo system. Should be the first script in your list. Afterwards, the reciving characters will return for a bo
*               during townchores if their own has run out. While the giver will stay at the specified waypoint running the BoBarbHelper script
*
*/

function AutoBoScript () {
	const boMode = { Give: 0, Receive: 1 };
	const autoBoInfo = AutoBo.haveHelper();
	if (!autoBoInfo) throw new Error("No info found for AutoBo system. Cannot continue");
	// don't need to re-invent the wheel here for the boer
	if (Config.AutoBo.Mode === boMode.Give) {
		Config.BoBarbHelper.Wp = autoBoInfo.area;
		Loader.runScript("BoBarbHelper");
	} else if (Config.AutoBo.Mode === boMode.Receive) {
		// very first bo just uses BattleOrders script
		Config.BattleOrders.Mode = 1;
		Config.BattleOrders.Wp = autoBoInfo.area;
		try {
			Town.allowBoScriptCheck = false;
			Loader.runScript("BattleOrders", () => Config.AutoBo.AllowTownCheck = false);
		} finally {
			Town.allowBoScriptCheck = true;
		}
	}

	return true;
}
