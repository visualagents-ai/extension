let width = 0;
let height = 0;
let url;
let text;

let Dexie = require('dexie');

let db = new Dexie("BackgroundDatabase");

// DB with single table "friends" with primary key "id" and
// indexes on properties "name" and "age"
db.version(1).stores({
  friends: `
      id,
      name,
      age`,
});

(async () => {
  let f = await db.friends
    .orderBy("age")
    .reverse()
    .toArray();
  console.log('FRIENDS3:', f);
  let k = await db.friends.where('name').startsWith("S").keys();
  console.log('FRIENDS2:', k);
})()


chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true})
  .catch((error) => console.error(error));

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    url = tab.url;
    chrome.tabs.sendMessage(tab.id, {action: "get.page.text", tab: activeInfo.tabId});
    chrome.tabs.sendMessage(tab.id, {action: "get.page.html"});

    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {

          chrome.tabs.sendMessage(tab.id, {action: "set.url", url: url});
        } catch (err) {
          console.error(err);
        }
      })
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (tab.active && change.url) {
    url = change.url
  }
});

chrome.tabs.getCurrent(function (tab) {
  if (tab) {
    url = tab.url;
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "send.notification") {
    chrome.notifications.create(request.options);
  }
  if (request.text === "what is my tab_id?") {
    if (sender && sender.tab && sender.tab.id) {
      sendResponse({tab: sender.tab.id});
    }
  }
  if (request.action === "background.tab.id") {
    console.log("background.tab.id", request);
    (async () => {
      let f = await db.friends
        .orderBy("age")
        .reverse()
        .toArray();
      console.log('BG DATA:', f);
    })()

    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          console.log("notify.tab.id", request);
          chrome.tabs.sendMessage(tab.id, {
            action: "notify.tab.id",
            key: request.key,
            tab: request.tab
          });
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === 'navigate.url') {
    console.log('navigate.url', request);

    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          if (tab.id === request.tab) {
            chrome.tabs.sendMessage(tab.id, {action: "set.location", tab: request.tab, url: request.url});
          }
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === 'send.to.agent') {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          // Sends to all tabs, but only side panel will recognize it
          chrome.tabs.sendMessage(tab.id, request);
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === 'send.command') {
    chrome.tabs.sendMessage(request.tab, {action: "execute.command", tab: request.tab, message: request.message});
  }
  if (request.action === 'send.console.info') {
    chrome.tabs.sendMessage(request.tab, {action: "emit.console.info", info: request.info});
  }
  if (request.action === 'inject') {
    let code = 'console.log("INJECTED!");'
    chrome.scripting.executeScript({
      target: {tabId: request.tab},
      func: code => {
        const el = document.createElement('script');
        el.textContent = code;
        document.documentElement.appendChild(el);
        el.remove();
      },
      args: [code],
      world: 'MAIN',
      injectImmediately: true, // Chrome 102+
    });
  }
  if (request.action === 'emit.html') {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          console.log('emit.html tab:', tab.id, request.origin)
          if (tab.id === request.origin) {
            chrome.tabs.sendMessage(tab.id, {
              action: "emit.html",
              href: request.href,
              html: request.html,
              origin: request.origin,
              tab: request.tab
            });
          }
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === 'get.html') {
    // Find tab that matches request.tab and send 'get.source' message to it
    // to be handled by that content script.
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          if (tab.id === request.tab) {
            chrome.tabs.sendMessage(tab.id, {action: "get.source", origin: request.origin, tab: request.tab});
          }
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === "screen.size") {
    width = request.width;
    height = request.height;
  }
  if (request.action === 'resend.page.text') {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "set.page.text", tab: sender.tab.id, text: request.text});
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === "page.text") {
    if (request.text && (request.text.indexOf('Hi. How can I help today?') === -1 && request.text !== '')) {
      text = request.text;
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {action: "set.page.text", tab: sender.tab.id, text: text});
          } catch (err) {
            console.log('No listener')
          }
        })
      });
    }
  }
  if (request.action === "page.html") {
    if (request.html && (request.html.indexOf('Hi. How can I help today?') === -1 && request.html !== '')) {
      let html = request.html;
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {action: "set.page.html", html: html});
          } catch (err) {
            console.log('No listener')
          }
        })
      });
    }
  }
  if (request.action === "query.elements") {
    const query = 'div'; //request.text;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "query.elements", text: query});
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === "get.page.text") {
    sendResponse({text: text});
  }
  if (request.action === "get.url") {
    sendResponse({url: url});
  }
  if (request.action === "get.screen.size") {
    sendResponse({width: width, height: height});
  }
});

export default function () {
  console.log("Ready!")
}

