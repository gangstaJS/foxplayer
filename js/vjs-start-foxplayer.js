/**
	OZ@EX.UA
*/
var periodAds = 120, periodAfterPaus = 60; // 300s == 5m	

// --


// setInterval(function() {
// 	lastAds = (getCookie('lastAfterPaus') || 0);
// 	var diff = (Math.floor((new Date()).getTime()/1000) - lastAds);

// 	var can = 0;

// 	if(diff <= periodAfterPaus) {
// 		can = periodAfterPaus-diff;
// 	}

// 	console.log("Следующий показ рекламы возможен через: "+ can + ' сек');
// }, 1000);

// ---

function initPlayer(node, conf, startIndex) {
	'use strict';

	videojs.options.flash.swf = "video-js.swf";

	if(typeof node === 'string') {
		node = $('#'+node);
	} else {
		node = $(node);
	}

	if(!node.length) {
		node = $('<video>', {"class": "video-js vjs-default-skin", controls: "controls", autoplay: "autoplay"});
		$('body').append(node);
	}

	conf.inactivityTimeout = 500;
	
	var playerInstance = videojs(node.get(0), {techOrder: conf.techOrder, inactivityTimeout: conf.inactivityTimeout, 'width': '780', 'height': '440'}).ready(function() {
		// this.poster(conf.cover.url);

		// width: 720px; height: 526px;
		var me = this, pX, pY, pW, pH, $p;

		me.storage = null;

		conf.adsOptions.isMinuteBlock = true;

		conf.adsOptions.pre = [
			// {url: 'ads.xml'},
			// {url: 'ads_nobanner.xml'},
			
			
			{url: 'http://inv-nets.admixer.net/dsp.aspx?rct=3&zone=b6f2f9a5-0ae3-439d-a494-65e8b4cff076&zoneInt=8362&sect=2166&site=2030&rnd=763821163'},
			// {url: 'https://oz.foxis.org/ads.php'},
			// {url: 'http://ads.adfox.ru/175105/getCode?p1=beygm&p2=emxn&pfc=a&pfb=a&plp=a&pli=a&pop=a'},
			// {url: 'http://inv-nets.admixer.net/dsp.aspx?rct=3&zone=94e7c35f-3fc5-4e3a-97c0-c69b0f1c769a&zoneInt=8839&sect=2009&site=1559&rnd=824260880'},
			// {url: 'ads2.xml'}
		];

		conf.adsOptions.afterpaus = [
			{url: 'ads.xml'},
			// {url: 'ads_wrapper.xml'}
		];

		conf.adsOptions.post = [
			{url: 'ads.xml'},
			// {url: 'ads_wrapper.xml'}
		];

		me.playerState();

		me.trigger('readyStat');		

		// --

		$p = $(this.el());

		var $top_bar = $('<div>', {'class': 'vjs-top-bar'});
		$top_bar.append('<span></span> <div><i class="vjs-collaps"></i><i class="vjs-close"></i><div>');
		$p.append($top_bar);

		setTimeout(function() { $p.focus(); }, 0);

		// --

		if(window.localStorage) {
			me.storage = window.localStorage;

			// pX = me.storage.getItem('pX');
			// pY = me.storage.getItem('pY');

			// pW = me.storage.getItem('pW');
			// pH = me.storage.getItem('pH');

			// pX = pX == null ? 100 : pX;
			// pY = pY == null ? 100 : pY;

			// // --

			// pW = me.storage.getItem('pW');
			// pH = me.storage.getItem('pH');

			// pW = pW == null ? 780 : pW;
			// pH = pH == null ? 440 : pH;

			// // --

			// $p.css({
			// 	top: pY+'px', 
			// 	left: pX+'px', 
			// 	width: pW+'px', 
			// 	height: pH+'px'
			// });
		} 		


		// при рпоигровании музыки пробрасываем через этот контейнер события на видеотег, так как его заслоняет постер;
		var $proxy_l = $('<div>', {'class': 'vjs-proxy-layer'});
		var $proxy_bottom_shadow = $('<div>', {'class': 'vjs-proxy-bottomshadow'});
		$p.find('.vjs-poster').after($proxy_l, $proxy_bottom_shadow);

		this.playlist(conf, startIndex);

		this.tooltip();

		this.hotkeys({
		  volumeStep: 0.1,
		  seekStep: 5,
		  enableMute: true,
		  enableFullscreen: true,
		  enableNumbers: true
		});

		$proxy_l.add($proxy_bottom_shadow).on('click', function() { me[(me.paused() ? 'play': 'pause')](); });

		$top_bar.find('.vjs-close').on('click', function() {
			me.trigger('close');
		});

		$top_bar.find('.vjs-collaps').on('click', function() {
			if(!me.paused() && (me.pl.currentVideo.type != 'audio')) me.pause();
			$p.hide();
			me.trigger('collapse');
		});

		me.on('open', function() {
			if(this.paused()) this.play();
			$(this.el()).show();
		});

		me.on("volumechange", function() {
			if(/^ad\-/.test(me.ads.state)) return;

      		if(me.storage) {
      			me.storage.setItem('vol', me.volume());
      		}
    	});

    	me.on('fullscreenchange', function() {
    		$p.resizable(me.isFullscreen() ? 'disable' : 'enable');
    		$p.draggable(me.isFullscreen() ? 'disable' : 'enable');
    	});

		if(me.storage) {
			var vol = me.storage.getItem('vol') || 0.5;
			me.volume(vol);
		} else {
			me.volume(0.5);
		}

		me.on('close', function() {
			this.dispose();
			// if(!me.paused()) me.pause();
			// $player.hide();
		});

		me.on('error', function() {
			var err = me.error();

			if(err && err.code == 4) {
				$(me.el()).removeClass('vjs-error');
				// if(me.ads && me.ads.state == 'content-playback') {
				// 	me.trigger('adcanceled');
				// 	console.log('try cansel ADS');
				// } else {
					// console.log('try play next');
					// if(conf.playlist.length > 1) me.next();
				// }
				
			} else {
				if(me.ads.state !== 'ad-playback') console.warn(err);
			}
		});

		me.on('play', function() { $(me.el()).removeClass('vjs-error'); });

		me.controlBar.muteToggle.on('click', function() {
			if((me.muted() && !me.volume()) || (!me.muted() && !me.volume())) {
				me.volume(0.25);
				me.muted(false);
				// setTimeout(me.volume.bind(me, 0.25), 1000);
			}
		});

		// --

		var playObj = {
		    from: 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26', 
		    to: 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28',
		    dur: '0.1s',
		    keySplines: '.4 0 1 1',
		    repeatCount: 1
		};
		
		
		var pausObj = {
		    from: 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28', 
		    to: 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26',
		    dur: '0.1s',
		    keySplines: '.4 0 1 1',
		    repeatCount: 1
		};

		var $playBtn = $(me.controlBar.playToggle.el());

		var svgPlayString = '<svg width="100%" height="100%" viewBox="0 0 36 36" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
    		    +'<path id="fox-play-svg" d="M 11 10 L 18 13.74 L 18 22.28 L 11 26 M 18 13.74 L 26 18 L 26 18 L 18 22.28">'        
    		        +'<animate attributeType="XML" attributeName="d" fill="freeze"></animate>'      
    		    +'</path>'
    		'</svg>';

    	$playBtn.append(svgPlayString);
    	
    	var svgAnim = $playBtn.find('svg animate');

		me.on('play', function() {
			svgAnim.attr(pausObj).get(0).beginElement();
		});

		me.on('pause', function() {
			svgAnim.attr(playObj).get(0).beginElement();
		});

		// me.on('setcontent', function() {

		// });

		// ---

		var down = false;		
		
		if(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
			me.controlBar.progressControl.on('touchstart', function() { down = true; });

			me.controlBar.progressControl.on('touchend', function() { down = false;  });

			me.controlBar.progressControl.on('touchmove', function(e) {
				if(down) {
					this.seekBar.update();
				}
			});

		} else {
			me.controlBar.progressControl.on('mousedown', function() { down = true; });

			me.controlBar.progressControl.on('mouseup', function() { down = false;  });	
	
			me.controlBar.progressControl.on('mousemove', function(e) {
				if(down) {
					this.seekBar.update();
				}
			});
		}

		// --

		if(conf.adsOptions.afterpaus.length || conf.adsOptions.pre.length) {
			me.adsPreRolls(conf.adsOptions);
		}


		$p.draggable({
			handle: '.vjs-top-bar',
			containment: "window",
			stop: function(e,ui) {
				if(me.storage) {
					me.storage.setItem('pX', ui.position.left);
					me.storage.setItem('pY', ui.position.top);
				}
			}
		});	

		$p.resizable({
			minWidth: 455, 
			minHeight: 225,

			stop: function(e,ui) {
				if(me.storage) {
					me.storage.setItem('pW', $p.width());
					me.storage.setItem('pH', $p.height());
				}
			}
		});


		// detect flash follback
    	function isFlashTech() {
        	return $('#' + me.id() + '_flash_api').length ? 1 : 0;
    	}

    	if(isFlashTech()) {
    		me.addClass('vjs-flash-tech');
    		// plugun for note flash follback
			this.flashNote();
    	} else {
    		me.removeClass('vjs-flash-tech');
    	}

	});	// end player ready

	var $player = $(playerInstance.el()).show(), $win = $(window);	
	$player.find('video').show();

	// $win.on('resize', function(event){
	// 	if($(event.target).hasClass('ui-resizable')) return;

	// 	var pW, pH, pX, pY, pos = $player.position(), setX, setY;

	// 	setX = pX;
	// 	setY = pY;

	// 	pW = $player.width();
	// 	pH = $player.height();

	// 	pX = pos.left;
	// 	pY = pos.top;

	// 	if((pX+pW) > $win.width()) {
	// 		setX = 20;
	// 		$player.css('left', setX+'px');
	// 	}

	// 	if((pY+pH) > $win.height()) {
	// 		setY = 20;
	// 		$player.css('top', setY+'px');
	// 	}

	// 	if(playerInstance.storage) {
	// 		playerInstance.storage.setItem('pX', setX);
	// 		playerInstance.storage.setItem('pY', setY);
	// 	}
	// });
	

	// playerInstance.userActive(true);

	if(conf.playlist.length > 1) {

		var plWarpper = playerInstance.createEl('div', {'className': 'vjs-pn-control'});
		var nextBtn = playerInstance.createEl('div', {'className': 'vjs-next-btn'});
		var prevBtn = playerInstance.createEl('div', {'className': 'vjs-prev-btn'});
		
		plWarpper.appendChild(prevBtn);
		plWarpper.appendChild(nextBtn);	
		$player.find('.vjs-fullscreen-control').before(plWarpper);	
	
	
		nextBtn.addEventListener('click', function() {
			playerInstance.next();
		}, false);
	
		prevBtn.addEventListener('click', function() {
			playerInstance.prev();
		}, false);
	
		playerInstance.on('ended', function() {
			console.log('ENDED');
			console.info('%c'+this.ads.state, 'color: #000; background-color: yellow; font-size: 18px');
			if(
				((conf.playlist.length > 1) && (this.ads.state == 'postroll?')) 
				// || !conf.adsOptions.pre.length
				) {

					if(!this.hasClass('vjs-last-playing')) {
						this.next();
						console.info('next media start');
					} else {
						setTimeout(function() {window.clearTimeout(playerInstance.ads._fireEndedTimeout)}, 0);
						console.log('Playlist complited');
					}		

			} else if((conf.playlist.length > 1) &&  (this.ads.state == 'content-playback')) {
				playerInstance.play();
			}
		});

		// var delay = 250,timer = null,clicks = 0;


		// me.on('mousedown', function(event) {
		// 	var self = this;

		//  	clicks++;

		//  	console.log(1);
		
		//  	if(clicks == 1) {
		//  	  timer = setTimeout(function(){
		//  	    clicks = 0;
		
		//  	    if (self.player().controls()) {
		//  	      if (self.player().paused()) {
		//  	        self.player().play();
		//  	      } else {
		//  	        self.player().pause();
		//  	      }
		//  	    }
		
		//  	  }, delay);
		//  	} else {
		//  	  clearTimeout(timer);
		//  	  clicks = 0;
		//  	}
		// });

		// playerInstance.on('adtimeout', function() {
		// 	console.info('%c'+this.ads.state, 'color: #000; background-color: green; font-size: 18px');
		// });

	}

	return playerInstance;
}

// ---

function createCookie(name, value, days) {
	var expires = "";
	if(days) {
		var date = new Date();
		date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
		expires = "; expires=" + date.toGMTString();
	}

	var host = window.location.host;

	if(/(:\d+)/.test(window.location.host)) {
		host = window.location.host.split(':')[0];
	}
	
	document.cookie = name + "=" + value + expires + ";domain="+ host +";path=/";
}

function getCookie(c_name) {
	if(document.cookie.length > 0) {
		c_start = document.cookie.indexOf(c_name + "=");
		if(c_start != -1) {
			c_start = c_start + c_name.length + 1;
			c_end = document.cookie.indexOf(";", c_start);
			if(c_end == -1) {
				c_end = document.cookie.length;
			}
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return "";
}

function isMobile() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}