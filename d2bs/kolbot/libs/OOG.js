/**
*  @filename    OOG.js
*  @author      kolton, D3STROY3R, theBGuy
*  @desc        handle out of game operations like creating characters/accounts, maintaining profile datafiles, d2bot# logging etc.
*
*/
!isIncluded("Polyfill.js") && include("Polyfill.js");
!isIncluded("common/Util.js") && include("common/Util.js");

let sdk = require("./modules/sdk");
let Controls = require("./modules/Control");

includeOOGLibs();

const D2Bot = {
	handle: 0,
	copyDataObjFactory: function (profile, func = "", args = []) {
		return {
			profile: profile,
			func: func,
			args: args
		};
	},

	init: function () {
		let handle = DataFile.getStats().handle;
		(handle) && (this.handle = handle);

		return this.handle;
	},

	sendMessage: function (handle, mode, msg) {
		sendCopyData(null, handle, mode, msg);
	},

	printToConsole: function (msg, color, tooltip, trigger) {
		let printObj = {
			msg: msg,
			color: color || 0,
			tooltip: tooltip || "",
			trigger: trigger || ""
		};

		let obj = this.copyDataObjFactory(me.profile, "printToConsole", [JSON.stringify(printObj)]);

		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	printToItemLog: function (itemObj) {
		let obj = this.copyDataObjFactory(me.profile, "printToItemLog", [JSON.stringify(itemObj)]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	uploadItem: function (itemObj) {
		let obj = this.copyDataObjFactory(me.profile, "uploadItem", [JSON.stringify(itemObj)]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	writeToFile: function (filename, msg) {
		let obj = this.copyDataObjFactory(me.profile, "writeToFile", [filename, msg]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	postToIRC: function (ircProfile, recepient, msg) {
		let obj = this.copyDataObjFactory(me.profile, "postToIRC", [ircProfile, recepient, msg]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	ircEvent: function (mode) {
		let obj = this.copyDataObjFactory(me.profile, "ircEvent", [mode ? "true" : "false"]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	notify: function (msg) {
		let obj = this.copyDataObjFactory(me.profile, "notify", [msg]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	saveItem: function (itemObj) {
		let obj = this.copyDataObjFactory(me.profile, "saveItem", [JSON.stringify(itemObj)]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	updateStatus: function (msg) {
		let obj = this.copyDataObjFactory(me.profile, "updateStatus", [msg]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	updateRuns: function () {
		let obj = this.copyDataObjFactory(me.profile, "updateRuns", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	updateChickens: function () {
		let obj = this.copyDataObjFactory(me.profile, "updateChickens", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	updateDeaths: function () {
		let obj = this.copyDataObjFactory(me.profile, "updateDeaths", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	requestGameInfo: function () {
		let obj = this.copyDataObjFactory(me.profile, "requestGameInfo", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	restart: function (keySwap) {
		let obj = this.copyDataObjFactory(me.profile, "restartProfile", arguments.length > 0 ? [me.profile, keySwap] : [me.profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	CDKeyInUse: function () {
		let obj = this.copyDataObjFactory(me.profile, "CDKeyInUse", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	CDKeyDisabled: function () {
		let obj = this.copyDataObjFactory(me.profile, "CDKeyDisabled", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	CDKeyRD: function () {
		let obj = this.copyDataObjFactory(me.profile, "CDKeyRD", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	stop: function (profile, release) {
		!profile && (profile = me.profile);
		let obj = this.copyDataObjFactory(me.profile, "stop", [profile, release ? "True" : "False"]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	start: function (profile) {
		let obj = this.copyDataObjFactory(me.profile, "start", [profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	startSchedule: function (profile) {
		let obj = this.copyDataObjFactory(me.profile, "startSchedule", [profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	stopSchedule: function (profile) {
		let obj = this.copyDataObjFactory(me.profile, "stopSchedule", [profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	updateCount: function () {
		let obj = this.copyDataObjFactory(me.profile, "updateCount", ["1"]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	shoutGlobal: function (msg, mode) {
		let obj = this.copyDataObjFactory(me.profile, "shoutGlobal", [msg, mode]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	heartBeat: function () {
		let obj = this.copyDataObjFactory(me.profile, "heartBeat", []);
		//print("ÿc1Heart beat " + this.handle);
		sendCopyData(null, this.handle, 0xbbbb, JSON.stringify(obj));
	},

	sendWinMsg: function (wparam, lparam) {
		let obj = this.copyDataObjFactory(me.profile, "winmsg", [wparam, lparam]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	ingame: function () {
		this.sendWinMsg(0x0086, 0x0000);
		this.sendWinMsg(0x0006, 0x0002);
		this.sendWinMsg(0x001c, 0x0000);
	},

	// Profile to profile communication
	joinMe: function (profile, gameName, gameCount, gamePass, isUp) {
		let obj = {
			gameName: gameName + gameCount,
			gamePass: gamePass,
			inGame: isUp === "yes"
		};

		sendCopyData(null, profile, 1, JSON.stringify(obj));
	},

	requestGame: function (profile) {
		let obj = { profile: me.profile };
		sendCopyData(null, profile, 3, JSON.stringify(obj));
	},

	getProfile: function () {
		let obj = this.copyDataObjFactory(me.profile, "getProfile", []);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	setProfile: function (account, password, character, difficulty, realm, infoTag, gamePath) {
		let obj = this.copyDataObjFactory(me.profile, "setProfile", [account, password, character, difficulty, realm, infoTag, gamePath]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	setTag: function (tag) {
		let obj = this.copyDataObjFactory(me.profile, "setTag", [JSON.stringify(tag)]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	// Store info in d2bot# cache
	store: function (info) {
		this.remove();
		let obj = this.copyDataObjFactory(me.profile, "store", [me.profile, info]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	// Get info from d2bot# cache
	retrieve: function () {
		let obj = this.copyDataObjFactory(me.profile, "retrieve", [me.profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	},

	// Delete info from d2bot# cache
	remove: function () {
		let obj = this.copyDataObjFactory(me.profile, "delete", [me.profile]);
		sendCopyData(null, this.handle, 0, JSON.stringify(obj));
	}
};
