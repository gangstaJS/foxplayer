/**
  Playlist plugin for videojs 
  Author: oz@ex.ua
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
        if(posterURL == undefined) posterURL == player.poster();
        player.poster(posterURL);
      };

      player.pl._setVideoSource = function(src/*, poster*/) {
        player.src(src);
        player.pl._updatePoster(options.cover.url);
        
      };

      // ------

      player.pl._resumeVideo = function() {
        player.one('loadstart',function() {
          setTimeout(player.play.bind(player), 1000);
          // player.posterImage.hide();
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
    
        // if (!player.paused()){
        player.pl._resumeVideo();
        // }

        // proc.startProccess(player.pl.currentVideo);
        player.$title.text(player.pl.currentVideo.title);
        
        if(player.pl.currentVideo.type == "audio") {
        	setTimeout(player.pl.showPoster.bind(this), 300);
        } else {
        	player.pl.hidePoster();
        }

        player.pl._setVideoSource(player.pl.currentVideo.src/*, player.pl.currentVideo.attr('poster')*/);
        // setTimeout(player.play.bind(player), 3000);
        
      }
    };

    player.pl.showPoster = function() {
      // alert('poster show');
    	// player.posterImage.show();
      player.pl._updatePoster(options.cover.url);
    	$(player.posterImage.el()).show();
    	$(player.el()).find('.vjs-proxy-layer').show();
    };


    player.pl.hidePoster = function() {
      // alert('poster hide');
    	// player.posterImage.hide();
    	$(player.posterImage.el()).attr('style', '');
    	$(player.el()).find('.vjs-proxy-layer').hide();
    };

    // --------------

    player.pl._setVideo(player.pl.current);
  };


  // -------------------
  // -- public methods;

  vjs.Player.prototype.next = function(){
    // alert('next');
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