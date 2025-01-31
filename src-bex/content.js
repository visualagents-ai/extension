
chrome.runtime.sendMessage({
  action: "screen.size",
  width:window.screen.width,
  height:window.screen.height
});


window.onload = () => {
  console.log('CONTENT SCRIPT LOADED')
  let text = document.body.innerText
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

  if (e.source != window) {
    return;
  }

  let request = e.data;
  if (request.action && (request.action == "send.background.url")) {
    chrome.runtime.sendMessage({
      action: "navigate.url",
      url:request.url,
      tab:request.tab
    });
  }
});

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
    window.location.href = request.url;
    /*
    chrome.runtime.sendMessage({text: "what is my tab_id?"}, tabId => {
      console.log('My tabId is', tabId);
      if(tabId.tab === request.tab) {

      }
    })*/
  }
  if (request.action === "set.page.text") {
    if(request.text && request.text !== '') {
      console.log('page.text', request.text)

      localStorage.setItem('page.text', request.text)
      console.log('window.href',window.location.href)
      console.log('Navigating to new page',request);
      window.postMessage({ action: "emit.page", text: request.tab+":"+request.text}, "*")
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
    let text = document.body.innerText
    chrome.runtime.sendMessage({
      action: "page.text",
      text: text,
      tab: request.tab
    });
  }
  if (request.action === "get.page.html") {
    let html = document.documentElement.innerHTML
    chrome.runtime.sendMessage({
      action: "page.html",
      html: html
    });
  }
});
