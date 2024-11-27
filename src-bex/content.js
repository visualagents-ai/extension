
chrome.runtime.sendMessage({
  action: "screen.size",
  width:window.screen.width,
  height:window.screen.height
});


window.onload = () => {
  let text = document.body.innerText
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "set.url") {
    window.extpageurl = request.url
    localStorage.setItem('pageurl', request.url)
  }
  if (request.action === "set.page.text") {
    if(request.text && (request.text.indexOf('Hi. How can I help today?') === -1 && request.text !== '')) {
      console.log('page.text', request.text)
      localStorage.setItem('page.text', request.text)
    }
  }
  if (request.action === "get.page.text") {
    let text = document.body.innerText
    chrome.runtime.sendMessage({
      action: "page.text",
      text:text
    });
  }
});

