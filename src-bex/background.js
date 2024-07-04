let width = 0;
let height = 0;
let url;
let text;

chrome.tabs.onActivated.addListener( function(activeInfo){
  chrome.tabs.get(activeInfo.tabId, function(tab){
    url = tab.url;
    chrome.tabs.sendMessage(tab.id, {action: "get.page.text"});

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
  if (request.action === "screen.size") {
    width = request.width;
    height = request.height;
  }
  if (request.action === 'resend.page.text') {
    chrome.tabs.query({}, function(tabs){
      tabs.forEach(tab => {
        try {
          chrome.tabs.sendMessage(tab.id, {action: "set.page.text", text: text});
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
            chrome.tabs.sendMessage(tab.id, {action: "set.page.text", text: text});
          } catch (err) {
            console.log('No listener')
          }
        })
      });
    }
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

