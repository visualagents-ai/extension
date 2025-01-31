let width = 0;
let height = 0;
let url;
let text;

chrome.tabs.onActivated.addListener( function(activeInfo){
  chrome.tabs.get(activeInfo.tabId, function(tab){
    url = tab.url;
    chrome.tabs.sendMessage(tab.id, {action: "get.page.text", tab:activeInfo.tabId});
    chrome.tabs.sendMessage(tab.id, {action: "get.page.html"});

    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "set.url", url: url});
        } catch (err) {
          console.log('No listener')
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
  if(tab) {
    url = tab.url;
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.text == "what is my tab_id?") {
    sendResponse({tab: sender.tab.id});
  }
  if (request.action === 'navigate.url') {
    console.log('navigate.url', request);

    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        try {
          if(tab.id === request.tab) {
            chrome.tabs.sendMessage(tab.id, {action: "set.location", tab:request.tab, url: request.url});
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
    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "set.page.text", tab:sender.tab.id, text: text});
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === "page.text") {
    if(request.text && (request.text.indexOf('Hi. How can I help today?') === -1 && request.text !== '')) {
      text = request.text;
      chrome.tabs.query({}, function(tabs){
        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, {action: "set.page.text", tab:sender.tab.id, text: text});
          } catch (err) {
            console.log('No listener')
          }
        })
      });
    }
  }
  if (request.action === "page.html") {
    if(request.html && (request.html.indexOf('Hi. How can I help today?') === -1 && request.html !== '')) {
      let html = request.html;
      chrome.tabs.query({}, function(tabs){
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
    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "query.elements", text: query});
        } catch (err) {
          console.log('No listener')
        }
      })
    });
  }
  if (request.action === "get.page.text")
  {
    sendResponse({text:text});
  }
  if (request.action === "get.url") {
    sendResponse({url:url});
  }
  if (request.action === "get.screen.size")
  {
    sendResponse({width:width, height:height});
  }
});

export default function() { console.log("Ready!") }

