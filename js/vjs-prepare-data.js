!function(window, document, vjs, undefined) {
	"use strict";

	var state = {}, settings = {}, player, predictionCount = 5;

	function adsPrepareData(options) {
		player = this;
		settings = options;

		player.ads(settings);

		player.on('adstart', function() {
			$(this.el()).addClass('vjs-sda');
			// setTimeout(player.pl.hidePoster.bind(this), 100);
			tryPrepareNextVast();
    	});

    	player.on('adend', function() {
			$(this.el()).removeClass('vjs-sda');
			// if(player.pl.currentVideo.type == "audio") {
   //      		setTimeout(player.pl.showPoster.bind(this), 300);
   //      	}
    	});

		player.on('contentupdate', requestAds);
    	// if there's already content loaded, request an add immediately
    	// if (player.currentSrc()) {
    	//   requestAds();
    	// }	


    	player.on('readyforpreroll', function() {    				
    		if (!state.prerollPlayed) {
        		state.prerollPlayed = true;
       			playAd();
      		}
    	});	


    	player.on('adsnextroll', function() {				
    		requestAds();
    	});	
	};

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
						console.log('hes next vast', state.nextVast);
					}
				}
			});
		}
	}

	// --

	function requestAds() {
		if(settings.pre.length) {
			var deferred;

			if(state.hasNextVast) { 
				settings.pre = [];
				state.adsMedia = state.nextVast;
				predictionCount = 5;
				setTimeout(player.trigger.bind(player, 'adsready'), 100);
			} else {
				state.curAdInitData = settings.pre.shift();
				deferred = vastRequest(state.curAdInitData.url);

				$.when(deferred).done(function(res) {
					state.adsMedia = parseVast(res);
					player.trigger('adsready');
				});
			}
			
		} else {
			player.trigger('adscanceled');
			console.warn('Preroll is empty');
		}
	}

	// --

	function vastRequest(vastURL) {
		return $.ajax({url: vastURL, dataType: 'xml'});
	};

	// --

	function parseVast(xml) {
		var $vast = $(xml);
		var $mediaFiles = $vast.find('MediaFiles MediaFile');
		if($mediaFiles.length) {
			return {type: $mediaFiles.eq(0).attr('type'), src: $mediaFiles.eq(0).text()};
		}
		return undefined;		
	};

	// --

	function playAd() {

        // short-circuit if we don't have any ad inventory to play
        if (!state.adsMedia || state.adsMedia.length === 0) {
          return;
        }

        // tell ads plugin we're ready to play our ad
        player.ads.startLinearAdMode();
        state.adPlaying = true;

        // tell videojs to load the ad
        player.src(state.adsMedia);

        // when it's finished
        player.one('adended', function() {
          // play your linear ad content, then when it's finished ...
          player.ads.endLinearAdMode();
          this.pause();
          state.adPlaying = false;
          state.prerollPlayed = false;

          console.log('settings.pre', settings.pre.length);

          if(settings.pre.length) {
          	player.trigger('adsnextroll');
          } else {
          	this.play();
          }
        });

      };




	vjs.plugin('adsPrepareData', adsPrepareData);


}(window, document, videojs);