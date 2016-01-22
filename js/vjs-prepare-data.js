// var snapshotPrerolls = [],
var unit, minuteBlockData = null, deferredMinuteBlock = null;

// ---

var REQUEST_URL = 'http://inv-nets.admixer.net/fs/dsp.aspx';

var requestJSON = {
    "id":"", 
    "imp": [
    {
      "id": "preroll1",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }, 

    {
      "id": "preroll2",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }, 

    {
      "id": "preroll3",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }, 

    {
      "id": "preroll4",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }, 

    {
      "id": "preroll5",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }, 

    {
      "id": "preroll6",
      "video": {"id": "b6f2f9a5-0ae3-439d-a494-65e8b4cff076", "pos": "1"},
      "ext": {"pl": "preroll", "pos": "1", "ct": "adult"}
    }],

    "ext": {
        "maxVideoDurationSec":62,
        "material": {
            "id" :"MaZjNUTPUW7Hhpw3mRjoc", "year":"2015"
        }
    }
};

var requestData = {
  callback: 'cbMixer',
  _: (new Date()).getTime(),
  data: JSON.stringify(requestJSON)
};

// ---

!function(window, document, vjs, undefined) {
    "use strict";

    var state = {},
        settings = {},
        player,
        predictionCount = 3,
        $player,
        $videoEl,

        PREROLLS_COUNT,
        AFTER_PAUSROLLS_COUNT,
        POST_ROLL_COUNT,

        ROLLS_PLAYED = 0,

        PREV_ADS_MINUTEBLOCK_DURATION = 0,

        // ads controls 
        skipBtnEl,
        adTiming,
        addClickLayerEl,
        allowMimeTypes = ['video/ogg', 'video/mp4', 'video/webm', 'application/x-shockwave-flash', 'text/html'],
        loadDataPromise;

    function adsPreRolls(options) {
        player = this;
        settings = options;

        if(player.pl.itemsCount == 1) {
          settings.postrollTimeout = 300;
        } else {
          settings.postrollTimeout = 0;
        }

        AFTER_PAUSROLLS_COUNT = settings.afterpaus.length;
        POST_ROLL_COUNT       = settings.post.length;

        PREROLLS_COUNT = settings.isMinuteBlock ? 1 : settings.pre.length;

        $player = $(player.el());
        $videoEl = $('#' + player.id() + '_html5_api');

        player.vastEventsTracking();
        player.ads(settings);

        if(!PREROLLS_COUNT) setTimeout(player.trigger.bind(player, 'adtimeout'), 0);

        // snapshotPrerolls = settings.pre.slice();

        player.controlBar.muteToggle.on('click', function() {
            if (state.adPlaying) {
                player.trigger(player.muted() ? 'AdMute' : 'AdUnmute');
            }
        });

        player.controlBar.playToggle.on('click', function() {
            if (state.adPlaying) {
                player.trigger(player.paused() ? 'AdPause' : 'AdResume');
            }
        });

        state.addErrors = 0;

        player.on('aderror', function() {
            var err = player.error();

            if (err && (state.addErrors < 15)) {
                player.src(player.currentSrc());

                state.addErrors++;

                console.log('Try restore ads playback');
            } else {
                player.trigger('AdError');
                state.addErrors = 0;

                // sendCustomStat({
                //     id: statId(),
                //     e: 'err',
                //     type: statType()
                // });

                player.trigger('ad:next');
                console.log('AdError');
            }

        });

        player.on('adstart', function() {
          var vol = 0.3;
          if(player.storage) {
            vol = player.storage.getItem('vol') || 0.3;
          }

          this.volume(0.3);
          player.trigger('volumechange');

          if(player.storage) {
            player.storage.setItem('vol', vol);
          }

        });

        player.on('contentupdate', function() {
            if(!player.currentSrc()) {
              goAd();
            }
        });

        if(player.currentSrc()) {
           goAd();
        }

        player.on('ad:next', function() {
          console.warn('ad:next');
          nextRoll(false);
        });


        player.on('ad:next-with-first-play', function() {
          nextRoll(true);
        });

        player.on('ad:cancel', adcanceled);


        player.on('readyforpreroll', beforePlayAd);

        player.on('setByIndex', function() {
            destructAdsControls();
        });

        player.on('livePause', playAfterPausRoll);

        player.on('pause', function() {
          if(/^ad\-/.test(player.ads.state)) return;
          createCookie('lastAfterPaus', getUnix());
        });

        player.on('contentended', playPostroll);

        // --

    }


    // start minute block
    function goAd() {

      if(settings.isMinuteBlock) {

        requestMixerMinuteBlock(REQUEST_URL, requestData);

        deferredMinuteBlock.then(function(res) {
  
          var minuteRolls = [];
  
          // admpresp={"status":"no data", "msg":""}
          if(res.status == 'no data') return;
  
          res.seatbid[0].bid.forEach(function(el,n) {
  
            try{
              
              minuteRolls.push({isString: true, url: el.adm})
  
            } catch(e) { console.warn(e.message); }
  
          });
  
          PREROLLS_COUNT = res.seatbid[0].bid.length;
  
          settings.pre = minuteRolls;
          
  
          console.log('settings.pre', settings.pre);        
  
          requestAds(++ROLLS_PLAYED, PREROLLS_COUNT, true);
  
        });

      } else {

        requestAds(++ROLLS_PLAYED, PREROLLS_COUNT, true);

      }

    }


    function nextRoll(firstPlay) {
      player.adsvast.endTrecking(); // important !

      var CUR = PREROLLS_COUNT;

      switch(state.currentTypeRoll) {
        case 'PRE-ROLL':
          CUR = PREROLLS_COUNT;
        break;
  
        case 'AFTER-PAUS-ROLL':
          CUR = AFTER_PAUSROLLS_COUNT;
        break;

        case 'POST-ROLL':
          CUR = POST_ROLL_COUNT;
        break;
      }

      requestAds(++ROLLS_PLAYED, CUR, firstPlay, state.currentTypeRoll);
    }

    function playAfterPausRoll() {
      if(/^ad\-/.test(player.ads.state)) return;

      requestAds(++ROLLS_PLAYED, AFTER_PAUSROLLS_COUNT, false, 'AFTER-PAUS-ROLL');

    }

    function playPostroll() {
      if((player.ads.state == 'postroll?') && (player.pl.itemsCount == 1)) {
        console.log('>>>>>>>>> playPostroll');
        requestAds(++ROLLS_PLAYED, POST_ROLL_COUNT, false, 'POST-ROLL');
      }
    }


    function adcanceled() {

        player.adsvast.endTrecking();

        // player.pause();
        state.adPlaying = false;
        state.prerollPlayed = false;
        destructAdsControls();
        player.ads.endLinearAdMode();

        state.prevRollMediaSrc = '';
        if(state.currentTypeRoll != 'POST-ROLL') {
          player.play();
        } else {
          player.pause();
        }

        ROLLS_PLAYED = 0;

        if(player.storage) {
          var vol = player.storage.getItem('vol') || 0.5;
          player.volume(vol);
        } else {
          player.volume(0.5);
        }

        console.log('adcanceled');
    }

    // --

    function isTimeForPreroll() {
      var lastAds = getCookie('lastAds') || 0;
      return ((getUnix() - lastAds) >= periodAds); // ? true : false;
    }

    // --

    function isTimeForAfterPausroll() {
      var lastAds = getCookie('lastAfterPaus') || 0;
      return ((getUnix() - lastAds) >= periodAfterPaus); // ? true : false;
    }

    // --

    function requestAds(numRoll, countRoll, firstPlay, type) {
        if (numRoll === undefined) numRoll = 0;
        if(type === undefined) type = 'PRE-ROLL';

        console.log('ROLLS_PLAYED', ROLLS_PLAYED-1);

        var shouldShowAds, rollsConf;

        switch(type) {
          case 'PRE-ROLL':
            shouldShowAds = true; //isTimeForPreroll();
            rollsConf = settings.pre;
          break;

          case 'POST-ROLL':
            shouldShowAds = true;
            rollsConf = settings.post;
          break;

          case 'AFTER-PAUS-ROLL':
            shouldShowAds = isTimeForAfterPausroll();
            rollsConf = settings.afterpaus;
          break;

          default:
            shouldShowAds = isTimeForPreroll();
            rollsConf = settings.pre;
          break;
        }

        state.currentTypeRoll = type;

        console.log(shouldShowAds, numRoll, countRoll);

        if(numRoll <= countRoll && shouldShowAds && (player.pl.currentVideo.type !== 'audio') && !isFlashTech() && !isMobileSafari()/* && !isSafari()*/) {

          console.log('numRoll', numRoll, rollsConf);
          var curRollXmlUrl = rollsConf[numRoll-1].url;
          var isString = rollsConf[numRoll-1].isString || false;
          state.prevRollMediaSrc = state.prevRollMediaSrc || '';

          // --

          // var intervalAdPlaying = setTimeout(function(){

          //   // loadDataPromise.reject('timeout ad');

          //   player.trigger('ad:next');

          // }, 2000);

          // --    

          loadDataPromise = parseFullVAST(curRollXmlUrl, isString);

          loadDataPromise.then(function(res) {

            console.log(res);    
            
            // clearTimeout(intervalAdPlaying);

            if(res.nobanner && (numRoll-1) <= 0) {
              
              console.log('ad:next-with-first-play');
              player.trigger('ad:next-with-first-play');
              return;

            } else if(res.nobanner && (numRoll-1) > 0) {
              
              console.log('ad:next');
              player.trigger('ad:next');
              return;

            }

            state.prevRollMediaSrc = res.media.src;
            state.adsMedia = res;           

            if(firstPlay) {
              player.trigger('adsready');
            } else {
              console.log('beforePlayAd');
              beforePlayAd();
            }

          }, function(reason) {
            console.log(reason);
          });

        } else {
          setTimeoutAds(numRoll, shouldShowAds);
          console.warn('ad:cancel');

          // setTimeout нужен для afterpaus рола, так как не корректно востанавливалсь позиция таймлайна;
           setTimeout(player.trigger.bind(player, 'ad:cancel'), 0);
        }
    }

    function beforePlayAd() {
      console.log('state.adsMedia', state.adsMedia);

      if (state.adsMedia.media.apiFramework == 'VPAID') {
          playVPAIDAd();
      } else {
          playAd();
      }
    }

    // detect flash follback
    function isFlashTech() {
        return $('#' + player.id() + '_flash_api').length ? 1 : 0;
    }

    function playAd() {
        if (!state.adsMedia) {
            return;
        }

        player.ads.startLinearAdMode();

        state.firstQuartile = state.midpoint = state.thirdQuartile = true;
        state.adPlaying = true;

        player.adsvast.startTrecking(state.adsMedia);

        

        player.pl._setVideoSource({
            type: state.adsMedia.media.type,
            src: state.adsMedia.media.src
        });

        player.one('adloadedmetadata', function() {
            player.trigger('AdImpression');
            player.trigger('AdCreativeView');
            player.trigger('AdStart');
            player.removeClass('vjs-seeking');

            destructAdsControls();
            initAdsControls();

            sendCustomStat({
                id: statId(),
                e: 'start',
                type: statType()
            });
        });

        player.one('adended', function() {
            player.trigger('AdComplete');
            player.trigger('ad:next');
        });

    }

    function setTimeoutAds(count, shouldShowAds) {
      switch(state.currentTypeRoll) {
        case 'PRE-ROLL':
          if(count >= PREROLLS_COUNT && shouldShowAds) createCookie('lastAds', getUnix());
        break;
  
        case 'AFTER-PAUS-ROLL':
          // if(count >= AFTER_PAUSROLLS_COUNT && shouldShowAds) createCookie('lastAfterPaus', getUnix());
        break;

        case 'POST-ROLL':
          // createCookie('lastAds', getUnix());
        break;
      }
    }


    function playVPAIDAd() {
        if (!state.adsMedia) {
            return;
        }

        player.pause();

        player.ads.startLinearAdMode();

        state.firstQuartile = state.midpoint = state.thirdQuartile = true;

        player.adsvast.startTrecking(state.adsMedia);

        state.adPlaying = true;

         if(state.adsMedia.media.type == 'text/html') {

          // state.htmlVPaid = new VPAIDHTML5Client(state.$VPAIDContainer.get(0), $videoEl.get(0), {});

          // state.htmlVPaid.loadAdUnit(state.adsMedia.media.src, onLoad);

          // function onLoad(err, adUnit) {
          //   if (err) return;
          //   console.log('adUnit', adUnit);
          // }

          var opt = {
            skipTime: 3, 
            adURL: state.adsMedia.vastClickThrough, 
            debug: true, 
            type: state.adsMedia.media.type
          };

          VPAIDHTML5mixer(state.adsMedia.media.src, player, '.vpaidContainer', opt)
          .then(function(unit) {
            // unit = unit;
            player.trigger('adsready');

            unit.on('AdStart', function(e) {
              player.trigger('AdStart');
              player.trigger('AdCreativeView');
              player.trigger('AdImpression');
            });

            player.trigger('AdSkiped');

            unit.on('AdComplete', function(e) {
              player.trigger('AdComplete');
              player.trigger('ad:next');
            });
    
            unit.on('AdComplete', function(e) {
              player.trigger('AdComplete');
              player.trigger('ad:next');
            });
  
            unit.on('AdSkipped',  function(e) {
              player.trigger('AdSkiped');
              player.trigger('ad:next');
            });

            unit.on('AdClickThrough',  function(e) {
              clickThrough();
              player.trigger('ad:next');
            });
  
            unit.on('AdStopped',  function(e) {
              player.trigger('ad:next');
            });

            unit.on('AdFirstQuartile',  function(e) {
              player.trigger('AdFirstQuartile');
            });

            unit.on('AdMidpoint',  function(e) {
              player.trigger('AdMidpoint');
            });

            unit.on('AdThirdQuartile',  function(e) {
              player.trigger('AdThirdQuartile');
            });

            unit.on('AdError',  function(e) {
              player.trigger('AdError');
            });
          
          });   


         } else if(state.adsMedia.media.type == 'application/x-shockwave-flash'){
          
          state.flashVPaid = new VPAIDFLASHClient(state.$VPAIDContainer.get(0), flashVPAIDWrapperLoaded);

         }       

    }

    // --

    function vastRequest(vastURL, xhrFields) {
        if (xhrFields == undefined) {
            xhrFields = {
                withCredentials: true
            };
        }

        console.warn('vastURL >>>', vastURL);
        return $.ajax({
            url: vastURL,
            dataType: 'xml',
            xhrFields: xhrFields
        });
    }

    // --


    function parseFullVAST(url, isString) {

      // var defer = $.Deferred();

      state.$VPAIDContainer = $player.find('#vjs-vpaid-container');

       if (!state.$VPAIDContainer.length) {
           state.$VPAIDContainer = $('<div>', {
               id: 'vjs-vpaid-container'
           });
           $player.append(state.$VPAIDContainer);
       }
      

      // return defer.promise();

      return vtj(url, isString);

    }

    function flashVPAIDWrapperLoaded(err, success) {
        if (err) return;

        var adURL = state.adsMedia.src.trim();

        console.log(adURL);

        state.flashVPaid.loadAdUnit(adURL, function(error, adUnit) {
            if (error) return;

            unit = adUnit;

            adUnit.handshakeVersion('2.0', initAd);
            adUnit.on('AdLoaded', startAd);

            adUnit.on('AdStarted', function(err, result) {
                player.trigger('AdCreativeView');
            });

            adUnit.on('AdImpression', function(err, result) {
                player.trigger('AdImpression');
            });

            adUnit.on('AdVideoStart', function(err, result) {
                player.trigger('AdStart');

                // sendCustomStat({
                //     id: statId(),
                //     e: 'start',
                //     type: statType()
                // });
            });

            adUnit.on('AdVideoComplete', function(err, result) {
                player.trigger('AdComplete');
                player.trigger('ad:next');
            });

            adUnit.on('AdUserClose', function(err, result) {
                player.trigger('AdSkiped');
                player.trigger('ad:next');
            });

            adUnit.on('AdClickThru', function(err, result) {
                clickThrough();
                player.trigger('ad:next');
            });

            adUnit.on('AdVideoFirstQuartile', function(err, result) {
                player.trigger('AdFirstQuartile');
            });

            adUnit.on('AdVideoMidpoint', function(err, result) {
                player.trigger('AdMidpoint');
            });

            adUnit.on('AdVideoThirdQuartile', function(err, result) {
                player.trigger('AdThirdQuartile');
            });

            // adUnit.on('AdStopped', function (err, result) {
            // });

            adUnit.on('AdError', function(err, result) {
                player.trigger('AdError');
            });



            function initAd(err, result) {
                console.log('handShake', err, result);
                adUnit.initAd(800, 400, 'normal', -1, '', '', function(err) {
                    console.log('initAd', err);
                });
            }

            function startAd(err, result) {
                adUnit.startAd(function(err, result) {

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

    function initAdsControls() {
        try {

            skipBtnEl = $('<div>', {
                'class': 'vjs-ads-skip-btn vjs-ads-auto-create'
            });

            skipBtnEl.text('Пропустить>>');

            player.el().appendChild(skipBtnEl.get(0));

            addClickLayerEl = $('<div>', {
                'class': 'vjs-ads-click-layer vjs-ads-auto-create'
            });

            // --

            if(state.currentTypeRoll == 'PRE-ROLL' && settings.isMinuteBlock) {

              adTiming = $('<div>', {
                'class': 'vjs-ads-duration vjs-ads-auto-create',
                'text': 'Реклама'
              });

              PREV_ADS_MINUTEBLOCK_DURATION = state.adsMedia.media.duration + PREV_ADS_MINUTEBLOCK_DURATION;

              player.el().appendChild(adTiming.get(0));
            }

            // --

            player.el().appendChild(addClickLayerEl.get(0));

        } catch (e) {
            console.warn('skipBtnEl', skipBtnEl);
            console.warn('addClickLayerEl', addClickLayerEl);
            console.warn(e.message);
        }

        try {
          state.adsMedia.vastExtensions.skipTime = state.adsMedia.media.duration > 10 ? 5 : 0;

          // state.adsMedia.vastExtensions.skipTime = convertToSeconds(state.adsMedia.vastExtensions.skipTime);
          
          if (state.adsMedia.vastExtensions.skipButton) { // проверяем разрешен ли скип рекламы.
              if (state.adsMedia.vastExtensions.skipTime <= 0) { // показать скип кнопку сразу
                  skipBtnEl.css('display', 'block');
              } else {
                  player.on('timeupdate', checkSkip);
              }  
  
              player.on(skipBtnEl.get(0), 'click', skipAds);
  
          } else {
              console.info('Skip button disable');
          }

        } catch(e) {
          console.log(e.message);
        }

        if(!state.adsMedia.vastExtensions.linkTxt) {
          state.adsMedia.vastExtensions.linkTxt = 'Перейти на сайт рекламодателя';
        }

        if(!state.adsMedia.vastExtensions.isClickable) {
          state.adsMedia.vastExtensions.isClickable = 1;
        }

        try {
          // проверяем кликабельный ли видео элемент рекламы
          if (state.adsMedia.vastExtensions.isClickable) {
              addClickLayerEl.html(state.adsMedia.vastExtensions.linkTxt);
              player.on(addClickLayerEl.get(0), 'click', clickThrough);
          } else {
              console.info('isClickable disable');
          }

        } catch(e) {
          console.warn(e.message);
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

        } catch (e) {
            console.log(e.message);
        }
    }

    // --

    function checkTimes() {
        var percenr = player.currentTime()/player.duration()*100;

        if ((percenr >= 25) && state.firstQuartile) {
            state.firstQuartile = false;
            player.trigger('AdFirstQuartile');
        }

        if ((percenr >= 50) && state.midpoint) {
            state.midpoint = false;
            player.trigger('AdMidpoint');
        }

        if ((percenr >= 75) && state.thirdQuartile) {
            state.thirdQuartile = false;
            player.trigger('AdThirdQuartile');
        }


        // --

        var dur = state.adsMedia.media.duration;

        var cur = Math.floor(player.currentTime());

        if(state.currentTypeRoll == 'PRE-ROLL' && settings.isMinuteBlock) {
          var res = (60 - 
            (
              PREV_ADS_MINUTEBLOCK_DURATION - dur + cur
            )
          );

          adTiming.text('Реклама '+ 
            (res ? res: 0)
          );
        }
    }

    // --

    function checkSkip() {
        if (this.currentTime() >= state.adsMedia.vastExtensions.skipTime)
            skipBtnEl.css('display', 'block');
    }


    // --

    function skipAds() {
        skipBtnEl.remove();
        
        // player.off('timeupdate', checkSkip);

        player.trigger('AdSkiped');
        
        player.trigger('ad:next');

    }

    function clickThrough() {
        player.trigger('AdClickThrough');
    }

    // --

    function convertToSeconds(time) {
        var seconds = 0;
        if (time) {
            if (isFinite(time)) return parseInt(time);

            var timesArr = time.split(':');
            if (timesArr.length) {
                if (timesArr.length == 2) {
                    // 00:00
                    seconds = parseInt(timesArr[0]) * 60 + parseInt(timesArr[1]);
                } else if (timesArr.length >= 3) {
                    // 00:00:00
                    seconds = (parseInt(timesArr[0]) * 3600) + (parseInt(timesArr[1]) * 60) + parseInt(timesArr[2]);
                }
            }
        }

        return seconds;
    }

    // --

    function getUnix() {
        return Math.floor((new Date()).getTime()/1000|0);
    }

    // --

    function statId() {
      return ROLLS_PLAYED-1;
    }

    function statType() {
      var type = 0;

      switch(state.currentTypeRoll) {
        case 'PRE-ROLL':
          type = 0;
        break;
  
        case 'AFTER-PAUS-ROLL':
          type = 1;
        break;

        case 'POST-ROLL':
          type = 2;
        break;
      }

      return type;
    }

    function sendCustomStat(params) {
        // $.ajax({
        //     url: 'http://213.133.191.35:8007/stat3',
        //     type: 'POST',
        //     dataType: 'text',
        //     data: params,
        //     success: function(res) {
        //         console.log('Custom stat', res);
        //     }
        // });
    }

    function isMobileSafari() {
      return navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/)
    }

    function isSafari() {
      return navigator.userAgent.indexOf("Safari") > -1;
    }

    // -- admixer

    function requestMixerMinuteBlock(url, param) {
      deferredMinuteBlock = $.Deferred();

      return $.ajax({
        url: url,
        type: 'get',
        dataType: 'script',
        data: param
      });
    }

    // ---

    vjs.plugin('adsPreRolls', adsPreRolls);


}(window, document, videojs);



function cbMixer(admpresp) {
  deferredMinuteBlock.resolve(admpresp);
}