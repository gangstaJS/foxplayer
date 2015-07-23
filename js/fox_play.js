/**
	OZ@EX.UA
*/

(function(vjs) {
  'use strict';

  function pls(options, startIndex) {
    var player = this;
      player.pl = player.pl || {};

      if(startIndex !== undefined) player.pl.current = parseInt(startIndex);

    player.pl.items = options.playlist;
    player.pl.itemsCount = player.pl.items.length; 
    player.pl.currentVideo = player.pl.items[player.pl.current];
    player.$title = $(player.el()).find('.vjs-top-bar span');


      player.pl._updatePoster = function(posterURL) {
        player.poster(posterURL);
        // player.removeChild(player.posterImage);
        // player.posterImage = player.addChild("posterImage");
      };

      player.pl._setVideoSource = function(src/*, poster*/) {
        player.src(src);
        player.pl._updatePoster(options.cover.url);
        
      };

      // ------

      player.pl._resumeVideo = function() {

        player.one('loadstart',function() {
          player.play();
          player.posterImage.hide();
        });
      };

    player.pl._nextPrev = function(func){
        var comparison, addendum;

        if (func === 'next'){
          comparison = player.pl.itemsCount -1;
          addendum = 1;
        } else {
          comparison = 0;
          addendum = -1;
        }

        if (player.pl.current !== comparison){
          var newIndex = player.pl.current + addendum;
          player.pl._setVideo(newIndex);
        }
    };

    // -----------

    player.pl._setVideo = function(index){
      if (index <= player.pl.itemsCount){
        player.pl.current = index;
        player.pl.currentVideo = player.pl.items[index];
    
        if (!player.paused()){
          player.pl._resumeVideo();
        }

        // proc.startProccess(player.pl.currentVideo);
        player.$title.text(player.pl.currentVideo.title);
        
        if(player.pl.currentVideo.type == "audio") {
        	// player.pl.showPoster();

        	setTimeout(player.pl.showPoster.bind(this), 300);
        } else {
        	player.pl.hidePoster();
        }

        player.pl._setVideoSource(player.pl.currentVideo.src/*, player.pl.currentVideo.attr('poster')*/);
        
      }
    };

    player.pl.showPoster = function() {
    	player.posterImage.show();
    	$(player.posterImage.el()).show();
    	$(player.el()).find('.vjs-proxy-layer').show();
    };


    player.pl.hidePoster = function() {
    	player.posterImage.hide();
    	$(player.posterImage.el()).attr('style', '');
    	$(player.el()).find('.vjs-proxy-layer').hide();
    };

    // --------------

    player.pl._setVideo(player.pl.current);
  };


  // -------------------
  // -- public methods;

  vjs.Player.prototype.next = function(){
    //alert('next');
    this.pl._nextPrev('next');
    return this;
  };
  
  vjs.Player.prototype.prev = function(){
    this.pl._nextPrev('prev');
    return this;
  };
  
  vjs.Player.prototype.byIndex = function(index){
    this.pl._setVideo(index);
    return this;
  };


  vjs.plugin('playlist', pls);

})(videojs);

// --

/* videojs-hotkeys v0.2.5 - https://github.com/ctd1500/videojs-hotkeys */
!function(a,b){"use strict";a.videojs_hotkeys={version:"0.2.5"};var c=function(a){var b=this,c={volumeStep:.1,seekStep:5,enableMute:!0,enableFullscreen:!0,enableNumbers:!0};a=a||{};var d=a.volumeStep||c.volumeStep,e=a.seekStep||c.seekStep,f=a.enableMute||c.enableMute,g=a.enableFullscreen||c.enableFullscreen,h=a.enableNumbers||c.enableNumbers;b.el().hasAttribute("tabIndex")||b.el().setAttribute("tabIndex","-1"),b.on("play",function(){var a=b.el().querySelector(".iframeblocker");a&&""==a.style.display&&(a.style.display="block",a.style.bottom="39px")});var i=function(a){var c=a.which;if(b.controls()){var i=document.activeElement;if(i==b.el()||i==b.el().querySelector(".vjs-tech")||i==b.el().querySelector(".vjs-control-bar")||i==b.el().querySelector(".iframeblocker"))switch(c){case 32:a.preventDefault(),b.paused()?b.play():b.pause();break;case 37:a.preventDefault();var j=b.currentTime()-e;b.currentTime()<=e&&(j=0),b.currentTime(j);break;case 39:a.preventDefault(),b.currentTime(b.currentTime()+e);break;case 40:a.preventDefault(),b.volume(b.volume()-d);break;case 38:a.preventDefault(),b.volume(b.volume()+d);break;case 77:f&&b.muted(b.muted()?!1:!0);break;case 70:g&&(b.isFullscreen()?b.exitFullscreen():b.requestFullscreen());break;default:if((c>47&&59>c||c>95&&106>c)&&h){var k=48;c>95&&(k=96);var l=c-k;a.preventDefault(),b.currentTime(b.duration()*l*.1)}}}},j=function(a){if(b.controls()){var c=a.relatedTarget||a.toElement||document.activeElement;(c==b.el()||c==b.el().querySelector(".vjs-tech")||c==b.el().querySelector(".iframeblocker"))&&g&&(b.isFullscreen()?b.exitFullscreen():b.requestFullscreen())}};return b.on("keydown",i),b.on("dblclick",j),this};b.plugin("hotkeys",c)}(window,window.videojs);

