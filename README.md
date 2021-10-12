### [123TV](https://github.com/warren-bank/crx-123TV/tree/master)

#### Summary:

Chromium browser extension:
* works on pages that are hosted at: [`123tvnow.com/watch/*`](http://123tvnow.com/)

#### UI:

* there is no user interface (UI)
* the extension works silently in the background
  * removes all page content except the iframe that contains an embedded video player
  * dramatically reduces CPU load
* after installation, an icons is added to the "Chrome toolbar"
  * there is no way for the extension to prevent this from happening
  * to hide ( but [not remove](https://superuser.com/questions/1048619) ) it, you can right-click on the icon and select: "Hide in Chrome menu"

#### Stale Branch:

* this branch is no-longer maintained
  - the [`webmonkey-userscript/es6`](https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es6) branch is an enhanced version of this userscript
  - the [`webmonkey-userscript/es5`](https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es5) branch maintains feature parity for older browsers (ex: Android 4.x WebView)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
