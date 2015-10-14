!function(window, document, vjs, undefined) {
	'use strict';

	function playerState() {
		var player = this, plugin = {};

		plugin.state = {
			firstQuartile: true,
			midpoint: true,
			thirdQuartile: true
		};

		player.on('loadedmetadata', function() {
			if(!/^ad\-/.test(player.ads.state)) {
				stat({e: 'loadedmetadata', contentType: player.pl.currentVideo.type});
			}
		});

		player.on('readyStat', function() {
			stat({e: 'load'});

			if(isMobile()) {
				stat({e: 'mobile'});
			}

			setTimeout(function() {
				
				if(isFlashTech()) {
					stat({e: 'flash'});
				} else {
					console.log('Not flash');
				}

			}, 0);
		});

		player.on('error', function() {
			var err;

			if(!/^ad\-/.test(player.ads.state)) {
				err = player.error();
				if(err && err.code)	stat({e: 'error', errorCode: err.code});
			}
		});

		player.on('close', function() {
			if(!/^ad\-/.test(player.ads.state)) {
				stat({e: 'close'});
			}
		});

		player.on('ended', function() {
			if(!/^ad\-/.test(player.ads.state)) {
				stat({e: 'complite'});
			}
		});

		player.on('timeupdate', function() {
			if(!/^ad\-/.test(player.ads.state)) {
				var percent = player.currentTime()/player.duration()*100;

				if((percent >= 25) && plugin.state.firstQuartile) {
					plugin.state.firstQuartile = false;
					stat({e: 'firstQuartile'});
				} else if((percent >= 50) && plugin.state.midpoint) {
					plugin.state.midpoint = false;
					stat({e: 'midpoint'});
				} else if((percent >= 75) && plugin.state.thirdQuartile) {
					plugin.state.thirdQuartile = false;
					stat({e: 'thirdQuartile'});
				}
			}
		});

		player.on('durationchange', function() {
			if(!/^ad\-/.test(player.ads.state)) {
				console.log('<<<<<<<< durationchange >>>>>>>>');

				plugin.state.firstQuartile = plugin.state.midpoint = plugin.state.thirdQuartile = true;
			}
		});


		function stat(params) {
			$.ajax({
				url: 'http://213.133.191.35:8007/stat2',
				type: 'POST',
				dataType: 'text',
				data: params,
				success: function(res) {
					console.log('%cplayer stat'+(JSON.stringify(params)),'color: blue;');
				}
			});
		}

		// detect flash follback
    	function isFlashTech() {
    	    return $('#' + player.id() + '_flash_api').length ? 1 : 0;
    	}

	}


	vjs.plugin('playerState', playerState);

}(window, document, videojs);