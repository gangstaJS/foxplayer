/**
  Progress-tooltip plugin for videojs 
  Author: oz@ex.ua
*/


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



		// $progressBar.on('mouseout', function() {
		// 	$tooltip.fadeOut();
		// 	// me.off('timeupdate', updateTipLine);
		// });

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
			// $tooltip.show();

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