
chrome.runtime.sendMessage({
  action: "screen.size",
  width:window.screen.width,
  height:window.screen.height
});
console.log('CONTENT SCRIPT LOADED')


window.onload = () => {
  let text = document.body.innerText
  console.log('SENDING PAGE TEXT',text)
  chrome.runtime.sendMessage({
    action: "page.text",
    text:text
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "set.url") {
    console.log("GOT URL in CONTENT SCRIPT:", request.url);
    window.extpageurl = request.url
    localStorage.setItem('pageurl', request.url)
  }
  if (request.action === "set.page.text") {
    console.log('RECEIVED TEXT', request)
    if(request.text && (request.text.indexOf('Hi. How can I help today?') === -1 && request.text !== '')) {
      console.log('SETTING PAGE TEXT', request.text)
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

