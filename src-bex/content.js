chrome.runtime.sendMessage({
  action: "screen.size",
  width: window.screen.width,
  height: window.screen.height
});

function removeScriptTags(htmlString) {
  // Regular expression to match <script> tags and their content (including newlines)
  // The 'g' flag ensures all occurrences are replaced, and 'i' makes it case-insensitive.
  // The 's' flag (dotAll) allows '.' to match newline characters.
  const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis;

  // Replace all matched script tags with an empty string
  return htmlString.replace(regex, '');
}

function extractBody(html_string) {
  let parser = new DOMParser();
  let dom_document = parser.parseFromString(html_string, "text/html");
  let body_element = dom_document.getElementsByTagName("body")[0];
  console.log(removeScriptTags(body_element.innerHTML));
}

function decodeUnicodeHTML(escapedHTML) {
  return escapedHTML.replace(/\\u([0-9a-fA-F]{4})/g, function (match, group) {
    return String.fromCharCode(parseInt(group, 16));
  });
}

chrome.runtime.sendMessage({text: "what is my tab_id?"}, tabId => {
  console.log('My tabId is', tabId);
  const urlParams = new URLSearchParams(window.location.search);
  const tabkey = urlParams.get('tabkey'); // Replace 'paramName' with the actual parameter key

  console.log("STORING TABID[" + tabId.tab + ":", tabkey);
  localStorage.setItem(tabkey, tabId.tab)
  chrome.runtime.sendMessage({
    action: "background.tab.id",
    key: tabkey,
    tab: tabId.tab
  });
})

