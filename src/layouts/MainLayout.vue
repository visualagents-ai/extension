<template>
  <q-layout view="lHh Lpr lFf" class="bg-white">
    <q-inner-loading :showing="loading" style="z-index: 9999">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
    <q-page-container style="border-bottom: 1px solid black">
      <q-toolbar class="bg-accent" width="100%">
        <q-space/>
        <q-btn dense flat size="lg" color="secondary" icon="fas fa-door-closed" v-if="isAuthenticated && loggedIn" @click="logout">
          <q-tooltip>Logout</q-tooltip>
        </q-btn>
        <q-btn dense flat size="lg" color="secondary" icon="fas fa-door-open" v-if="!(isAuthenticated && loggedIn)" @click="login(true)">
          <q-tooltip>Login</q-tooltip>
        </q-btn>
      </q-toolbar>
      <!--
      <q-list dense>
        <q-inner-loading :showing="loading" style="z-index: 999999">
          <q-spinner-gears size="30px" color="primary" />
        </q-inner-loading>
        <q-item clickable v-close-popup @click="logout" v-if="isAuthenticated">
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-door-closed" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8">
            Logout
          </q-item-section>
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="login(true)"
          v-if="!isAuthenticated"
        >
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-door-open" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8"> Login </q-item-section>
        </q-item>

        <q-separator />
        <q-item clickable v-close-popup @click="openChat2">
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-sitemap" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8">
            Editor
          </q-item-section>
        </q-item>

        <q-separator />
        <q-item
          clickable
          v-close-popup
          @click="pasteNodes"
          :disable="disablePaste"
          v-for="chat in chats"
          :key="chat.id"
        >
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-paste" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8">
            {{ chat.name }}
          </q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="sendNotify">
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-upload" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8">
            Send Notify
          </q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="clear = true">
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-cog" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8">
            Configure
          </q-item-section>
        </q-item>

        <q-separator />
        <q-item clickable v-close-popup>
          <q-item-section side>
            <q-icon style="font-size: 14px" name="fas fa-info" />
          </q-item-section>
          <q-item-section side class="text-blue-grey-8"> About </q-item-section>
        </q-item>
      </q-list>
      -->
    </q-page-container>

    <q-dialog v-model="alert" >
      <q-card style="padding: 10px; padding-top: 30px">
        <q-card-section
          class="bg-secondary"
          style="
            position: absolute;
            left: 0px;
            top: 0px;
            width: 100%;
            height: 40px;
          "
        >
          <div
            style="
              font-weight: bold;
              font-size: 18px;
              margin-top: -20px;
              margin-left: -15px;
              color: #fff;
            "
          >
            <q-toolbar>
              <q-item-label>Data Received</q-item-label>
            </q-toolbar>
          </div>
        </q-card-section>
        <q-card-section class="row items-center" style="height: 120px">
          <span class="q-ml-sm">
            Hi. I have received some data. Do you want me to save it?
          </span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            style="position: absolute; bottom: 0px; right: 100px; width: 100px"
            flat
            label="No"
            class="bg-accent text-dark"
            color="primary"
            v-close-popup
          />
          <q-btn
            flat
            style="position: absolute; bottom: 0px; right: 0px; width: 100px"
            label="Yes"
            class="bg-secondary text-white"
            color="primary"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import dexieCloud from 'dexie-cloud-addon';
import Dexie from 'dexie';

import { bexBackground } from "quasar/wrappers";

bexBackground((bridge) => {
  // Hook into the bridge to listen for events sent from the client BEX.
  bridge.on("screen.size", (event) => {
    console.log("SCREEN SIZE", event);
  });
});

