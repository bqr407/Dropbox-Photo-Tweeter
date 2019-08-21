'use strict';

window.onload = function() {

	document.getElementById('birdie').addEventListener('click', function () {
		setTimeout(function () {
			window.location = 'http://localhost:3000/twitter/login';
		}, 1500);
	});

};