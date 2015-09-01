var player_conf = {
	cover: {url: 'http://i.ytimg.com/vi/J3r-ct0haZg/hqdefault.jpg'},
	playlist: [
		{ "title": "jailhouse rock", "type": "video", "src": "http://www.ex.ua/get/188754030"}, 
		// { "title": "Guns N' Roses - November Rain", "type": "video", "src": "data/november_rain.720.mp4" },
		{ "title": "My", "type": "audio", "src": "http://www.ex.ua/test_player/data/my.mp3"},
		{ "title": "jailhouse rock", "type": "video", "src": "http://www.ex.ua/test_player/data/jailhouse.mp4"}
	],
	techOrder: ['html5'],
	adsOptions: {
		'pre': [
			// {url: 'http://ads.adfox.ru/175105/getCode?p1=bsyyj&p2=emxn&pfc=a&pfb=a&plp=a&pli=a&pop=a&puid1=&puid2=&puid3=&puid22=&puid25=&puid27=&puid31=&puid33=&puid51=&puid52='},
			// {url: 'http://ads.adfox.ru/175105/getCode?p1=bsyyk&p2=emxn&pfc=a&pfb=a&plp=a&pli=a&pop=a&puid1=&puid2=&puid3=&puid22=&puid25=&puid27=&puid31=&puid33=&puid51=&puid52='}
		],

		debug: false,
		timeout: 2000,
		prerollTimeout: 3000
	}
};

// --

var p;
var c_bl = $('.fox_collapse_bl');

$('.go_byindex').click(function() {
	if(typeof p === 'object') {
		if(p.el()) {
			p.byIndex($(this).data('index'));
		} else {
			p = initPlayer('fox_player', player_conf, $(this).data('index'));
			p.on('collapse', function() {
				c_bl.show();
			});
		}	
	} else {
		p = initPlayer('fox_player', player_conf, $(this).data('index'));

		p.on('collapse', function(e) {
			c_bl.find('span').text(this.pl.currentVideo.title);
			c_bl.show();
		});
	}

	p.trigger('open');	
	c_bl.hide();
});

$('.fox_expand_player').on('click', function() {
	c_bl.hide();
	p.trigger('open');
});

$('.fox_close_player').on('click', function() {
	c_bl.hide();
	p.trigger('close');
});

//  ---


!function(playlist) {
	var fragment = document.createElement('ul'); //document.createDocumentFragment();

	playlist.forEach(function(el,n) {
		var elem = document.createElement('li');
		elem.setAttribute('data-i', n);
		elem.className = 'pl-item';
		elem.addEventListener('click', playByIndex, false);
		elem.appendChild(document.createTextNode(el.title));
		fragment.appendChild(elem);
	});

	document.body.insertBefore(fragment, document.body.firstChild);

	function playByIndex(e) {
		console.log(e.srcElement.getAttribute('data-i'));
	}

}(player_conf.playlist);