/**
	OZ@EX.UA
*/
var periodAds = 300; // 300s == 5m	

// --


// setInterval(function() {
// 	lastAds = (getCookie('lastAds') || 0);
// 	var diff = (Math.floor((new Date()).getTime()/1000) - lastAds);

// 	var can = 0;

// 	if(diff <= periodAds) {
// 		can = periodAds-diff;
// 	}

// 	$('#time_log').text("Следующий показ рекламы возможен через: "+ can + ' сек');
// }, 500);

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
	
	var playerInstance = videojs(node.get(0), {techOrder: conf.techOrder, 'width': '780', 'height': '440'}).ready(function() {
		// this.poster(conf.cover.url);
		var me = this;

		me.storage = null;

		if(window.localStorage) me.storage = window.localStorage;

		var $top_bar = $('<div>', {'class': 'vjs-top-bar'});
		$top_bar.append('<span></span> <div><i class="vjs-collaps"></i><i class="vjs-close"></i><div>');
		var $p = $(this.el());
		$p.append($top_bar);

		$p.resizable({minWidth: 455, minHeight: 225});


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
			me.dispose();
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
      		console.log(me.volume());
      		if(me.storage) {
      			me.storage.setItem('vol', me.volume());
      		}
    	});

		if(me.storage) {
			var vol = me.storage.getItem('vol') || 0.5;
			me.volume(vol);
		} else {
			me.volume(0.5);
		}

		me.on('close', function() {
			this.dispose();
		});

		me.on('error', function() {
			var err = me.error();

			console.log('Error NOT ADS');

			if(err && err.code == 4) {
				// if(me.ads && me.ads.state == 'content-playback') {
				// 	me.trigger('adcanceled');
				// 	console.log('try cansel ADS');
				// } else {
					console.log('try play next');
					if(conf.playlist.length > 1) me.next();
				// }
				
			} else {
				console.log(err);
			}
		});

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

		if(conf.adsOptions.pre && conf.adsOptions.pre.length) {
			me.adsPreRolls(conf.adsOptions);
		}
		


	});	// end player ready

	var $player = $(playerInstance.el()).show();	
	$player.find('video').show();


	$player.draggable({
		handle: '.vjs-top-bar',
		containment: "window"
	});

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
			console.info('%c'+this.ads.state, 'color: #000; background-color: yellow; font-size: 18px');
			if(
				((conf.playlist.length > 1) && (this.ads.state == 'postroll?')) ||
				!conf.adsOptions.pre.length
				) {
				this.next();
				console.info('next media start');
			}
		});

	}

	return playerInstance;
};

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