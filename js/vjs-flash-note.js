!function(vjs) {

	function flashNote() {

		console.info('init flashNote');

		var me = this,
			$player = $(this.el()),
			$note,
			$close;

		var showed = getCookie('flashNote');
		var text = "К сожалению, ваш браузер не поддерживает воспроизведение видео/аудио с помощью HTML5 технологии, плеер работает в режиме флеш-плеера. Этот режим отличается своей нестабильностью и предоставляется 'как есть', поэтому все жалобы на неправильную работу плеера в этом режиме будут рассматриваться в последнюю очередь. Больше информации для решения возникших проблем вы найдете в разделе <a href='http://www.ex.ua/93576596' target='_blank'>FAQ</a>."
		if(!showed) {
			$note = $('<div/>', {'class': 'vjs-flash-note', 'html': text});
			$close = $('<i/>', {'class': 'vjs-close-note', title: 'Закрыть'});
			$note.append($close);
			$player.append($note);


			$close.on('click', function() {
				createCookie('flashNote', 1);
				$note.remove();
			});
		}

	}

	vjs.plugin('flashNote', flashNote);

}(videojs);