// --

!function(vjs) {
	var $progressBar, $player, $tooltip;

	function tooltip() {
		var me = this;
		$player = $(this.el());
		$progressBar = $player.find('.vjs-progress-control');
		$fakeHolde = $('<div>', {'class': 'vjs-fake-progress-holder'});
		$tooltip = $('<div>', {'class': 'vjs-time-tooltip', text: '00:00:00'});
		$tooltipLine = $('<div>', {'class': 'vjs-line-tooltip'});

		$progressBar.append($tooltip, $tooltipLine, $fakeHolde);



		$progressBar.on('mouseout', function() {
			$tooltip.fadeOut();
			// me.off('timeupdate', updateTipLine);
		});

		// $progressBar.on('mouseenter', function() {
		// 	me.on('timeupdate', updateTipLine);
		// });


		function updateTipLine(e) {
			var offset = $progressBar.offset();
			var relativeX = (e.pageX - offset.left);
			var $playProgress = $(me.controlBar.progressControl.seekBar.playProgressBar.el());
			if(relativeX < $playProgress.width()) {
				$tooltipLine.css({'left': relativeX+2+'px', 'width': $playProgress.width()-relativeX+'px'});
			} else {
				$tooltipLine.css({'width': relativeX-$playProgress.width()+'px', 'left': $playProgress.width()+'px'});
			}

			// console.log(relativeX);
		}

		// ---

		$progressBar.on('mousemove', function(e) {
			$tooltip.show();

			updateTipLine(e);

			var offset = $(this).offset();
			var relativeX = (e.pageX - offset.left);
			
			$tooltip.css({left: relativeX+'px'});

			

			// var percent = (relativeX/($(this).width()/100))|0;
  	// 		var ti = (me.duration()/100*percent)|0;

  			var ti = relativeX/$(this).width() * me.duration();

			$tooltip.text(formatTime(ti, me.duration()));
		});

	}

	function formatTime(seconds, guide) {
		guide = guide || seconds;
		var s = Math.floor(seconds % 60),
		    m = Math.floor(seconds / 60 % 60),
		    h = Math.floor(seconds / 3600),
		    gm = Math.floor(guide / 60 % 60),
		    gh = Math.floor(guide / 3600);

		if (isNaN(seconds) || seconds === Infinity) {
		  h = m = s = '-';
		}
	
		h = (h > 0 || gh > 0) ? h + ':' : '';
		m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';
		s = (s < 10) ? '0' + s : s;
	
		return h + m + s;
	}

	vjs.plugin('tooltip', tooltip);

}(videojs);

// --


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

		// ---

		var down = false;		
		
		if(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
			me.controlBar.progressControl.on('touchstart', function() { down = true; });

			me.controlBar.progressControl.on('touchend', function() { down = false;  });

			me.controlBar.progressControl.on('touchmove', function(e) {
				if(down) {
					console.log(this.seekBar.update());
				}
			});
		} else {
			me.controlBar.progressControl.on('mousedown', function() { down = true; });

			me.controlBar.progressControl.on('mouseup', function() { down = false;  });	
	
			me.controlBar.progressControl.on('mousemove', function(e) {
				if(down) {
					console.log(this.seekBar.update());
				}
			});
		}

	});	

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
			if(conf.playlist.length > 1) {
				this.next();
			}
		});

	}

	return playerInstance;
};