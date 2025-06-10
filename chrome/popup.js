var port = chrome.runtime.connect({
	name: "Sample Communication"
});

function loaded() {
	port.postMessage("get-stuff");
	port.onMessage.addListener(function (msg) {
		listListeners(msg.listeners);
	});
}

window.onload = loaded

function listListeners(listeners) {
	var container = document.getElementById('content');
	var oldList = document.getElementById('x');
	if (oldList) {
		container.removeChild(oldList);
	}
	var listElement = document.createElement('ol');
	listElement.id = 'x';

	if (!listeners || listeners.length === 0) {
		document.getElementById('h').innerText = '';
	} else {
		document.getElementById('h').innerText = listeners[0].parent_url;
		for (var i = 0; i < listeners.length; i++) {
			var listener = listeners[i]
			var el = document.createElement('li');

			var bel = document.createElement('b');
			bel.innerText = listener.domain + ' ';
			var win = document.createElement('code');
			win.innerText = ' ' + (listener.window ? listener.window + ' ' : '') + (listener.hops && listener.hops.length ? listener.hops : '');
			el.appendChild(bel);
			el.appendChild(win);

			var sel = document.createElement('span');
			if (listener.fullstack) sel.setAttribute('title', listener.fullstack.join("\n\n"));
			var seltxt = document.createTextNode(listener.stack);

			sel.appendChild(seltxt);
			el.appendChild(sel);

			var pel = document.createElement('pre');
			pel.innerText = listener.listener;
			el.appendChild(pel);

			listElement.appendChild(el);
		}
	}
	container.appendChild(listElement);
}