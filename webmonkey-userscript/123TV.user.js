// ==UserScript==
// @name         TV123
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://123tvnow.com/watch/*
// @icon         http://123tvnow.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-start
// @homepage     https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es6
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es6/webmonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es6/webmonkey-userscript/123TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// =============================================================================

const get_hls_url = () => {
  let hls_url = null
  try {
    hls_url = jwplayer().getPlaylistItem().sources[0].file
  }
  catch(e){}
  return hls_url
}

// =============================================================================

const get_referer_url = () => {
  let referer_url
  try {
    referer_url = unsafeWindow.top.location.href
  }
  catch(e) {
    referer_url = unsafeWindow.location.href
  }
  return referer_url
}

// =============================================================================

const process_page = (show_error) => {
  const hls_url = get_hls_url()

  if (hls_url) {
    const extras = ['referUrl', get_referer_url()]

    GM_startIntent(/* action= */ 'android.intent.action.VIEW', /* data= */ hls_url, /* type= */ 'application/x-mpegurl', /* extras: */ ...extras)
  }
  else if (show_error) {
    GM_toastShort('video not found')
  }

  return (!!hls_url)
}

// =============================================================================

let count = 15

let timer = unsafeWindow.setInterval(
  () => {
    if (count <= 1) unsafeWindow.clearInterval(timer)
    if (count <= 0) return
    if (process_page((count === 1)))
      count = 0
    else
      count--
  },
  1000
)