window.onload = async () => {
  console.log('CONTENT SCRIPT LOADED');

  const urlParams = new URLSearchParams(window.location.search);
  const tabkey = urlParams.get('tabkey'); // Replace 'paramName' with the actual parameter key
  if (tabkey) {
    // Fetch and store the tabkey to be pulled from database below
  }
  console.log('INJECTED DEXIE AFTER PAGE LOAD');
  let db = new Dexie("FriendDatabase");

  // DB with single table "friends" with primary key "id" and
  // indexes on properties "name" and "age"
  db.version(1).stores({
    friends: `
      id,
      name,
      age`,
  });

  console.log('FRIENDS: No data inserted')
  /*
      // Now add some values.
      db.friends.bulkPut([
        { id: 1, name: "Josephine", age: 21 },
        { id: 2, name: "Per", age: 75 },
        { id: 3, name: "Simon", age: 5 },
        { id: 4, name: "Sara", age: 50, notIndexedProperty: 'foo' }
      ]).then(async (friends) => {
        */
  console.log('FRIENDS4:', await db.friends.where("age").between(0, 25).toArray());

  let f = await db.friends
    .orderBy("age")
    .reverse()
    .toArray();
  console.log('FRIENDS3:', f);
  let k = await db.friends.where('name').startsWith("S").keys();
  console.log('FRIENDS2:', k);
  /*}
).catch(err => {
    console.error(err);
  });*/
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
  if (html.indexOf('Now Loading.....') === -1) {
    localStorage.setItem('page.html', html)
  }
  let _html = localStorage.getItem('page.html')
  console.log('_HTML', _html)
  if (text && (text.indexOf('Hi. How can I help today?') === -1 && text !== '')) {
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

window.addEventListener('message', function (e) {
  console.log('Received message:', e.data);

  let request = e.data;
  if (request.action === 'sendToAgent') {
    let data = request.data;
    chrome.runtime.sendMessage({
      action: "send.to.agent",
      data: data
    }).then(response => {
      console.log("Message sent successfully:", response);
    }).catch(error => {
      console.error("Error sending message:", error);
    });
  }
  if (request.action === 'command') {
    chrome.runtime.sendMessage({
      action: "send.command",
      message: request.message,
      tab: request.message.tab
    }).then(response => {
      console.log("Message sent successfully:", response);
    })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  }
  if (request.action === 'console.info') {
    chrome.runtime.sendMessage({
      action: "send.console.info",
      info: request.info,
      tab: request.tab
    }).then(response => {
      console.log("Message sent successfully:", response);
    })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  }
  if (request.action === 'selenium') {
    console.log('SELENIUM: ', request.message);
    chrome.runtime.sendMessage('injldmpklnapoapkkjjhongmhknknpdo',
      request.message
    ).then(response => {
      console.log("Message sent successfully:", response);
    })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  }

  if (request.action === 'send.notification') {
    if (request.url === window.location.href) {
      chrome.runtime.sendMessage(request);
    }
  }
  // Messages comes into this window from a workflow block
  // this window is probably a window the block opened to perform searches.
  // This window receives the request, gathers the requested data and sends it back
  // to the requesting tab, with the block id as the origin. The receiving content.js
  // script inside VA will unpack the message and then emit the appropriate event to the
  // requesting block
  if (request.action === 'block.request') {
    let origin = request.data.origin;
    let action = request.data.action;
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const paramValue = urlParams.get('vaid');

    console.log('CONTENT SCRIPT: block.request', request)
    // If vaid is set, then get the text and post it
    if (action === 'get.text') {
      let text = origin + ':' + request.tab + ':' + getTextWithoutScripts();
      ;
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
      url: request.url,
      tab: request.tab
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

const config = {attributes: true, childList: true, subtree: true};

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
  let text = getTextWithoutScripts();
  ;
  console.log('OBSERVER:', text);
  if (text.indexOf('use strict') === -1) {
    window.postMessage({action: "emit.page", text: text}, "*")
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
  if (request.action === "notify.tab.id") {
    console.log("CONTENT notify.tab.id", request);
    window.postMessage({
      action: "notify.tab.id",
      key: request.key,
      tab: request.tab
    }, "*")
  }
  if (request.action === "set.url") {
    window.extpageurl = request.url
    localStorage.setItem('page.url', request.url)
  }
  if (request.action === "console.info") {
    chrome.runtime.sendMessage({
      action: "send.console.info",
      info: request.info,
      tab: request.tab
    });
  }
  if (request.action === "send.background.url") {
    console.log('send.background.url')
    chrome.runtime.sendMessage({
      action: "navigate.url",
      url: request.url,
      tab: request.tab
    });
  }
  if (request.action === "set.location") {
    if (window.location.href.indexOf('localhost') === -1) {
      window.location.href = request.url;
    }
  }
  // Got message from background script to get the source.
  if (request.action === "get.source") {
    console.log("get.source ", request, window.location);
    setTimeout(() => {

      // Post message to all content scripts?
      // Might need to go back to the background script with the original tab
      // origin and reply to it
      // request.origin should contain tabId of requesting tab (visualagents)
      let htmlstr = decodeUnicodeHTML(document.body.outerHTML)

      function stripScripts(s) {
        let div = document.createElement('body');
        div.innerHTML = s;
        let scripts = div.getElementsByTagName('script');
        let i = scripts.length;
        while (i--) {
          scripts[i].parentNode.removeChild(scripts[i]);
        }
        let styles = div.getElementsByTagName('style');
        i = styles.length;
        while (i--) {
          styles[i].parentNode.removeChild(styles[i]);
        }
        let svgs = div.getElementsByTagName('svg');
        i = svgs.length;
        while (i--) {
          svgs[i].parentNode.removeChild(svgs[i]);
        }
        return {html: div.innerHTML, el: div}
      }

      //let o = stripScripts(htmlstr);
      let html = htmlstr; //o.html;
      //o.el.remove();

      if (html.trim().length > 10) {
        chrome.runtime.sendMessage({
          action: "emit.html",
          html: html,
          href: window.location.href,
          origin: request.origin.tab,
          tab: request.tab
        });
      }

      //window.postMessage({ action: "emit.html", html: html }, "*")
    }, 1000)
  }
  if (request.action === "execute.command") {
    console.log('execute.command', request)
    if (request.message.action === "send.keys") {
      setTimeout(() => {
        let input = document.querySelector(request.message.target);
        input.value = request.message.text;
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13, // Deprecated, but still widely used for compatibility
          which: 13,   // Deprecated, but still widely used for compatibility
          bubbles: true, // Allow the event to bubble up the DOM tree
          cancelable: true // Allow the event's default action to be prevented
        });

// Dispatch the event on the input element
        input.dispatchEvent(enterEvent);
      }, 1000)
    }
    if (request.message.action === "get.html") {
      setTimeout(() => {
        let html = document.documentElement.innerHTML
        console.log('COMMAND HTML: ', html);
      }, 1000)
    }
  }
  if (request.action === "receive.message") {
    console.log('receive.message', request)
  }
  if (request.action === "emit.console.info") {
    console.log('console.info', request.info)
  }
  if (request.action === "emit.html") {
    console.log('emit.html:', request)
    let html = request.html.trim();
    if (html.length > 10) {
      window.postMessage({
        action: "emit.html",
        href: request.href, html: html
      }, "*")
    }
  }
  if (request.action === "set.page.text") {
    if (request.text && request.text !== '') {
      console.log('page.text', request.text)

      localStorage.setItem('page.text', request.text)
      console.log('window.href', window.location.href)
      console.log('Navigating to new page', request);
      if (request.text.indexOf('use strict') === -1) {
        window.postMessage({action: "emit.page", text: request.tab + ":" + request.text}, "*")
      }
    }
  }
  if (request.action === "set.page.html") {
    if (request.html && (request.html.indexOf('Hi. How can I help today?') === -1 && request.html !== '')) {
      console.log('page.html', request.html)
      localStorage.setItem('page.html', request.html)
    }
  }
  if (request.action === "query.elements") {
    console.log('QUERYING ELEMENTS', request.text)
    let elements = document.querySelector(request.text)
    const els = elements.map(element => element.textContent)
    const elstext = els.join('\n')
    console.log('QUERYING ELEMENTS', elements)
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
    let html = document.documentElement.innerHTML
    let body = extractBody(html);
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "page.html",
        html: body
      });
    }, 1500)
  }
});
