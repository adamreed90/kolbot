/**
*  @filename    DataFile.js
*  @author      theBGuy
*  @desc        DataFile functions
*
*/

const DataFile = {
	create: function () {
		let obj = {
			runs: 0,
			experience: 0,
			deaths: 0,
			lastArea: "",
			gold: 0,
			level: 0,
			name: "",
			gameName: "",
			ingameTick: 0,
			handle: 0,
			nextGame: ""
		};

		let string = JSON.stringify(obj);

		Misc.fileAction("data/" + me.profile + ".json", 1, string);

		return obj;
	},

	getObj: function () {
		!FileTools.exists("data/" + me.profile + ".json") && DataFile.create();
		
		let obj;
		let string = Misc.fileAction("data/" + me.profile + ".json", 0);

		try {
			obj = JSON.parse(string);
		} catch (e) {
			// If we failed, file might be corrupted, so create a new one
			obj = this.create();
		}

		if (obj) {
			return obj;
		} else {
			print("Error reading DataFile. Using null values.");
			return {runs: 0, experience: 0, lastArea: "", gold: 0, level: 0, name: "", gameName: "", ingameTick: 0, handle: 0, nextGame: ""};
		}
	},

	getStats: function () {
		let obj = this.getObj();
		return Misc.clone(obj);
	},

	updateStats: function (arg, value) {
		while (me.ingame && !me.gameReady) {
			delay(100);
		}

		let statArr = [];

		typeof arg === "object" && (statArr = arg.slice());
		typeof arg === "string" && statArr.push(arg);

		let obj = this.getObj();

		for (let i = 0; i < statArr.length; i += 1) {
			switch (statArr[i]) {
			case "experience":
				obj.experience = me.getStat(sdk.stats.Experience);
				obj.level = me.getStat(sdk.stats.Level);

				break;
			case "lastArea":
				if (obj.lastArea === Pather.getAreaName(me.area)) {
					return;
				}

				obj.lastArea = Pather.getAreaName(me.area);

				break;
			case "gold":
				if (!me.gameReady) {
					break;
				}

				obj.gold = me.getStat(sdk.stats.Gold) + me.getStat(sdk.stats.GoldBank);

				break;
			case "name":
				obj.name = me.name;

				break;
			case "ingameTick":
				obj.ingameTick = getTickCount();

				break;
			case "deaths":
				obj.deaths = (obj.deaths || 0) + 1;

				break;
			default:
				obj[statArr[i]] = value;

				break;
			}
		}

		let string = JSON.stringify(obj);

		Misc.fileAction("data/" + me.profile + ".json", 1, string);
	}
};

const ShitList = {
	create: function () {
		let obj = { shitlist: [] };
		let string = JSON.stringify(obj);
		Misc.fileAction("shitlist.json", 1, string);

		return obj;
	},

	getObj: function () {
		let obj;
		let string = Misc.fileAction("shitlist.json", 0);

		try {
			obj = JSON.parse(string);
		} catch (e) {
			obj = this.create();
		}

		if (obj) return obj;
		console.warn("Failed to read ShitList. Using null values");

		return {shitlist: []};
	},

	read: function () {
		!FileTools.exists("shitlist.json") && this.create();
		let obj = this.getObj();

		return obj.shitlist;
	},

	add: function (name) {
		let obj = this.getObj();
		obj.shitlist.push(name);

		let string = JSON.stringify(obj);
		Misc.fileAction("shitlist.json", 1, string);
	}
};
