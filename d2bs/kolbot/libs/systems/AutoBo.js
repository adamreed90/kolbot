/**
*  @filename    AutoBo.js
*  @author      theBGuy
*  @desc        Set up file for Auto Bo system. Boer who sits and rest of bots return to them to get bo when needed
*
*/

const AutoBo = {
	boers: {
		// the key to assiocate with the bo-er.
		// Config.BattleOrders.Boer = "helperA";
		"helperA": {
			character: "", // the name of the boer
			area: sdk.areas.CatacombsLvl2, // the location to get bo at
		},
		// Config.BattleOrders.Boer = "helperB";
		"helperB": {
			character: "", // the name of the boer
			area: sdk.areas.RiverofFlame, // the location to get bo at
		},
	},

	lastBo: 0, // @todo calc duration of the bo given so we can go get one before our current runs out

	haveHelper: function () {
		if (!Config.AutoBo.Boer) return false;
		let boHelper = Object.keys(AutoBo.boers).find(key => key.toLowerCase() === Config.AutoBo.Boer.toLowerCase());
		return boHelper ? AutoBo.boers[boHelper] : false;
	},

	getBo: function (preAct = me.act) {
		let myBoer = this.haveHelper();
		if (!myBoer || me.getState(sdk.states.BattleOrders)) return false;
		let boHelper = Misc.poll(() => Misc.findPlayerInArea(myBoer.area, myBoer.character), Time.seconds(1), 200);
		// game just started, delay a bit to see if they join
		if (!boHelper && getTickCount() - me.gamestarttime < Time.seconds(5) || !me.gameReady) {
			boHelper = Misc.poll(() => Misc.findPlayerInArea(myBoer.area, myBoer.character), Time.minutes(1), Time.seconds(1));
		}
		// still didn't find them so return and we will check again later
		if (!boHelper) return false;
		console.log("Found my BoHelper, going to go get my bo");
		// just in case we disable town chores so we don't end up in recursion
		try {
			Town.allowBoScriptCheck = false;
			Precast.enabled = false;
			Pather.useWaypoint(myBoer.area, true);
			let boer = Game.getPlayer(myBoer.character);
			boer && Pather.moveNearUnit(boer, 5);
			Misc.poll(() => me.getState(sdk.states.BattleOrders), Time.seconds(30), Time.seconds(1));
			delay(1000);
			console.log("Got bo-ed");
			// use wp back to town
			Pather.useWaypoint(sdk.areas.townOf(preAct), true);
		} catch (e) {
			console.error(e);
		} finally {
			Town.allowBoScriptCheck = true;
		}
		
		(me.act !== preAct || !me.inTown) && Town.goToTown(preAct);
		
		return true;
	}
};

