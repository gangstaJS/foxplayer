var snapshotPrerolls = [], unit;

!function(window, document, vjs, undefined) {
	"use strict";

	var state = {}, 
		settings = {}, 
		player, 
		predictionCount = 3, 
		$player,
		$videoEl,
	
		// ads controls	
		skipBtnEl,
		addClickLayerEl;

  console.log('Changes set');

	function adsPreRolls(options) {
		player = this;
		settings = options;
    settings.postrollTimeout = 0;
    
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

    state.addErrors = 0;

    player.on('aderror', function() {
      var err = player.error();      

      // sendCustomStat({id: state.rollId, e: 'err', r: 0});

      if(err && (state.addErrors < 15)) {
        player.src(player.currentSrc());
        
        state.addErrors++;

        console.log('Try restore ads playback');
      } else {
        player.trigger('AdError');
        state.addErrors = 0;
        sendCustomStat({id: state.rollId, e: 'err', r: 0});
        adcanceled();
        console.log('AdError');
      }

    }); 

		player.on('adstart', function() {
    	this.volume(0.3);
		  // tryPrepareNextVast();
    }); 

		player.on('contentupdate', requestAds);

    	// if there's already content loaded, request an add immediately
    	if(player.currentSrc()) {
    	  requestAds();
    	}


    	player.on('readyforpreroll', function() { 		
    		if (!state.prerollPlayed) {
        		state.prerollPlayed = true;
        		if(state.adsMedia.apiFramework == 'VPAID') {
        			playVPAIDAd();
        		} else {
        			playAd();
        		}
       			
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

    player.on('adstop', adStop);

	}


	function adcanceled() {				
  	
  	player.adsvast.endTrecking();

  	// player.pause();
  	state.adPlaying = false;
  	state.prerollPlayed = false;
  	destructAdsControls();

  	if(settings.pre.length) {
      tryPrepareNextVast();
  	} else {
  		player.ads.endLinearAdMode();
  		createCookie('lastAds', getUnix());
    	settings.pre = snapshotPrerolls.slice();
  	}
    player.play();

    console.log('adcanceled');
  }

  function adStop() {
    // TODO 
  }

	function tryPrepareNextVast() {
		if(settings.pre.length && (predictionCount > 0)) {
			var deferred = parseFullVAST(settings.pre[0].url);//vastRequest(settings.pre[0].url);



			deferred.then(function(res) {
        // var xml = res;
        console.log(res);
				var media = res;//parseVast(res);
        // var xml = '';

				// if(state.adsMedia) {
          // try {
          //   xml = new XMLSerializer().serializeToString(res);
          //   console.log(xml);
          // } catch (e) {
          //   console.log(e.message);
          // }

          // console.log(media.src);
          // console.log(state.adsMedia.src);

					if((media.src == state.adsMedia.src) || !media.src) {
						predictionCount--;						
						state.hasNextVast = false;
						console.log('again try vast');

            sendCustomStat({id: 2, e: 'load', r: 1, src1: media.src + '@' + state.adsMedia.src, pc: predictionCount, src2: state.adsMedia.src});
						tryPrepareNextVast();
					} else if(media.src || media.src.length) {
						state.hasNextVast = true;
						state.nextVast = media;
						predictionCount = 3;
            sendCustomStat({id: 2, e: 'load', r: 0});
            player.trigger('adsnextroll');
					} else {
            state.hasNextVast = false;
          }
				// }
			});

      console.log('predictionCount', predictionCount);
		} else {
			settings.pre.shift();
			adcanceled();
			createCookie('lastAds', getUnix());
		}
	}

	// --

	function requestAds() {
		var shouldShowAds = false,
			lastAds = (getCookie('lastAds') || 0);

		if((getUnix() - lastAds) >= periodAds) { shouldShowAds = true; }

    var isFlashTech = $('#'+player.id()+'_flash_api').length ? 1 : 0;

		if(settings.pre.length && shouldShowAds && (player.pl.currentVideo.type !== 'audio') && !isFlashTech) {
			console.log('requestAds');
			var deferred;

			if(state.hasNextVast) { 
				console.log('hasNextVast');
				settings.pre = [];
				state.adsMedia = state.nextVast;
				state.hasNextVast = false;
				// player.one('playing', function() {
				// 	player.trigger('adsready');
				// });
				// player.trigger('adsready');
				// setTimeout(player.trigger.bind(player, 'adsready'), 200);
        state.rollId = 2;


        state.prerollPlayed = true;
        if(state.adsMedia.apiFramework == 'VPAID') {
        	playVPAIDAd();
        } else {
        	playAd();
        }

			} else {
				state.curAdInitData = settings.pre.shift();
				// deferred = vastRequest(state.curAdInitData.url);

				deferred = parseFullVAST(state.curAdInitData.url)

        state.rollId = 1;

				deferred.then(function(res) {
					console.log(res);
					state.adsMedia = res;
          sendCustomStat({id: 1, e: 'load', r: 0});
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
 		console.log('layer.ads.startLinearAdMode();');

 		state.firstQuartile = state.midpoint = state.thirdQuartile = true;

 		player.adsvast.startTrecking(state.adsMedia);
 		

 		sendCustomStat({id: state.rollId, e: 'start', r: 0});

 		state.adPlaying = true;



 		// setTimeout(player.pl._setVideoSource.bind(player, {type: state.adsMedia.type, src: state.adsMedia.src}), 1);
 		player.pl._setVideoSource({type: state.adsMedia.type, src: state.adsMedia.src});
 		
 		player.one('adloadedmetadata', function() {
 			player.trigger('AdImpression');
 			player.trigger('AdCreativeView');
 			player.trigger('AdStart');
 			player.removeClass('vjs-seeking');
 		  
 		  initAdsControls();
 		});
 		
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

  }

  function playVPAIDAd() {
  	// short-circuit if we don't have any ad inventory to play
 		if (!state.adsMedia || state.adsMedia.length === 0) {
 		  return;
 		}

 		// tell ads plugin we're ready to play our ad
 		player.ads.startLinearAdMode();

 		state.firstQuartile = state.midpoint = state.thirdQuartile = true;

 		player.adsvast.startTrecking(state.adsMedia);
 		

 		sendCustomStat({id: state.rollId, e: 'start', r: 0});

 		state.adPlaying = true;

 		//$player.css({width: (state.adsMedia.width || 780) + 'px', height: (state.adsMedia.height || 440)+'px'}/*, top: '300px', left: '200px' }*/);

		state.flashVPaid = new VPAIDFLASHClient(state.$VPAIDContainer.get(0), flashVPAIDWrapperLoaded);
 		
  }

	// --

	function vastRequest(vastURL, xhrFields) {
		if(xhrFields == undefined) {
			xhrFields = {withCredentials: true};
		}

    console.log('vastURL >>>', vastURL);
		return $.ajax({
			url: vastURL, 
			dataType: 'xml',
			xhrFields: xhrFields
		});
	}

	// --


	function parseFullVAST(url) {
		var defer = $.Deferred();

		vastRequest(url).promise().then(function(xml) {
			var $vast = $(xml), VASTAdTagURI = '', defferd, data;

			var hasWrapper = $vast.find('Ad Wrapper').length ? 1 : 0; 
	
			if(hasWrapper) {
				var VASTAdTagURI = $vast.find('Ad Wrapper VASTAdTagURI').text();
	
				vastRequest(VASTAdTagURI, {withCredentials: false}).promise().then(function(vastXml) {
					var $vastInWrapper = $(vastXml);
					var hasWrapperSecond = $vastInWrapper.find('Ad Wrapper').length ? 1 : 0;

					if(hasWrapperSecond) {
						var VASTAdTagURISecond = $vastInWrapper.find('Ad Wrapper VASTAdTagURI').text();

						vastRequest(VASTAdTagURISecond, {withCredentials: false}).promise().then(function(vastXml) {
								var $vastInWrapperSecond = $(vastXml);

								var $mediaFiles = $vastInWrapperSecond.find('MediaFiles MediaFile');


								state.$VPAIDContainer = $player.find('#vjs-vpaid-container');
								if(!state.$VPAIDContainer.length) {
									state.$VPAIDContainer = $('<div>', {id: 'vjs-vpaid-container'});
									$player.append(state.$VPAIDContainer);
								}
				
								data = {
									vastExtensions: getVastDataBlock($vast.find('Extensions Extension'), 'type'),
									vastEvents: getVastDataBlock($vast.find('TrackingEvents Tracking'), 'event'),
									vastClickThrough: $vast.find('VideoClicks ClickTracking').text(),
									vastImpression: $vast.find('Impression').text(),
    		  			  playerError: $vast.find('Error').text(),
									type: $mediaFiles.eq(0).attr('type'), 
									src: $mediaFiles.eq(0).text(),
									apiFramework: $mediaFiles.eq(0).attr('apiFramework'), 
									width: $mediaFiles.eq(0).attr('width'),
									height: $mediaFiles.eq(0).attr('height')
								};

								console.log(data);		
								defer.resolve(data);
		
						});
					} else {

						var $mediaFiles = $vastInWrapper.find('MediaFiles MediaFile');
		
						state.$VPAIDContainer = $player.find('#vjs-vpaid-container');
						if(!state.$VPAIDContainer.length) {
							state.$VPAIDContainer = $('<div>', {id: 'vjs-vpaid-container'});
							$player.append(state.$VPAIDContainer);
						}
		
						data = {
							vastExtensions: getVastDataBlock($vast.find('Extensions Extension'), 'type'),
							vastEvents: getVastDataBlock($vast.find('TrackingEvents Tracking'), 'event'),
							vastClickThrough: $vast.find('VideoClicks ClickTracking').text(),
							vastImpression: $vast.find('Impression').text(),
    		  	  playerError: $vast.find('Error').text(),
							type: $mediaFiles.eq(0).attr('type'), 
							src: $mediaFiles.eq(0).text(),
							apiFramework: $mediaFiles.eq(0).attr('apiFramework'), 
							width: $mediaFiles.eq(0).attr('width'),
							height: $mediaFiles.eq(0).attr('height')
						};
	
						console.log(data);
		
						defer.resolve(data);  

					}     
	
				});
	
	
			} else {
	
				var $mediaFiles = $vast.find('MediaFiles MediaFile');
		
				if($mediaFiles.length) {
					data = {
						vastExtensions: getVastDataBlock($vast.find('Extensions Extension'), 'type'),
						vastEvents: getVastDataBlock($vast.find('TrackingEvents Tracking'), 'event'),
						vastClickThrough: $vast.find('VideoClicks ClickThrough').text(),
						vastImpression: $vast.find('Impression').text(),
    		    playerError: $vast.find('Error').text(),
						type: $mediaFiles.eq(0).attr('type'), 
						src: $mediaFiles.eq(0).text(),
						apiFramework: $mediaFiles.eq(0).attr('apiFramework'),
						width: $mediaFiles.eq(0).attr('width'),
						height: $mediaFiles.eq(0).attr('height')
					};
		
					
					defer.resolve(data);
				}

				

			}

		});

		return defer.promise();

	}

	function flashVPAIDWrapperLoaded(err, success) {
  	if(err) return;

  	var adURL = state.adsMedia.src.trim();

  	console.log(adURL);

  	state.flashVPaid.loadAdUnit(adURL, function (error, adUnit) {
    	if (error) return;

    	unit = adUnit;

    	adUnit.handshakeVersion('2.0', initAd);
    	adUnit.on('AdLoaded', startAd);

    	adUnit.on('AdStarted', function (err, result) {
 					player.trigger('AdCreativeView');
    	});

    	adUnit.on('AdImpression', function (err, result) {
    	   player.trigger('AdImpression');
    	});

    	adUnit.on('AdVideoStart', function (err, result) {
    	   player.trigger('AdStart');
    	});

    	adUnit.on('AdVideoComplete', function (err, result) {
    	  player.trigger('AdComplete');
    	  adcanceled();
    	  // createCookie('lastAds', getUnix());
    	});

    	adUnit.on('AdUserClose', function (err, result) {
    	  player.trigger('AdSkiped');
    	  adcanceled();
    	});

    	adUnit.on('AdClickThru', function (err, result) {
    	   clickThrough();
    	   adcanceled();
    	   // createCookie('lastAds', getUnix());
    	});

    	adUnit.on('AdVideoFirstQuartile', function (err, result) {
    	   player.trigger('AdFirstQuartile');
    	});

    	adUnit.on('AdVideoMidpoint', function (err, result) {
    	   player.trigger('AdMidpoint');
    	});

    	adUnit.on('AdVideoThirdQuartile', function (err, result) {
    	   player.trigger('AdThirdQuartile');
    	});

    	// adUnit.on('AdStopped', function (err, result) {
    	//     player.trigger('AdComplete');
 				// 	if(cansel) adcanceled();
 				// 	cansel = true;
    	// });

			adUnit.on('AdError', function (err, result) {
    	   player.trigger('AdError');
    	});    	

    	    	

    	function initAd(err, result) {
    	    console.log('handShake', err, result);
    	    adUnit.initAd(800, 400, 'normal', -1, '', '', function (err) {
    	        console.log('initAd', err);
    	    });
    	}

    	function startAd(err, result) {
    	    adUnit.startAd(function (err, result) {

    	    });
    	}

    	// function checkAdProperties() {
    	//     adUnit.getAdIcons(function (err, result) {
    	//         console.log('getAdIcons', result);
    	//     });
    	//     adUnit.setAdVolume(10, function (err, result) {
    	//         console.log('setAdVolume', result);
    	//     });
    	//     adUnit.getAdVolume(function (err, result) {
    	//         console.log('getAdVolume', result);
    	//     });
    	// }

    });


  	// --

  }

	// --

	function getVastDataBlock(elems, attr) {
		var ext = {};
		elems.each(function(n,el) {
			var val = $(this).text();
			ext[$(this).attr(attr)] = isFinite(val) ? parseInt(val) : val;
		});

		return ext;
	}

	// --


  function initAdsControls() {
    try {
      skipBtnEl = $('<div>', {'class': 'vjs-ads-skip-btn vjs-ads-auto-create'});
      skipBtnEl.text('Пропустить>>');      
      player.el().appendChild(skipBtnEl.get(0));

      addClickLayerEl = $('<div>', {'class': 'vjs-ads-click-layer vjs-ads-auto-create'});
      player.el().appendChild(addClickLayerEl.get(0));
    } catch(e) { 
      console.warn('skipBtnEl', skipBtnEl);
      console.warn('addClickLayerEl', addClickLayerEl);
      console.warn(e.message); 
    }      

  	state.adsMedia.vastExtensions.skipTime = convertToSeconds(state.adsMedia.vastExtensions.skipTime);
  	if(state.adsMedia.vastExtensions.skipButton) { // проверяем разрешен ли скип рекламы.
  		if(state.adsMedia.vastExtensions.skipTime <= 0) { // показать скип кнопку сразу
        skipBtnEl.css('display', 'block');
  		} else {
  			player.on('timeupdate', checkSkip);
  		}


  		player.on(skipBtnEl.get(0), 'click', skipAds);

  	} else {
  		console.info('Skip button disable');
  	}


  	// проверяем кликабельный ли видео элемент рекламы
  	if(state.adsMedia.vastExtensions.isClickable) {
  		addClickLayerEl.html(state.adsMedia.vastExtensions.linkTxt);
  		player.on(addClickLayerEl.get(0), 'click', clickThrough);
  	} else {
  		console.info('isClickable disable');
  	}

  	player.on('timeupdate', checkTimes);


  	// --
  	
  }

  // --

  function destructAdsControls() {
  	try {
  		player.off(addClickLayerEl.get(0), 'click', clickThrough);

      $('.vjs-ads-auto-create').remove();

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
  	if(this.currentTime() >= state.adsMedia.vastExtensions.skipTime)
      skipBtnEl.css('display', 'block');
  }


  // --

  function skipAds() {
  	skipBtnEl.remove();
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

  // --

  function getUnix() {
  	return Math.floor((new Date()).getTime()/1000);
  }

  // --

  function sendCustomStat(params) {
    $.ajax({
      url: 'http://37.139.22.225:8007/stat',
      type: 'POST',
      dataType: 'text',
      data: params,
      success: function(res) {
        console.log('Custom stat', res);
      }
    });
  }


	vjs.plugin('adsPreRolls', adsPreRolls);


}(window, document, videojs);