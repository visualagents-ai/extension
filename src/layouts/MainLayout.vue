<template>
  <q-layout view="lHh Lpr lFf" class="bg-white">
    <q-page-container>
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
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { bexBackground } from "quasar/wrappers";
import { createRxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedKeyEncryptionCryptoJsStorage } from "rxdb/plugins/encryption-crypto-js";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBAttachmentsPlugin } from "rxdb/plugins/attachments";
import { RxDBJsonDumpPlugin } from "rxdb/plugins/json-dump";

addRxPlugin(RxDBJsonDumpPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBAttachmentsPlugin);

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
      pagetext: "NO TEXT",
      chats: [],
      loading: true,
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
      this.$root.$auth0.logout({ returnTo: window.location.origin });
      window.close();
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
    async login(withPopup) {
      let me = this;

      //const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX
      //const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY

      const width = me.screenWidth;
      const height = me.screenHeight;

      //const systemZoom = width / window.screen.availWidth
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
          me.eventing.emit("login.dismissed");
        };
        await this.$root.$auth0.loginWithPopup({}, { popup }).catch((err) => {
          me.eventing.emit("login.dismissed");
        });
      }
      let user = await this.$root.$auth0.user;
      let promise = this.getToken();

      promise
        .then(async (token) => {
          me.loading = false;
        })
        .catch((err) => {
          me.loading = false;
          console.log(err);
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
