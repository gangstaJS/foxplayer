/**
	OZ@EX.UA
*/


function initPlayer(node, conf, startIndex) {
	'use strict';

	videojs.options.flash.swf = "video-js.swf";

	var shouldShowAds = true;
	var lastTime = (new Date()).getTime();
	var periodAds = 300; // 300s == 5m	

	if(typeof node === 'string') {
		node = $('#'+node);
	} else {
		node = $(node);
	}

	if(!node.length) {
		node = $('<video>', {"class": "video-js vjs-default-skin", controls: "controls", autoplay: "autoplay"});
		$('body').append(node);
	}
	
	var playerInstance = videojs(node.get(0), {/*techOrder: ['flash'], */'width': '780', 'height': '440'}).ready(function() {
		// this.poster(conf.cover.url);
		var me = this;

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

		me.on('close', function() {
			this.dispose();
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
		    dur: '0.2s',
		    keySplines: '.4 0 1 1',
		    repeatCount: 1
		};
		
		
		var pausObj = {
		    from: 'M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28', 
		    to: 'M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26',
		    dur: '0.2s',
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

		var adsOptions = {
			'pre': [
				{url: 'http://ads.adfox.ru/175105/getCode?p1=bsyyj&p2=emxn&pfc=a&pfb=a&plp=a&pli=a&pop=a&puid1=&puid2=&puid3=&puid22=&puid25=&puid27=&puid31=&puid33=&puid51=&puid52='},
				{url: 'http://ads.adfox.ru/175105/getCode?p1=bsyyk&p2=emxn&pfc=a&pfb=a&plp=a&pli=a&pop=a&puid1=&puid2=&puid3=&puid22=&puid25=&puid27=&puid31=&puid33=&puid51=&puid52='}
			],

			debug: true,
			timeout: 5000,
			// prerollTimeout: 1000
		};

		// me.ads(adsOptions);
		me.adsPreRolls(adsOptions);


	});	// end player ready

	var $player = $(playerInstance.el()).show();	
	$player.find('video').show();


	$player.draggable({
		handle: '.vjs-top-bar',
		create: function( event, ui ) {
			$player.css({top: ($(window).height()-$player.height())/2+'px', left: ($(window).width()-$player.width())/2+'px'});
		},
		scroll: false,
		containment: "parent"
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
			if((conf.playlist.length > 1) && (this.ads.state != 'content-playback')) {
				this.next();
				console.info('next media start');
			}
		});

	}

	return playerInstance;
};