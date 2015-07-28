var snapshotPrerolls = [];

!function(window, document, vjs, undefined) {
	"use strict";

	var state = {}, 
		settings = {}, 
		player, 
		predictionCount = 5, 
		$player,
		$videoEl,
	
		// ads controls	
		$skipBtn,
		$addClickLayer;


	function adsPreRolls(options) {
		player = this;
		settings = options;
		$player = $(player.el());
		$videoEl = $('#'+player.id());

		player.vastEventsTracking();
		player.ads(settings);

		snapshotPrerolls = settings.pre.slice();


		player.controlBar.muteToggle.on('click', function() {
			if(state.adPlaying) {
				player.trigger( player.muted() ? 'AdMute' : 'AdUnmute' );
			}
		});

		player.controlBar.playToggle.on('click', function() {
			if(state.adPlaying) {
				player.trigger( player.paused() ? 'AdPause' : 'AdResume' );
			}
		});

		player.on('adstart', function() {
      		this.volume(0.3);
			tryPrepareNextVast();
    	}); 

		player.on('contentupdate', requestAds);

    	// if there's already content loaded, request an add immediately
    	if(player.currentSrc()) {
    	  requestAds();
    	};


    	player.on('readyforpreroll', function() { 		
    		if (!state.prerollPlayed) {
        		state.prerollPlayed = true;
       			playAd();
      		}
    	});	

    	player.on('adsnextroll', function() {			
    		requestAds();
    	});	

    	player.on('setByIndex', function() {			
    		destructAdsControls();
    	});	

    	// --

		player.on('adcanceled', adcanceled);	

	}


	function adcanceled() {				
    	player.ads.endLinearAdMode();
    	player.adsvast.endTrecking();

    	player.pause();
    	state.adPlaying = false;
    	state.prerollPlayed = false;
    	destructAdsControls();

    	if(settings.pre.length) {
    		player.trigger('adsnextroll');
    	} else {
    		createCookie('lastAds', getUnix());
      		settings.pre = snapshotPrerolls.slice();;
    		player.play();
    	}
    }

	function tryPrepareNextVast() {
		if(settings.pre.length && predictionCount) {
			var deferred = vastRequest(settings.pre[0].url);

			deferred.done(function(res) {
				var media = parseVast(res);
				if(state.adsMedia) {
					if(media.src == state.adsMedia.src) {
						predictionCount--;						
						state.hasNextVast = false;
						console.log('again try vast');
						tryPrepareNextVast();
					} else {
						state.hasNextVast = true;
						state.nextVast = media;
						// console.log('hes next vast', state.nextVast);
						predictionCount = 5;
					}
				}
			});
		}
	}

	// --

	function requestAds() {
		var shouldShowAds = false,
			lastAds = (getCookie('lastAds') || 0);

		if((getUnix() - lastAds) >= periodAds) { shouldShowAds = true; }

		console.log(settings.pre.length, shouldShowAds)

		if(settings.pre.length && shouldShowAds) {
			console.log('requestAds');
			var deferred;

			if(state.hasNextVast) { 
				console.log('hasNextVast');
				settings.pre = [];
				state.adsMedia = state.nextVast;
				state.hasNextVast = false;
				player.one('playing', function() {
					player.trigger('adsready');
				});
				// player.trigger('adsready');
				setTimeout(player.trigger.bind(player, 'adsready'), 200);
			} else {
				state.curAdInitData = settings.pre.shift();
				deferred = vastRequest(state.curAdInitData.url);

				$.when(deferred).done(function(res) {
					state.adsMedia = parseVast(res);
					player.trigger('adsready');
				});
			}
			
		} else {
			console.warn('Preroll is empty', settings.pre.length);
		}
	}

	// --

	function playAd() {

        // short-circuit if we don't have any ad inventory to play
        if (!state.adsMedia || state.adsMedia.length === 0) {
          return;
        }

        // tell ads plugin we're ready to play our ad
        player.ads.startLinearAdMode();

        state.firstQuartile = state.midpoint = state.thirdQuartile = true;

        player.adsvast.startTrecking(state.adsMedia);
        player.trigger('AdImpression');
        player.trigger('AdCreativeView');
        player.trigger('AdStart');

        state.adPlaying = true;

        setTimeout(player.pl._setVideoSource.bind(player, {type: state.adsMedia.type, src: state.adsMedia.src}), 100);
        initAdsControls();

        
        player.one('adended', function() {
        	player.trigger('AdComplete');
        	adcanceled();
        });

        // player.one('adended', function() {
        //   player.ads.endLinearAdMode();

        //   player.adsvast.endTrecking();

        //   this.pause();
        //   state.adPlaying = false;
        //   state.prerollPlayed = false;
        //   destructAdsControls();

        //   if(settings.pre.length) {
        //   	console.info('adsnextroll');
        //   	player.trigger('adsnextroll');
        //   } else {
        //   	createCookie('lastAds', getUnix());
        //   	settings.pre = snapshotPrerolls.slice();
        //   	this.play();
        //   }
        // });

      };

	// --

	function vastRequest(vastURL) {
		return $.ajax({url: vastURL, dataType: 'xml'});
	};

	// --

	function parseVast(xml) {
		var $vast = $(xml);
		var $mediaFiles = $vast.find('MediaFiles MediaFile');

		if($mediaFiles.length) {
			var data = {
				vastExtensions: getVastDataBlock($vast.find('Extensions Extension'), 'type'),
				vastEvents: getVastDataBlock($vast.find('TrackingEvents Tracking'), 'event'),
				vastClickThrough: $vast.find('VideoClicks ClickThrough').text(),
				vastImpression: $vast.find('Impression').text(),
				type: $mediaFiles.eq(0).attr('type'), 
				src: $mediaFiles.eq(0).text()
			};

			console.log(data);

			return data;
				
		}
		return undefined;		
	};

	// --

	function getVastDataBlock(elems, attr) {
		var ext = {};
		elems.each(function(n,el) {
			var val = $(this).text();
			ext[$(this).attr(attr)] = isFinite(val) ? parseInt(val) : val;
		});

		return ext;
	};

	// --


    function initAdsControls() {
      	$skipBtn = $('<div>', {'class': 'vjs-ads-skip-btn vjs-ads-auto-create', 'text': 'Пропустить>>'});
      	$addClickLayer = $('<div>', {'class': 'vjs-ads-click-layer vjs-ads-auto-create'});
		$player.append($skipBtn,$addClickLayer);

      	state.adsMedia.vastExtensions.skipTime = convertToSeconds(state.adsMedia.vastExtensions.skipTime);
      	if(state.adsMedia.vastExtensions.skipButton) { // проверяем разрешен ли скип рекламы.
      		if(state.adsMedia.vastExtensions.skipTime <= 0) { // показать скип кнопку сразу
      			$skipBtn.show();
      			player.one('adplay', checkSkip);
      		} else {
      			player.on('timeupdate', checkSkip);
      		}


      		$skipBtn.on('click', skipAds);

      	} else {
      		console.info('Skip button disable');
      	}


      	// проверяем кликабельный ли видео элемент рекламы
      	if(state.adsMedia.vastExtensions.isClickable) {
      		$addClickLayer.html(state.adsMedia.vastExtensions.linkTxt);
      		$addClickLayer.on('click', clickThrough);
      	} else {
      		console.info('isClickable disable');
      	}

      	player.on('timeupdate', checkTimes);


      	// --
      	
      }

      // --

      function destructAdsControls() {
      	try {
      		$addClickLayer.off('click', clickThrough);
      		$player.find('.vjs-ads-auto-create').remove(); // remove all ads controls;

      		player.off('timeupdate', checkSkip);  
      		player.off('timeupdate', checkTimes);    		

      	} catch(e) { console.log(e.message); }
      }


      // --

    function checkTimes() {
    	var dur = player.duration(),
    		curTime = this.currentTime(),
    		firstQuartile = dur/4,
    		midpoint      = dur/2,
    		thirdQuartile = dur/3;


    	if((curTime >= firstQuartile) && state.firstQuartile) {
    		state.firstQuartile = false;
    		player.trigger('AdFirstQuartile');
    	}

    	if((curTime >= midpoint) && state.midpoint) {
    		state.midpoint = false;
    		player.trigger('AdMidpoint');
    	}

    	if((curTime >= thirdQuartile) && state.thirdQuartile) {
    		state.thirdQuartile = false;
    		player.trigger('AdThirdQuartile');
    	}
    }

    // --

    function checkSkip() {
    	if(this.currentTime() >= state.adsMedia.vastExtensions.skipTime) $skipBtn.show();
    }


      // --

      function skipAds() {
      	$skipBtn.remove();
      	player.off('timeupdate', checkSkip);
      	player.trigger('AdSkiped');
      	player.trigger('adcanceled');
      	
      }

      function clickThrough() {
      	player.trigger('AdClickThrough');
      }

      // --

      function convertToSeconds(time) {
      	var seconds = 0;
      	if(time) {
      		if(isFinite(time)) return parseInt(time);

      		var timesArr = time.split(':');
      		if(timesArr.length) {
      			if(timesArr.length == 2) {
      				// 00:00
      				seconds = parseInt(timesArr[0])*60+parseInt(timesArr[1]);
      			} else if(timesArr.length >= 3) {
      				// 00:00:00
      				seconds = (parseInt(timesArr[0])*3600)+(parseInt(timesArr[1])*60)+parseInt(timesArr[2]);
      			}
      		}
      	}

      	return seconds;
      }

      function getUnix() {
      	return Math.floor((new Date()).getTime()/1000);
      }


	vjs.plugin('adsPreRolls', adsPreRolls);


}(window, document, videojs);