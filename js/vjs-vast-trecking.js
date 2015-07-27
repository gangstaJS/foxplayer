!function(window, document, vjs, undefined) {
	"use strict";

	var settings, player, eventStat = {};

	

	var sendEvent = function(url) {
		$.ajax({url:url, type:'get', dataType:'text'});
	}

	// --

		

	function vastEventsTracking() {
		player = this;
		player.adsvast = player.adsvast || {};
	

		player.adsvast.startTrecking = function(events) {
			eventStat = events;
			// console.info('eventStat', eventStat);
			player.on('adskiped', player.adsvast.skiped);

			player.on('clickThrough', player.adsvast.clickThrough);
		}
	
		player.adsvast.endTrecking = function() {
			player.off('adskiped', player.adsvast.skiped);
			eventStat = {};
		}

		// --

		player.adsvast.skiped = function() {
			sendEvent(eventStat.skipAd);
		};

		player.adsvast.clickThrough = function() {
			window.open(eventStat.videoClicks);
			sendEvent(eventStat.addClick);
		};

	};

	// --

	vjs.plugin('vastEventsTracking', vastEventsTracking);

}(window, document, videojs);

/*
<Tracking event="creativeView">
<Tracking event="start">
<Tracking event="midpoint">
<Tracking event="firstQuartile">
<Tracking event="thirdQuartile">
<Tracking event="complete">
<Tracking event="mute">
<Tracking event="unmute">
<Tracking event="pause">
<Tracking event="rewind">
<Tracking event="resume">
<Tracking event="fullscreen">
<Tracking event="expand">
<Tracking event="collapse">
<Tracking event="acceptInvitation">
<Tracking event="close"></TrackingEvents>
*/