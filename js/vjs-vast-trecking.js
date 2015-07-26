!function(window, document, vjs, undefined) {
	"use strict";

	var settings, player;

	

	// var sendEvent = function(url) {
	// 	$.ajax({url:url, type:'get', dataType:'text'});
	// }

	// --

		

	function vastEventsTracking() {
		player = this;
		player.adsvast = player.adsvast || {};
	

		player.adsvast.startTrecking = function(events) {
			player.on('adskiped', player.adsvast.skiped);
		}
	
		player.adsvast.endTrecking = function() {
			player.off('adskiped', player.adsvast.skiped);
		}

		// --

		player.adsvast.skiped = function() {
			console.info('%cSkip send', 'color: #000; background-color: yellow; font-size: 18px');
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