defineOptions({
  name: "MainLayout",
  async mounted() {
    let me = this;
    this.login();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'send.to.agent') {
        me.alert = true;
        // Process the message and update the side panel UI
        console.log('Received message from background:', request.data);
        // Example: update a DOM element
        sendResponse({ status: 'Message received by side panel' }); // Send a response back to the background script
      }
    });

    me.loading = false;
    console.log("GET.SCREEN.SIZE");
    chrome.runtime.sendMessage(
      { action: "get.screen.size" },
      function (response) {
        me.screenWidth = response.width;
        me.screenHeight = response.height;
      }
    );
    chrome.runtime.sendMessage({ action: "get.url" }, function (response) {
      me.url = response.url;
    });

    chrome.runtime.sendMessage(
      { action: "get.page.text" },
      function (response) {
        console.log("PAGETEXT", response.text);
        me.pagetext = response.text;
      }
    );
  },
  computed: {
    isAuthenticated() {
      // @ts-ignore
      return this.$root.$auth0.isAuthenticated.value;
    },
  },
  data() {
    return {
      loggedIn: false,
      loading: false,
      alert: false,
      pagetext: "NO TEXT",
      chats: [],
      authenticated: this.$root.$auth0.isAuthenticated,
      screenWidth: 0,
      screenHeight: 0,
    };
  },
  methods: {
    sendNotify() {
      console.log("Sending notify", chrome.runtime.getURL("../icons/u48.png"));
      chrome.notifications.create("", {
        title: "Agent Notification",
        message:
          "I found something interesting on this page. Do you want details?",
        iconUrl: chrome.runtime.getURL("../icons/u16.png"),
        type: "basic",
        buttons: [{ title: "Yes" }, { title: "No" }],
      });
      console.log("Sent notify");
    },
    async checkDatabase(auser) {
      if (!auser) {
        return;
      }
      let dexie = getRxStorageDexie({
        addons: [dexieCloud],
      });

      const encryptedDexieStorage = wrappedKeyEncryptionCryptoJsStorage({
        storage: dexie,
      });
      //const encryptedDexieStorage = wrappedKeyEncryptionCryptoJsStorage({
      //  storage: getRxStorageDexie(),
      //});
      if (!auser.sub) {
        return;
      }
      let key = auser.sub.substring(6, 16);
      this.database = await createRxDatabase({
        name: auser.email + "-" + key + "-database",
        storage: encryptedDexieStorage,
        password: auser.sub,
        multiInstance: true,
        ignoreDuplicate: true,
      }).catch((err) => {
        console.log("ERR", err);
      });
    },
    openApp() {
      window.open("https://app.visualagents.ai", "_blank");
    },
    logout() {
      let me = this;
      this.loading = true;
      this.loggedIn = false;
      this.$root.$auth0.logout({ returnTo: window.location.origin }).then(() => {
        me.loading = false;
        me.loggedIn = false;
        //location.reload();
      })

    },
    async getToken() {
      const accessToken = await this.$root.$auth0.getAccessTokenSilently();
      return accessToken;
    },
    async openChat2() {
      let me = this;

      const width = screen.availWidth;
      const height = screen.availHeight;
      const left = 0;
      const top = 0;
      chrome.tabs.create(
        {
          url: "http://localhost:8080/#/index?url=" + me.url,
          active: false,
        },
        function (tab) {
          chrome.windows.create(
            {
              tabId: tab.id,
              type: "popup",
              focused: true,
              width: width,
              height: height,
              left: left,
              top: top,
            },
            function (win) {
              setTimeout(() => {
                chrome.tabs.sendMessage(win.tabId, {
                  action: "set.url",
                  url: me.url,
                });
              });
            }
          );
        }
      );
    },
    async openChat() {
      let me = this;

      const width = me.screenWidth;
      const height = me.screenHeight;

      //const systemZoom = width / window.screen.availWidth
      const left = width - width * 0.3; // / systemZoom + dualScreenLeft
      const top = height - height * 0.45; // / systemZoom + dualScreenTop

      window.open(
        "http://localhost:8080/#/index?url=" + me.url,
        "chatwindow",
        "left=" +
          left +
          ",top=" +
          top +
          ",width=" +
          width * 0.3 +
          ",height=" +
          height * 0.45 +
          ",scrollbars=no,resizable=no"
      );
    },
    async createDatabase(user) {
      const db = new Dexie(user.email, { addons: [dexieCloud] });

      db.version(5).stores({
        files:
          '@id, name, vars, permissions, shared, visibility, data, path, ext, icon, type, updated, created',
        environment: '@id, name, scope, link, type, detail, value',
        library:
          '@id, name, vars, permissions, shared, visibility, data, path, ext, icon, type, updated, created',
        settings: '@id, name, value',
        aglets:
          '@id, name, vars, permissions, shared, visibility, data, path, ext, icon, type, updated, created',
        shares:
          '@id, name, vars, permissions, shared, visibility, data, path, ext, icon, type, updated, created',
        chats:
          '@id, name, vars, permissions, shared, visibility, data, path, ext, icon, type, updated, created',
      });

      const libraryObservable = Dexie.liveQuery(() => db.library.toArray());

      const subscription = libraryObservable.subscribe({
        next: () => {
          console.log('FILE CHANGED!');
        },
        error: (error) => console.error(error),
      });

      function onKeyChange(db) {
        console.log('onKeyChange', db);
      }

      await db.open();
      console.log('RETURNING DB', db);
      console.log('LIBRARY:', db.library.toArray().then((data) => {
        console.log('DATA:', data);
      }));
      return db;
    },
    async login(withPopup) {
      let me = this;

      this.loading = true;
      const width = me.screenWidth;
      const height = me.screenHeight;

      const left = (width - 500) / 2; // / systemZoom + dualScreenLeft
      const top = (height - 715) / 2; // / systemZoom + dualScreenTop
      if (withPopup) {
        const popup = window.open(
          "",
          "auth0:authorize:popup",
          "left=" +
            left +
            ",top=" +
            top +
            ",width=500,height=715,scrollbars=no,resizable=no"
        );
        popup.onclose = function () {
          me.loading = false;
          me.eventing.emit("login.dismissed");
        };
        await this.$root.$auth0.loginWithPopup({}, { popup }).then(() => {
          me.loading = false;
        }).catch((err) => {
          me.loading = false;
          me.eventing.emit("login.dismissed");
        });
      }
      let user = await this.$root.$auth0.user;
      let promise = this.getToken();

      promise
        .then(async (token) => {
          console.log("GOT TOKEN:",token);
          me.loggedIn = true;
          await this.createDatabase(user);
        })
        .catch((err) => {
          console.warn("GOT TOKEN ERROR");
          console.error(err);
        });
      return promise;
    },
  },
});

const linksList = [
  {
    title: "Docs",
    caption: "quasar.dev",
    icon: "school",
    link: "https://quasar.dev",
  },
  {
    title: "Github",
    caption: "github.com/quasarframework",
    icon: "code",
    link: "https://github.com/quasarframework",
  },
  {
    title: "Discord Chat Channel",
    caption: "chat.quasar.dev",
    icon: "chat",
    link: "https://chat.quasar.dev",
  },
  {
    title: "Forum",
    caption: "forum.quasar.dev",
    icon: "record_voice_over",
    link: "https://forum.quasar.dev",
  },
  {
    title: "Twitter",
    caption: "@quasarframework",
    icon: "rss_feed",
    link: "https://twitter.quasar.dev",
  },
  {
    title: "Facebook",
    caption: "@QuasarFramework",
    icon: "public",
    link: "https://facebook.quasar.dev",
  },
  {
    title: "Quasar Awesome",
    caption: "Community Quasar projects",
    icon: "favorite",
    link: "https://awesome.quasar.dev",
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
