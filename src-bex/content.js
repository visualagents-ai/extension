
chrome.runtime.sendMessage({
  action: "screen.size",
  width:window.screen.width,
  height:window.screen.height
});

chrome.runtime.sendMessage({text: "what is my tab_id?"}, tabId => {
  console.log('My tabId is', tabId);
})

window.onload = () => {
  console.log('CONTENT SCRIPT LOADED');
      const iframe = document.createElement('iframe');
      iframe.setAttribute('id', 'cm-frame');
      iframe.setAttribute(
        'style',
        'top: 10px;right: 10px;width: 400px;height: calc(100% - 20px);z-index: 2147483650;border: none; position:fixed;'
      );
      iframe.setAttribute('allow', '');
      iframe.src = chrome.runtime.getURL('spa/index.html');

      //document.body.appendChild(iframe);

  let text = getTextWithoutScripts();
  let html = document.body.outerHTML;
  if(html.indexOf('Now Loading.....') === -1) {
    localStorage.setItem('page.html', html)
  }
  let _html = localStorage.getItem('page.html')
  console.log('_HTML',_html)
  if(text && (text.indexOf('Hi. How can I help today?') === -1 && text !== '')) {
    chrome.runtime.sendMessage({
      action: "page.text",
      text: text
    });
  } else {
    chrome.runtime.sendMessage({
      action: "resend.page.text"
    });
  }
}

window.addEventListener('message', function(e) {
  console.log('Received message:', e.data);

  let request = e.data;
  if(request.action === 'send.notification') {
    if(request.url === window.location.href) {
      chrome.runtime.sendMessage(request);
    }
  }
  // Messages comes into this window from a workflow block
  // this window is probably a window the block opened to perform searches.
  // This window receives the request, gathers the requested data and sends it back
  // to the requesting tab, with the block id as the origin. The receiving content.js
  // script inside VA will unpack the message and then emit the appropriate event to the
  // requesting block
  if(request.action === 'block.request') {
    let origin = request.data.origin;
    let action = request.data.action;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const paramValue = urlParams.get('vaid');

    console.log('CONTENT SCRIPT: block.request', request)
    // If vaid is set, then get the text and post it
    if(action === 'get.text') {
      let text = origin+':'+request.tab+':'+getTextWithoutScripts();;
      // get tab of request
      console.log('content script: block.request', request)

      // send message to source tab
      window.postMessage({
        action: "block.deliver.text",
        text: text,
        origin: origin,
        blockwin: request.data.blockwin,
        tab: request.tab
      }, "*")

      /*
      chrome.runtime.sendMessage({
        action: "block.deliver.text",
        text: text,
        origin: origin,
        tab: request.tab
      });*/
    }
  }
  if (e.source != window) {
    return;
  }

  if (request.action && (request.action == "send.background.url")) {
      chrome.runtime.sendMessage({
        action: "navigate.url",
        url:request.url,
        tab:request.tab
      });
  }
  if (request.action && (request.action == "get.page.html")) {
    chrome.runtime.sendMessage({text: "what is my tab_id?"}, tabId => {
      console.log('My tabId is', tabId);
      chrome.runtime.sendMessage({
        action: "get.html",
        origin: tabId,
        tab: request.tab
      });
    })
    // Send message to background script.

    /*
    let html = document.body.innerHTML;
    console.log('get.page.html',html)

    if(html.indexOf('flow1surface') > -1) {
      return;
    }

    window.postMessage({ action: "emit.html", html: html }, "*")*/
  }
});

const config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  let text = getTextWithoutScripts();;
  console.log('OBSERVER:',text);
  if(text.indexOf('use strict') === -1) {
    window.postMessage({ action: "emit.page", text: text}, "*")
  }
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
//observer.observe(document.body, config);
function getTextWithoutScripts() {
  let allElements = document.querySelectorAll('body *');
  let text = '';

  allElements.forEach(element => {
    if (element.tagName.toLowerCase() !== 'script' &&
      element.tagName.toLowerCase() !== 'style') {
      text += element.textContent + ' ';
    }
  });

  return document.body.innerText; //document.body.innerText; //text.trim();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "set.url") {
    window.extpageurl = request.url
    localStorage.setItem('page.url', request.url)
  }
  if (request.action === "send.background.url") {
    console.log('send.background.url')
    chrome.runtime.sendMessage({
      action: "navigate.url",
      url:request.url,
      tab:request.tab
    });
  }
  if (request.action === "set.location") {
    if(window.location.href.indexOf('localhost') === -1) {
      window.location.href = request.url;
    }
  }
  // Got message from background script to get the source.
  if (request.action === "get.source") {
    console.log('get.source',request, document.body.outerHTML)

    // Post message to all content scripts?
    // Might need to go back to the background script with the original tab
    // origin and reply to it
    window.postMessage({ action: "emit.html", html: document.body.outerHTML }, "*")
  }
  if (request.action === "set.page.text") {
    if(request.text && request.text !== '') {
      console.log('page.text', request.text)

      localStorage.setItem('page.text', request.text)
      console.log('window.href',window.location.href)
      console.log('Navigating to new page',request);
      if(request.text.indexOf('use strict') === -1) {
        window.postMessage({ action: "emit.page", text: request.tab+":"+request.text}, "*")
      }
    }
  }
  if (request.action === "set.page.html") {
    if(request.html && (request.html.indexOf('Hi. How can I help today?') === -1 && request.html !== '')) {
      console.log('page.html', request.html)
      localStorage.setItem('page.html', request.html)
    }
  }
  if (request.action === "query.elements") {
    console.log('QUERYING ELEMENTS',request.text)
    let elements = document.querySelector(request.text)
    const els = elements.map(element => element.textContent)
    const elstext = els.join('\n')
    console.log('QUERYING ELEMENTS',elements)
    chrome.runtime.sendMessage({
      action: "query.elements.result",
      text: elstext
    });
  }
  if (request.action === "get.page.text") {
    let text = getTextWithoutScripts();
    chrome.runtime.sendMessage({
      action: "page.text",
      text: text,
      tab: request.tab
    });
  }
  if (request.action === "get.page.html") {
    console.log('get.page.html')
    let html = document.documentElement.innerHTML
    chrome.runtime.sendMessage({
      action: "page.html",
      html: html
    });
  }
});
