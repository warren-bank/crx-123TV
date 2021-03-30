// ==UserScript==
// @name         123TV
// @description  Removes clutter to reduce CPU load. Can transfer video stream to alternate video players: WebCast-Reloaded, ExoAirPlayer.
// @version      0.2.2
// @match        *://123tvnow.com/watch/*
// @icon         http://123tvnow.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-idle
// @homepage     https://github.com/warren-bank/crx-123TV/tree/greasemonkey-userscript
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/greasemonkey-userscript/greasemonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/greasemonkey-userscript/greasemonkey-userscript/123TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var user_options = {
  "script_injection_delay_ms":    500,
  "videoplayer_poll_interval_ms": 500,
  "videoplayer_poll_timeout_ms":  10000,
  "redirect_to_webcast_reloaded": true,
  "force_http":                   true,
  "force_https":                  false
}

var payload = function(){

  const get_video_src = function() {
    let hls_url = null
    try {
      hls_url = jwplayer().getPlaylistItem().sources[0].file
    }
    catch(e){}
    return hls_url
  }

  const get_referer_url = function() {
    let referer_url
    try {
      referer_url = top.location.href
    }
    catch(e) {
      referer_url = window.location.href
    }
    return referer_url
  }

  const get_webcast_reloaded_url = (hls_url, vtt_url, referer_url) => {
    let encoded_hls_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

    encoded_hls_url       = encodeURIComponent(encodeURIComponent(btoa(hls_url)))
    encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
    referer_url           = referer_url ? referer_url : get_referer_url()
    encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

    webcast_reloaded_base = {
      "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
      "http":  "http://webcast-reloaded.surge.sh/index.html"
    }

    webcast_reloaded_base = (window.force_http)
                              ? webcast_reloaded_base.http
                              : (window.force_https)
                                 ? webcast_reloaded_base.https
                                 : (hls_url.toLowerCase().indexOf('http:') === 0)
                                    ? webcast_reloaded_base.http
                                    : webcast_reloaded_base.https

    webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_hls_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
    return webcast_reloaded_url
  }

  const redirect_to_url = function(url) {
    if (!url) return

    try {
      top.location = url
    }
    catch(e) {
      window.location = url
    }
  }

  const init = function() {
    const hls_url = get_video_src()

    if (hls_url && window.redirect_to_webcast_reloaded) {
      // transfer video stream

      redirect_to_url(get_webcast_reloaded_url(hls_url))
    }
    else {
      // tidy DOM

      const iframe_html = document.querySelector('.video-player-page iframe').outerHTML

      document.head.innerHTML    = ''
      document.body.style.margin = '0'
      document.body.innerHTML    = '<div style="height:' + (document.documentElement.clientHeight-4) + 'px;">' + iframe_html + '</div>'
    }
  }

  const max_intervals = Math.ceil(window.videoplayer_poll_timeout_ms / window.videoplayer_poll_interval_ms)
  let interval_count  = 0

  const init_when_ready = function() {
    const has_player = (typeof jwplayer === 'function')
    if (!has_player) return

    const is_ready = ((typeof jwplayer().getPlaylistItem === 'function') && jwplayer().getPlaylistItem() && Array.isArray(jwplayer().getPlaylistItem().sources) && jwplayer().getPlaylistItem().sources.length)
    if (!is_ready) {
      interval_count++

      if (interval_count <= max_intervals)
        setTimeout(init_when_ready, window.videoplayer_poll_interval_ms)

      return
    }

    init()
  }

  init_when_ready()
}

var get_hash_code = function(str){
  var hash, i, char
  hash = 0
  if (str.length == 0) {
    return hash
  }
  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i)
    hash = ((hash<<5)-hash)+char
    hash = hash & hash  // Convert to 32bit integer
  }
  return Math.abs(hash)
}

var inject_function = function(_function){
  var inline, script, head

  inline = _function.toString()
  inline = '(' + inline + ')()' + '; //# sourceURL=crx_extension.' + get_hash_code(inline)
  inline = document.createTextNode(inline)

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.head
  head.appendChild(script)
}

var inject_options = function(){
  var _function = `function(){
    window.videoplayer_poll_interval_ms = ${user_options['videoplayer_poll_interval_ms']}
    window.videoplayer_poll_timeout_ms  = ${user_options['videoplayer_poll_timeout_ms']}
    window.redirect_to_webcast_reloaded = ${user_options['redirect_to_webcast_reloaded']}
    window.force_http                   = ${user_options['force_http']}
    window.force_https                  = ${user_options['force_https']}
  }`
  inject_function(_function)
}

var bootstrap = function(){
  inject_options()
  inject_function(payload)
}

setTimeout(
  bootstrap,
  user_options['script_injection_delay_ms']
)
