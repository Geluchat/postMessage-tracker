var tab_listeners = {};
var tab_push = {}, tab_lasturl = {};
var selectedId = -1;

async function refreshCount(tabId) {
	const key = `tab_${tabId}`;
	const data = await chrome.storage.session.get(key);
	const listeners = data[key] ? data[key].listeners : [];
	const txt = listeners ? listeners.length : 0;
	chrome.action.setBadgeText({ "text": '' + txt, tabId: tabId });
	if (txt > 0) {
		chrome.action.setBadgeBackgroundColor({ color: [255, 0, 0, 255], tabId: tabId });
	} else {
		chrome.action.setBadgeBackgroundColor({ color: [0, 0, 255, 0], tabId: tabId });
	}
}

function logListener(data) {
	chrome.storage.sync.get({
		log_url: ''
	}, function (items) {
		log_url = items.log_url;
		if (!log_url.length) return;
		data = JSON.stringify(data);
		try {
			fetch(log_url, {
				method: 'post',
				headers: {
					"Content-type": "application/json; charset=UTF-8"
				},
				body: data
			});
		} catch (e) { }
	});
}

chrome.runtime.onMessage.addListener(async function (msg, sender, sendResponse) {
	const tabId = sender.tab.id;
	const key = `tab_${tabId}`;
	let tabData = (await chrome.storage.session.get(key))[key] || {};

	if (msg.listener) {
		if (msg.listener == 'function () { [native code] }') return;
		msg.parent_url = sender.tab.url;
		if (!tabData.listeners) tabData.listeners = [];
		tabData.listeners.push(msg);
		logListener(msg);
	}
	if (msg.pushState) {
		tabData.pushState = true;
	}
	if (msg.changePage) {
		delete tabData.lastUrl;
	}
	await chrome.storage.session.set({ [key]: tabData });

	if (!msg.log) {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab && tab.id === tabId) {
			refreshCount(tabId);
		}
	}
});

chrome.tabs.onUpdated.addListener(async function (tabId, props) {
	const key = `tab_${tabId}`;
	let tabData = (await chrome.storage.session.get(key))[key] || {};

	if (props.status == "complete") {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab && tab.id === tabId) {
			refreshCount(tabId);
		}
	} else if (props.status) {
		if (tabData.pushState) {
			delete tabData.pushState;
		} else {
			if (!tabData.lastUrl) {
				tabData.listeners = [];
			}
		}
	}
	if (props.status == "loading") {
		tabData.lastUrl = true;
	}

	await chrome.storage.session.set({ [key]: tabData });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	refreshCount(activeInfo.tabId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
	const key = `tab_${tabId}`;
	await chrome.storage.session.remove(key);
});

chrome.runtime.onConnect.addListener(function (port) {
	port.onMessage.addListener(async function (msg) {
		if (msg === "get-stuff") {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (tab) {
				const key = `tab_${tab.id}`;
				const data = await chrome.storage.session.get(key);
				port.postMessage({ listeners: data[key] ? data[key].listeners : [] });
			}
		}
	});
})

chrome.runtime.onInstalled.addListener(async () => {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tabs.length > 0) {
		refreshCount(tabs[0].id);
	}
});