var snapshotPrerolls = [],
    unit;

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

        // ads controls 
        skipBtnEl,
        addClickLayerEl;

    function adsPreRolls(options) {
        player = this;
        settings = options;

        if(player.pl.itemsCount == 1) {
          settings.postrollTimeout = 300;
        } else {
          settings.postrollTimeout = 0;
        }

        PREROLLS_COUNT        = settings.pre.length;
        AFTER_PAUSROLLS_COUNT = settings.afterpaus.length;
        POST_ROLL_COUNT       = settings.post.length;

        $player = $(player.el());
        $videoEl = $('#' + player.id());

        player.vastEventsTracking();
        player.ads(settings);

        if(!PREROLLS_COUNT) setTimeout(player.trigger.bind(player, 'adtimeout'), 0);

        snapshotPrerolls = settings.pre.slice();

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
                sendCustomStat({
                    id: statId(),
                    e: 'err',
                    type: statType()
                });
                player.trigger('ad:next');
                console.log('AdError');
            }

        });

        player.on('adstart', function() {
            this.volume(0.3);
        });

        player.on('contentupdate', function() {
            requestAds(++ROLLS_PLAYED, PREROLLS_COUNT, true);
        });

        if(player.currentSrc()) {
            requestAds(++ROLLS_PLAYED, PREROLLS_COUNT, true);
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

        console.log('adcanceled');
    }

    // --

    function isTimeForPreroll() {
      var lastAds = getCookie('lastAds') || 0;
      return ((getUnix() - lastAds) >= periodAds) ? true : false;
    }

    // --

    function isTimeForAfterPausroll() {
      var lastAds = getCookie('lastAfterPaus') || 0;
      return ((getUnix() - lastAds) >= periodAfterPaus) ? true : false;
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

        if(numRoll <= countRoll && shouldShowAds && (player.pl.currentVideo.type !== 'audio') && !isFlashTech()) {

          console.log('numRoll', numRoll, rollsConf);
          var curRollXmlUrl = rollsConf[numRoll-1].url;
          state.prevRollMediaSrc = state.prevRollMediaSrc || '';

          // --

          var intervalAdPlaying = setTimeout(function(){
            player.trigger('ad:next');
          }, 2000);

          // --    

          loadAdData(state.prevRollMediaSrc, curRollXmlUrl).then(function(res) {

            console.log(res);    
            
            clearTimeout(intervalAdPlaying);

            if(res.nobanner &&
              ((numRoll-1) <= 0) 
              // &&
              // ( (type == 'PRE-ROLL') ||
              //   (type == 'POST-ROLL') ) 
            ) {
              console.log('ad:next-with-first-play');
              player.trigger('ad:next-with-first-play');
              return;
            } else if(res.nobanner && ((numRoll-1) > 0) ) {
              console.log('ad:next');
              player.trigger('ad:next');
            }

            state.prevRollMediaSrc = res.src;
            state.adsMedia = res;           

            if(firstPlay) {
              player.trigger('adsready');
            } else {
              console.log('beforePlayAd');
              beforePlayAd();
            }

          });

        } else {
          setTimeoutAds(numRoll, shouldShowAds);
          console.warn('ad:cancel');

          // setTimeout нужен для afterpaus рола, так как не корректно востанавливалсь позиция тайм алйна;
           setTimeout(player.trigger.bind(player, 'ad:cancel'), 0);
        }
    }

    function beforePlayAd() {
      if (state.adsMedia.apiFramework == 'VPAID') {
          playVPAIDAd();
      } else {
          playAd();
      }
    }


    function loadAdData(prevSrc, vastXmlUrl) {
      var deffer = $.Deferred();

      var d = parseFullVAST(vastXmlUrl);

      d.then(then);

      function then(data) {
        if(data.nobanner) {
          sendCustomStat({
              id: statId(),
              e: 'load',
              type: statType()
          });

          sendCustomStat({
                id: statId(),
                e: 'nobanner',
                type: statType()
          });

          deffer.resolve({nobanner: true});
          predictionCount = 3;
        } else {

          if(prevSrc == data.src && (predictionCount > 0)) {
            predictionCount--;
            
            d = parseFullVAST(vastXmlUrl);

            sendCustomStat({
                id: statId(),
                e: 'repeat',
                src1: prevSrc,
                src2: data.src,
                type: statType()
            });

            sendCustomStat({
                id: statId(),
                e: 'load',
                type: statType()
            });

            d.then(then);

          } else if(prevSrc == data.src && (predictionCount <= 0)) {
            sendCustomStat({
                id: statId(),
                e: 'load',
                type: statType()
            });

            deffer.resolve({nobanner: true});
            predictionCount = 3;

          } else {
            sendCustomStat({
                  id: statId(),
                e: 'load',
                type: statType()
            });

            deffer.resolve(data);
            predictionCount = 3;
          }
        }

      }

      return deffer.promise();

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
            type: state.adsMedia.type,
            src: state.adsMedia.src
        });

        player.one('adloadedmetadata', function() {
            player.trigger('AdImpression');
            player.trigger('AdCreativeView');
            player.trigger('AdStart');
            player.removeClass('vjs-seeking');

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

        state.flashVPaid = new VPAIDFLASHClient(state.$VPAIDContainer.get(0), flashVPAIDWrapperLoaded);

    }

    // --

    function vastRequest(vastURL, xhrFields) {
        if (xhrFields == undefined) {
            xhrFields = {
                withCredentials: true
            };
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
            var $vast = $(xml),
                VASTAdTagURI = '',
                defferd;

            if($vast.find('nobanner').length) {
              console.log('%c </nobanner>', 'font-size: 20px');
              defer.resolve({nobanner: true});
            } else {

              var data = {
                  // vastExtensions: [],
                  // vastEvents: [],
                  vastClickThrough: [],
                  vastImpression: [],
                  playerError: [],
  
                  type: '',
                  src: '',
                  apiFramework: '',
                  width: 0,
                  height: 0
              };
  
              data = mergeVastRes(data, $vast);
  
              var hasWrapper = $vast.find('Ad Wrapper').length ? 1 : 0;
  
              if (hasWrapper) {
                  var VASTAdTagURI = $vast.find('Ad Wrapper VASTAdTagURI').text();
  
                  console.log('%c HAS FIRST WRAPPER '+ VASTAdTagURI, 'font-size: 18px; color: blue');
  
                  vastRequest(VASTAdTagURI, {
                      withCredentials: false
                  }).promise().then(function(vastXml) {
                      var $vastInWrapper = $(vastXml);
  
                      if($vastInWrapper.find('nobanner').length) {
                        console.log('%c </nobanner>', 'font-size: 20px');
                        defer.resolve({nobanner: true});
                        
                        // return defer.promise();
                      }
  
                      data = mergeVastRes(data, $vastInWrapper);
  
                      var hasWrapperSecond = $vastInWrapper.find('Ad Wrapper').length ? 1 : 0;
  
                      if (hasWrapperSecond) {
  
                          var VASTAdTagURISecond = $vastInWrapper.find('Ad Wrapper VASTAdTagURI').text();
  
                          console.log('%c HAS SECOND WRAPPER '+ VASTAdTagURISecond, 'font-size: 18px; color: blue');
  
                          vastRequest(VASTAdTagURISecond, {
                              withCredentials: false
                          }).promise().then(function(vastXml) {
                              var $vastInWrapperSecond = $(vastXml);
  
                              if($vastInWrapperSecond.find('nobanner').length) {
                                console.log('%c </nobanner>', 'font-size: 20px');
                                defer.resolve({nobanner: true});                                
                                 // return defer.promise();
                              }
  
                              data = mergeVastRes(data, $vastInWrapperSecond);
  
                              state.$VPAIDContainer = $player.find('#vjs-vpaid-container');
                              if (!state.$VPAIDContainer.length) {
                                  state.$VPAIDContainer = $('<div>', {
                                      id: 'vjs-vpaid-container'
                                  });
                                  $player.append(state.$VPAIDContainer);
                              }
  
                              defer.resolve(data);
  
                          });
                      } else {
  
                        state.$VPAIDContainer = $player.find('#vjs-vpaid-container');
                        if (!state.$VPAIDContainer.length) {
                            state.$VPAIDContainer = $('<div>', {
                                id: 'vjs-vpaid-container'
                            });
                            $player.append(state.$VPAIDContainer);
                        }
                        console.log('NOT second wrapper', data);
                        defer.resolve(data);
                      }
  
                  });
  
  
              } else {
                defer.resolve(data);
              }

            } // 

        });

        return defer.promise();

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

                sendCustomStat({
                    id: statId(),
                    e: 'start',
                    type: statType()
                });
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

    function getVastDataBlock(obj, elems, attr) {
        // var ext = {};
        console.log('getVastDataBlock', arguments);
        elems.each(function(n, el) {
            var val = $(this).text();

            if(obj[$(this).attr(attr)]) {
              obj[$(this).attr(attr)].push( (isFinite(val) ? parseInt(val) : val) );
            } else {
              obj[$(this).attr(attr)] = [ (isFinite(val) ? parseInt(val) : val) ];
            }
        });

        return obj;
    }

    function mergeVastTags(arr, data) {
      if(!data.length) return arr;

      if(Object.prototype.toString.call(arr) === '[object Array]') {
        arr.push(data);
      } else {
        arr = [data];
      }

      return arr;
    }

    // --

    function mergeVastRes(data, $vast) {

      var $mediaFiles = $vast.find('MediaFiles MediaFile');

      if ($mediaFiles.length) {
        data.type = $mediaFiles.eq(0).attr('type'),
        data.src = $mediaFiles.eq(0).text(),
        data.apiFramework = $mediaFiles.eq(0).attr('apiFramework'),
        data.width = $mediaFiles.eq(0).attr('width'),
        data.height = $mediaFiles.eq(0).attr('height')
      }
  
      data.vastClickThrough = mergeVastTags(data.vastClickThrough, $vast.find('VideoClicks ClickThrough').text());
      data.vastClickThrough = mergeVastTags(data.vastClickThrough, $vast.find('VideoClicks ClickTracking').text()); 
      data.vastImpression = mergeVastTags(data.vastImpression, $vast.find('Impression').text());
      data.playerError = mergeVastTags(data.playerError,  $vast.find('Error').text());   

      data.vastExtensions = getVastDataBlock((data.vastExtensions || {}), $vast.find('Extensions Extension'), 'type');    
      data.vastEvents = getVastDataBlock((data.vastEvents || {}), $vast.find('TrackingEvents Tracking'), 'event');


      return data;
    }


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
            player.el().appendChild(addClickLayerEl.get(0));
        } catch (e) {
            console.warn('skipBtnEl', skipBtnEl);
            console.warn('addClickLayerEl', addClickLayerEl);
            console.warn(e.message);
        }

        state.adsMedia.vastExtensions.skipTime = convertToSeconds(state.adsMedia.vastExtensions.skipTime[0]);
        if (state.adsMedia.vastExtensions.skipButton[0]) { // проверяем разрешен ли скип рекламы.
            if (state.adsMedia.vastExtensions.skipTime <= 0) { // показать скип кнопку сразу
                skipBtnEl.css('display', 'block');
            } else {
                player.on('timeupdate', checkSkip);
            }


            player.on(skipBtnEl.get(0), 'click', skipAds);

        } else {
            console.info('Skip button disable');
        }


        // проверяем кликабельный ли видео элемент рекламы
        if (state.adsMedia.vastExtensions.isClickable[0]) {
            addClickLayerEl.html(state.adsMedia.vastExtensions.linkTxt[0]);
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
    }

    // --

    function checkSkip() {
        if (this.currentTime() >= state.adsMedia.vastExtensions.skipTime)
            skipBtnEl.css('display', 'block');
    }


    // --

    function skipAds() {
        skipBtnEl.remove();
        
        player.off('timeupdate', checkSkip);

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
        $.ajax({
            url: 'http://213.133.191.35:8007/stat3',
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