// ==UserScript==
// @name         TV123
// @description  Watch videos in external player.
// @version      1.1.1
// @match        *://123tvnow.com/watch/*
// @match        *://live94today.com/watch/*
// @icon         http://live94today.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-start
// @homepage     https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es6
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es6/webmonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es6/webmonkey-userscript/123TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!referer_url)
    referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  return process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  return process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- display message

var display_message = function(msg) {
  if (typeof GM_toastShort === 'function') {
    // running in Android-WebMonkey: show Toast
    GM_toastShort(msg)
  }
  else {
    // running in standard web browser: show alert dialog
    unsafeWindow.alert(msg)
  }
}

// ----------------------------------------------------------------------------- update DOM for current channel

var update_page_DOM = function() {
  var video_player = unsafeWindow.document.getElementById('123tv-player')
  var channel_epg  = unsafeWindow.document.querySelector('iframe[src*="/epg/"]')

  if (!video_player)
    return

  unsafeWindow.document.body.innerHTML    = ''
  unsafeWindow.document.body.style.margin = '0'
  unsafeWindow.document.body.appendChild(video_player)

  if (channel_epg)
    unsafeWindow.document.body.appendChild(channel_epg)

  try {
    unsafeWindow.jwplayer().play()
  }
  catch(e){}
}

// ----------------------------------------------------------------------------- process video for current channel

var get_hls_url = function() {
  var hls_url = null
  try {
    hls_url = unsafeWindow.jwplayer().getPlaylistItem().sources[0].file
  }
  catch(e){}
  return hls_url
}

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

var process_page = function(show_error) {
  var hls_url, did_redirect

  hls_url = get_hls_url()

  if (hls_url) {
    did_redirect = process_hls_url(hls_url)

    if (!did_redirect)
      update_page_DOM()
  }
  else if (show_error) {
    display_message('video not found')
  }

  return (!!hls_url)
}

// ----------------------------------------------------------------------------- bootstrap: wait 1 sec after each failed attempt; timeout after 15x failed attempts

var init = function() {
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
}

init()

// -----------------------------------------------------------------------------
