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
		$skipBtn;


	function adsPreRolls(options) {
		player = this;
		settings = options;
		$player = $(player.el());
		$videoEl = $('#'+player.id());

		player.vastEventsTracking();
		player.ads(settings);

		snapshotPrerolls = settings.pre.slice();

		// player.on('play', function() { 
		// 	if(this.currentTime() <= 3) {
		// 		requestAds()
		// 	}
			
		// });

		player.on('adstart', function() {
      		console.info('START ADS');
			// setTimeout(player.pl.hidePoster.bind(this), 200);
			tryPrepareNextVast();
    	});

    	// player.on('adend', function() {
    	// });  

		player.on('contentupdate', requestAds);
    	// if there's already content loaded, request an add immediately
    	// if(player.currentSrc()) {
    	//   requestAds();
    	// }	

    	// player.on('contentupdate', function() { alert(1); });


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

		player.on('adcanceled', function() {				
    		player.ads.endLinearAdMode();
        	player.adsvast.endTrecking();

        	this.pause();
        	state.adPlaying = false;
        	state.prerollPlayed = false;
        	destructAdsControls();

        	if(settings.pre.length) {
        		player.trigger('adsnextroll');
        	} else {
        		createCookie('lastAds', getUnix());
          		settings.pre = snapshotPrerolls.slice();;
        		this.play();
        	}
    	});	

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

			// console.log('state.adsMedia', state.adsMedia);
			
		} else {
			// player.trigger('adscanceled');

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

        player.adsvast.startTrecking(state.adsMedia.vastStats);

        state.adPlaying = true;

        // tell videojs to load the ad
        // player.src(state.adsMedia);
        setTimeout(player.pl._setVideoSource.bind(player, state.adsMedia), 100);
        // player.pl._setVideoSource(state.adsMedia);
        initAdsControls();

        // when it's finished
        player.one('adended', function() {
          // play your linear ad content, then when it's finished ...
          player.ads.endLinearAdMode();

          player.adsvast.endTrecking();

          this.pause();
          state.adPlaying = false;
          state.prerollPlayed = false;
          destructAdsControls();

          if(settings.pre.length) {
          	console.info('adsnextroll');
          	player.trigger('adsnextroll');
          } else {
          	createCookie('lastAds', getUnix());
          	settings.pre = snapshotPrerolls.slice();
          	this.play();
          }
        });

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
			return {
				vastStats: (getVastEvents($vast) || {}),
				type: $mediaFiles.eq(0).attr('type'), 
				src: $mediaFiles.eq(0).text(),
				skipButton: parseInt($vast.find('Extensions Extension[type=skipButton]').text()),
				skipTime: $vast.find('Extensions Extension[type=skipTime]').text(),
			};
		}
		return undefined;		
	};

	// --

	function getVastEvents(vast) {
		return {
			skipAd: vast.find('Extensions Extension[type=skipAd]').text(),
			addClick: vast.find('Extensions Extension[type=addClick]').text(),
			linkTxt:  vast.find('Extensions Extension[type=linkTxt]').text(),
			videoClicks: vast.find('VideoClicks ClickThrough').text()
		}
	}

	// --

	// setInterval(function() {
	// 	console.log(player.ads.state);
	// }, 100);


      function initAdsControls() {
      	$skipBtn = $('<div>', {'class': 'vjs-ads-skip-btn', 'text': 'Пропустить>>'});
		$player.append($skipBtn);

      	state.adsMedia.skipTime = convertToSeconds(state.adsMedia.skipTime);
      	if(state.adsMedia.skipButton) { // проверяем разрешен ли скип рекламы.
      		if(state.adsMedia.skipTime <= 0) { // показать скип кнопку сразу
      			$skipBtn.show();
      			player.one('adplay', checkSkip);
      		} else {
      			player.on('timeupdate', checkSkip);
      		}


      		$skipBtn.on('click', skipAds);

      	} else {
      		console.info('Skip button disable');
      	}

      	// ---

      	$videoEl.on('click', clickThrough);
      }

      // --

      function destructAdsControls() {
      	$skipBtn.remove();
      	player.off('timeupdate', checkSkip);
      	$videoEl.off('click', clickThrough);
      }


      // --

      function checkSkip() {
      	if(this.currentTime() >= state.adsMedia.skipTime) $skipBtn.show();
      }


      // --

      function skipAds() {
      	$skipBtn.remove();
      	player.off('timeupdate', checkSkip);
      	player.trigger('adskiped');
      	player.trigger('adcanceled');
      	
      }

      function clickThrough() {
      	player.trigger('clickThrough');
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