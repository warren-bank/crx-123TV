// ==UserScript==
// @name         TV123
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://123tvnow.com/watch/*
// @icon         http://123tvnow.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-start
// @homepage     https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// =============================================================================

var get_hls_url = function() {
  var hls_url = null
  try {
    hls_url = jwplayer().getPlaylistItem().sources[0].file
  }
  catch(e){}
  return hls_url
}

// =============================================================================

var get_referer_url = function() {
  var referer_url
  try {
    referer_url = unsafeWindow.top.location.href
  }
  catch(e) {
    referer_url = unsafeWindow.location.href
  }
  return referer_url
}

// =============================================================================

var process_page = function(show_error) {
  var hls_url = get_hls_url()

  if (hls_url) {
    var extras = ['referUrl', get_referer_url()]

    var args = [
      'android.intent.action.VIEW',  /* action */
      hls_url,                       /* data   */
      'application/x-mpegurl'        /* type   */
    ]

    for (var i=0; i < extras.length; i++) {
      args.push(extras[i])
    }

    GM_startIntent.apply(this, args)
  }
  else if (show_error) {
    GM_toastShort('video not found')
  }

  return (!!hls_url)
}

// =============================================================================

var count = 15

var timer = unsafeWindow.setInterval(
  function() {
    if (count <= 1) unsafeWindow.clearInterval(timer)
    if (count <= 0) return
    if (process_page((count === 1)))
      count = 0
    else
      count--
  },
  1000
)
