let width = 0;
let height = 0;
let url;
let text;

/*
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBAttachmentsPlugin } from 'rxdb/plugins/attachments';
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump';

addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBAttachmentsPlugin);

const encryptedDexieStorage = wrappedKeyEncryptionCryptoJsStorage({
  storage: getRxStorageDexie(),
});

(async () => {

const database = await createRxDatabase({
  name: 'darren@visualagents.ai-6655c729a5-database',
  storage: encryptedDexieStorage,
  password: 'auth0|6655c729a56aca454540206b',
  multiInstance: true,
  ignoreDuplicate: true,
}).catch((err) => {
  console.log('ERR', err);
});

//const foundDocuments = await database.files.find().exec();
console.log('DATABASE',database)

})()
*/

chrome.tabs.onActivated.addListener( function(activeInfo){
  console.log('TAB CHANGE')
  chrome.tabs.get(activeInfo.tabId, function(tab){
    console.log('NEW URL', tab.url)
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
    console.log('BG TAB URL', tab.url)
    url = tab.url;
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "screen.size") {
    console.log('BACKGROUND GOT screen.size', request.width,request.height);
    width = request.width;
    height = request.height;
  }
  if (request.action === "page.text") {
    if(request.text && (request.text.indexOf('Hi. How can I help today?') === -1 && request.text !== '')) {
      text = request.text;
      console.log('PAGE TEXT', text)
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
    console.log('BACKGROUND URL', url)
    sendResponse({url:url});
  }
  if (request.action === "get.screen.size")
  {
    sendResponse({width:width, height:height});
  }
});

export default function() { console.log("hello!") }

