!function(window, document, vjs, undefined) {
	"use strict";

	var settings, player, eventStat = {};

	

	var sendEvent = function(urlsArr) {
		if(urlsArr == undefined) return;
		if(typeof urlsArr == 'string') urlsArr = [urlsArr];
		
		var xhrFields = {withCredentials: false}, $body = $('body');

		$.each(urlsArr, function(n,url){			
			// $.ajax({
			// 	url:url, 
			// 	type:'get', 
			// 	dataType:'text',
			// 	xhrFields: xhrFields
			// });

			var $img = $('<img/>', {
				style:'width: 1px; height: 1px; border: 0;', 
				src:url, 
				alt:'trecking img'
			});

			$body.append($img);
			
			(function($i) {
				setTimeout(function() {
					$i.remove();
				},3000);
			})($img);

			
		});
	};

	// --		

	function vastEventsTracking() {
		player = this;
		player.adsvast = player.adsvast || {};

		var AdEvents = [
			'Skiped',
			'ClickThrough',
			'Impression',
			'CreativeView',
			'Start',
			'Unmute',
			'Mute',
			'Complete',
			'Pause',
			'Resume',
			'FirstQuartile',
			'Midpoint',
			'ThirdQuartile',
			'Error'
		];

		var style = 'font-size:13px; color: green;';
	

		player.adsvast.startTrecking = function(events) {
			eventStat = events;

			for(var j = 0, l = AdEvents.length; j<l; j++) {
				var eve = 'Ad' + AdEvents[j];
				player.on(eve, player.adsvast[eve]);
			}
		}
	
		player.adsvast.endTrecking = function() {

			for(var j = 0, l = AdEvents.length; j<l; j++) {
				var eve = 'Ad' + AdEvents[j];
				player.off(eve, player.adsvast[eve]);
			}

			eventStat = {};
		}

		// --

		player.adsvast.AdSkiped = function() {
			sendEvent(eventStat.vastExtensions.skipAd);
			sendEvent(eventStat.vastEvents.skip);
			console.log('%c AdSkiped', style);
		};

		player.adsvast.AdClickThrough = function() {
			window.open(eventStat.vastClickThrough);
			sendEvent(eventStat.addClick);
			console.log('%c AdClickThrough', style);
		};

		player.adsvast.AdImpression = function() {
			sendEvent(eventStat.vastImpression);
			console.log('%c AdImpression', style);
			console.log(eventStat.vastImpression);
		};

		player.adsvast.AdCreativeView = function() {
			sendEvent(eventStat.vastEvents.creativeView);
			console.log('%c AdCreativeView', style);
			console.log(eventStat.vastEvents.creativeView)
		};

		player.adsvast.AdStart = function() {
			sendEvent(eventStat.vastEvents.start);
			console.log('%c AdStart', style);
			console.log(eventStat.vastEvents.start);
		};

		player.adsvast.AdUnmute = function() {
			sendEvent(eventStat.vastEvents.unmute);
			console.log('%c AdUnmute', style);
		};

		player.adsvast.AdMute = function() {
			sendEvent(eventStat.vastEvents.mute);
			console.log('%c AdMute', style);
		};

		player.adsvast.AdComplete = function() {
			sendEvent(eventStat.vastEvents.complete);
			console.log('%c AdComplete', style);
		};

		player.adsvast.AdPause = function() {
			sendEvent(eventStat.vastEvents.pause);
			console.log('%c AdPause', style);
		};

		player.adsvast.AdResume = function() {
			sendEvent(eventStat.vastEvents.resume);
			console.log('%c AdResume', style);
		};

		player.adsvast.AdFirstQuartile = function() {
			sendEvent(eventStat.vastEvents.firstQuartile);
			console.log('%c AdFirstQuartile', style);
		};

		player.adsvast.AdMidpoint = function() {
			sendEvent(eventStat.vastEvents.midpoint);
			console.log('%c AdMidpoint', style);
		};

		player.adsvast.AdThirdQuartile = function() {
			sendEvent(eventStat.vastEvents.thirdQuartile);
			console.log('%c AdThirdQuartile', style);
		};

		player.adsvast.AdError = function() {
			sendEvent(eventStat.playerError);
			console.log('%c AdError', style + 'color:red;');
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