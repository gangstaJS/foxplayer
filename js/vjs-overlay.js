!function(window, document, vjs, undefined) {
	'use strict';

	var player = null, 
		OVERLAY_COUNT = 0, 
		OVERLAY_CURRENT_NUM = 0, 
		OVERLAY_URLS = [], 
		OVERLAY_TIMEOUT, 
		$player, 
		$overlayBlock,
		timeout,
		currentOverlayData;

	function overlay(overlayUrls) {
		if(overlayUrls == undefined) return;

		OVERLAY_URLS = overlayUrls;
		// OVERLAY_COUNT = overlayUrls.length;
		// OVERLAY_CURRENT_NUM = 0,
		player = this;
		$player = $(player.el());

		player.on('timeupdate', go);

		player.on('ad:overlayLoad', function() {
			sendEvent(currentOverlayData.vastEvents.creativeView);
		});

		player.on('ad:overlayClose', function() {
			sendEvent(currentOverlayData.vastEvents.close);
		});
		
	}

	function go() {
		if(/^ad\-/.test(player.ads.state)) return;
		
		var percenr = player.currentTime()/player.duration()*100;
		if(percenr >= 10) {
			requestOverlay(1, OVERLAY_URLS);
			player.off('timeupdate', go);
		}
	}

	function requestOverlay(current, urls) {
		if(current > urls.length) {
			console.log('Overlays is over');
			return;
		}

		vtj(urls[current-1].url).then(function(res) {
			currentOverlayData = res;

			console.log('overlay ' + (current-1)+ ' start', res);

			startShow(res, current);

			if(res.media.minSuggestedDuration) {
				timeout = setTimeout(function() {
					stopOverlay(current, 'ended', urls);				
				}, res.media.minSuggestedDuration*1000);
			}
		});
	}

	function startShow(overlayData, current) {
		buildOverlay(overlayData.media, overlayData.vastClickThrough, current);
	}

	function buildOverlay(media, clickURL, current) {
		var $clickableLayer, cssParam;
		var $close = $('<i/>', {'class': 'vjs-overlay-mixer-close', text: 'Закрыть'});
		$overlayBlock = $('<div/>', {'class': 'vjs-overlay-mixer'});

		cssParam = {
			height: media.height+'px',
		};

		if(media.scalable) {
			$overlayBlock.addClass('vjs-overlay-is-scalable');
		} else {
			cssParam.width = media.width+'px';
		}

		$overlayBlock.css(cssParam);

		if(media.type == 'text/html') {
			$clickableLayer = $('<div/>', {'class': 'vjs-overlay-clickable-layer'});
			var $iframe = $('<iframe/>', {src: media.src, scrolling: 'no', seamless: 'seamless'});
			$overlayBlock.append($iframe);

			$iframe.on('load', function() {
				$overlayBlock.append($close);
				player.trigger('ad:overlayLoad');
			});
		} else {
			$clickableLayer = $('<img/>', {'class': 'vjs-overlay-clickable-layer', src: media.src, alt: 'overlay image'}); 
			player.trigger('ad:overlayLoad');
			$overlayBlock.append($close);
		}

		$overlayBlock.append($clickableLayer);

		// --

		$clickableLayer.on('click', function() {
			window.open(clickURL);
			player.trigger('ad:overlayClick');
		});

		$close.on('click', function() {
			stopOverlay(current, 'close', OVERLAY_URLS);
			player.trigger('ad:overlayClose');
		});

		// --

		$player.append($overlayBlock);
	}

	function stopOverlay(current, reason, urls) {
		clearTimeout(timeout);

		$overlayBlock.remove();

		console.log('overlay ' + (current-1)+ ' end, reason: '+reason);

		requestOverlay(++current, urls);
	}

	function sendEvent(urlsArr) {
		if(urlsArr == undefined) return;
		if(typeof urlsArr == 'string') urlsArr = [urlsArr];
		
		var xhrFields = {withCredentials: false}, $body = $('body');

		$.each(urlsArr, function(n,url){
			var $img = $('<img/>', {
				style:'width: 1px; height: 1px; border: 0;', 
				src:url, 
				alt:'overlay img'
			});

			console.log('img tracking', url);

			$body.append($img);
			
			(function($i) {
				setTimeout(function() {
					$i.remove();
				},3000);
			})($img);

			
		});
	};


	vjs.plugin('overlay', overlay);

}(window, document, videojs);