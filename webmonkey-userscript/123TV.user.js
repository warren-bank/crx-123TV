// ==UserScript==
// @name         TV123
// @description  Watch videos in external player.
// @version      3.1.1
// @match        *://123tvnow.com/watch/*
// @match        *://live94today.com/watch/*
// @icon         http://live94today.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
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

/*
 * This ES5 variation is intented to be run in older versions of Android (ie: WebKit, Chrome 30).
 * In this context, JW Player fails to initialize.. and the normal method to retrieve the HLS video URL from JW Player also fails.
 * A fallback strategy is to extract and evaluate javascript from the page source.
 *
 * example:
 * ========
 * page = view-source:http://live94today.com/watch/cbs/
 * code:
 *   var post_id = parseInt($('#'+'v'+'i'+'d'+'eo'+'-i'+'d').val());
 *   $(document).ready(function(){
 *
 *     const _0xe258=_0xd8b497=>{_0xd8b497=['eyJjaXBoZXJ0ZXh0IjoiT1cydVFSNjRrZVRtU0tVOFFka3BqcUhEdTV6dnR5ODJWaytyODVNYnArbVAxQUFWQlZvalZcL0MzWkpyRkdKU2d0WlZUZHZSMmlFUUozNkwwMnJaTFZyRHpFbGROV0dpMkdEa3ByUUd2S2lDbnU5UXdZVldpenBnRkJaUGMrUldMIiwiaXYiOiI0YWRkZTNlMDNiZDFhNDEzMzY5MDZjOTIwZjIzMD','VmMSIsInNhbHQiOiI5NTg5MjAyMGMxYTlhMDI5NWYwMzU0NDNiOTI0MWMzZTU4NzY0N2ZmMTdlZWRhNWE2ODIxNTc0OWZjODliOTNkZDFjN2U1ZmZmYmJjNmY5NzlkOGU4N2QyODQ1NmI5YzY5ZGVlMWM3ODkzMTFkMzU2ZGNmYTZjNjZhMTFmMjY3ODFmMjc5MGRmYWIzM2RmZjU1NGVlMjVhMzU5Y2JjZTY2MzY5YzIwMTYy','NDAzYjI4ZWIzZDFkYmI1ODk2ZmExNDJjNTk0OTU2YmI4ZDdjZjRjN2M4YWM5NWQ2MWYyNDQwNTRhOTM0MWViZjIzZTI4NWQ0YzI4YWUzNDdiYjRlMTk3MTY4ZDdmOTQzMTUzZDlhODM1M2FkYWIyYTcyMzFkMWEwNmFlMmZmYTU1YmJlZDRjMDE0OTQ2MzAwZmQ1Yjk5NWMxZjQ4NjU1MmI4NmI4ZWIyYmFhZTkzZTM4NTFkZD','ZkYmM3ZjEyYzY5MzBjMjEyZTM0Y2JhZjFmOGYyMjA5M2QzNWJkMzUzZGI3ZDQ0Zjk2ZjQ5MGUwM2RjNzY2NTI3YzdiZGJlMzQzMjFjMDRjYmNiNjY1NjJhYjYzOWQ3MmExOWY5NDAwM2MxZmJlYjM1YzE1Zjc4YjcxZTUwY2YwMGIxYjliZGE5MGEzY2JlMWE0Y2NiODc3NTM0NmIyMzlmYiIsIml0ZXJhdGlvbnMiOjk5OX0=',''];return _0xd8b497.join('');};
 *     var _0x214f=_0x2a804=>{_0x84fe0=[53,48,98,49];_0x6c4b59=[52,102,99,100];_0x31a29=[55,50,54,57];_0xef806d=[56,101,97,51];_0x84fe0=_0x84fe0.concat(_0x6c4b59);_0x84fe0=_0x84fe0.concat(_0x31a29);_0x2a804=_0x84fe0.concat(_0xef806d);return _0x2a804.map(e => String.fromCharCode(e)).reverse().join('');};
 *     var _0x35d096=_0xcf37=>{const _0x2435f6=E['d'](_0xe258('0d16ca5e'),_0x214f('d02851e9'));if(_0x2435f6.indexOf('get.123tv.live/channel/')==-1){ return [{file:_0x2435f6,type:"hls",title:"CBS",image:"http://live94today.com/wp-content/uploads/2018/09/cbs.png"}];} return _0x2435f6+'?1&json=Q0JTfHxodHRwOi8vbGl2ZTk0dG9kYXkuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE4LzA5L2Nicy5wbmc=';}
 *
 *     var options={key: "Vnn7CdANuVWTOVm3s3FoaikdB3wQeM3yDiTG0al5DLuFuLWaWY7UPBzRKV4=",playlist:_0x35d096(),
 *     //...} ...})
 * result:
 *   _0x35d096() === 'http://get.123tv.live/channel/67476e67756d3042442f786f52516a3478364e7252513d3d/489/cbs.m3u8?1&json=Q0JTfHxodHRwOi8vbGl2ZTk0dG9kYXkuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE4LzA5L2Nicy5wbmc='
 *
 * code w/ patch:
 *   (function(){
 *     const _0xe258=_0xd8b497=>{_0xd8b497=['eyJjaXBoZXJ0ZXh0IjoiT1cydVFSNjRrZVRtU0tVOFFka3BqcUhEdTV6dnR5ODJWaytyODVNYnArbVAxQUFWQlZvalZcL0MzWkpyRkdKU2d0WlZUZHZSMmlFUUozNkwwMnJaTFZyRHpFbGROV0dpMkdEa3ByUUd2S2lDbnU5UXdZVldpenBnRkJaUGMrUldMIiwiaXYiOiI0YWRkZTNlMDNiZDFhNDEzMzY5MDZjOTIwZjIzMD','VmMSIsInNhbHQiOiI5NTg5MjAyMGMxYTlhMDI5NWYwMzU0NDNiOTI0MWMzZTU4NzY0N2ZmMTdlZWRhNWE2ODIxNTc0OWZjODliOTNkZDFjN2U1ZmZmYmJjNmY5NzlkOGU4N2QyODQ1NmI5YzY5ZGVlMWM3ODkzMTFkMzU2ZGNmYTZjNjZhMTFmMjY3ODFmMjc5MGRmYWIzM2RmZjU1NGVlMjVhMzU5Y2JjZTY2MzY5YzIwMTYy','NDAzYjI4ZWIzZDFkYmI1ODk2ZmExNDJjNTk0OTU2YmI4ZDdjZjRjN2M4YWM5NWQ2MWYyNDQwNTRhOTM0MWViZjIzZTI4NWQ0YzI4YWUzNDdiYjRlMTk3MTY4ZDdmOTQzMTUzZDlhODM1M2FkYWIyYTcyMzFkMWEwNmFlMmZmYTU1YmJlZDRjMDE0OTQ2MzAwZmQ1Yjk5NWMxZjQ4NjU1MmI4NmI4ZWIyYmFhZTkzZTM4NTFkZD','ZkYmM3ZjEyYzY5MzBjMjEyZTM0Y2JhZjFmOGYyMjA5M2QzNWJkMzUzZGI3ZDQ0Zjk2ZjQ5MGUwM2RjNzY2NTI3YzdiZGJlMzQzMjFjMDRjYmNiNjY1NjJhYjYzOWQ3MmExOWY5NDAwM2MxZmJlYjM1YzE1Zjc4YjcxZTUwY2YwMGIxYjliZGE5MGEzY2JlMWE0Y2NiODc3NTM0NmIyMzlmYiIsIml0ZXJhdGlvbnMiOjk5OX0=',''];return _0xd8b497.join('');};
 *     var _0x214f=_0x2a804=>{_0x84fe0=[53,48,98,49];_0x6c4b59=[52,102,99,100];_0x31a29=[55,50,54,57];_0xef806d=[56,101,97,51];_0x84fe0=_0x84fe0.concat(_0x6c4b59);_0x84fe0=_0x84fe0.concat(_0x31a29);_0x2a804=_0x84fe0.concat(_0xef806d);return _0x2a804.map(e => String.fromCharCode(e)).reverse().join('');};
 *     return E['d'](_0xe258('0d16ca5e'),_0x214f('d02851e9'));
 *   })()
 * result:
 *   'http://get.123tv.live/channel/67476e67756d3042442f786f52516a3478364e7252513d3d/489/cbs.m3u8'
 *
 * however:
 *   - video players refuse to play this manifest
 *   - even ExoAirPlayer doesn't play it, and that's when the Referer header is properly configured
 *
 * test #1:
 *   curl -H 'Referer: http://live94today.com/watch/cbs/' 'http://get.123tv.live/channel/67476e67756d3042442f786f52516a3478364e7252513d3d/489/cbs.m3u8?1&json=Q0JTfHxodHRwOi8vbGl2ZTk0dG9kYXkuY29tL3dwLWNvbnRlbnQvdXBsb2Fkcy8yMDE4LzA5L2Nicy5wbmc='
 * result:
 *   [{"file":"http:\/\/get.123tv.live\/channel\/demo.mp4","title":"123TVNow - Watch Live USA TV","image":"http:\/\/123tvnow.com\/wp-content\/uploads\/2018\/08\/fox-news-1024x576.jpg","type":"mp4"}]
 *
 * test #2:
 *   curl -H 'Referer: http://live94today.com/watch/cbs/' 'http://get.123tv.live/channel/67476e67756d3042442f786f52516a3478364e7252513d3d/489/cbs.m3u8'
 * result:
 *   http://get.123tv.live/channel/demo.mp4
 *
 * Consequently, after the javascript is evaluated and the 1st HLS URL is obtained..
 * need to make a second XHR call to resolve the 2nd HSL URL that is able to be played by external video players.
 */

var get_hls_url = function(cb) {
  var hls_url = null
  var patterns = {
    extraction_start: "var post_id = parseInt($('#'+'v'+'i'+'d'+'eo'+'-i'+'d').val()); $(document).ready(function(){",
    extraction_stop:  "} var options={",
    replacements: [
      {
        // the purpose of this replacement is to convert ES6 functions to ES5 syntax
        s: /(const|let) /g,
        r: 'var '
      },
      {
        // the purpose of this replacement is to unpack the last function and return a URL value
        s: /var [^=]+\s*=\s*[^=]+\s*=>\s*{var [^=]+\s*=\s*(E\['d'\])/,
        r: 'return $1'
      },
      {
        // the purpose of this replacement is to convert ES6 functions to ES5 syntax
        s: /([^=]+)\s*=>\s*{/g,
        r: 'function($1){'
      },
      {
        // the purpose of this replacement is to convert ES6 functions to ES5 syntax
        s: /(e)\s*=>\s*(String\.fromCharCode\(e\))/g,
        r: 'function($1){return $2;}'
      }
    ]
  }
  try {
    var scripts, script, index, sr
    scripts = document.querySelectorAll('script')
    scripts = Array.prototype.slice.call(scripts)

    for (var i=0; !hls_url && (i < scripts.length); i++) {
      script = scripts[i].innerText.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')

      index = script.indexOf(patterns.extraction_start)
      if (index < 0) continue
      script = script.substring(index + patterns.extraction_start.length)

      index = script.indexOf(patterns.extraction_stop)
      if (index < 0) continue
      script = script.substring(0, index)

      for (var j=0; j < patterns.replacements.length; j++) {
        sr = patterns.replacements[j]
        script = script.replace(sr.s, sr.r)
      }

      try {
        hls_url = eval('(function(){' + script + '})()')

        if (typeof hls_url !== 'string')    throw ''
        if (hls_url.indexOf('m3u8') === -1) throw ''
      }
      catch(e) {
        hls_url = null
      }
    }
  }
  catch(e){}
  resolve_hls_url(hls_url, cb)
}

var resolve_hls_url = function(url, cb) {
  if (!url || (typeof url !== 'string')) {
    cb(null)
    return
  }

  // short-circuit lookup if URL doesn't match pattern
  if (url.indexOf('://get.') === -1) {
    cb(url)
    return
  }

  var xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.onload = function() {
    cb(
      ((xhr.status >= 200) && (xhr.status < 300) && (xhr.responseText))
        ? xhr.responseText
        : url
    )
    xhr.abort()
  }
  xhr.onerror = function(e) {
    cb(url)
    xhr.abort()
  }
  xhr.send()
}

// -----------------------------------------------------------------------------

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

var process_page = function(show_error, cb) {
  get_hls_url(function(hls_url){
    if (hls_url) {
      var did_redirect = process_hls_url(hls_url)

      if (!did_redirect)
        update_page_DOM()
    }
    else if (show_error) {
      display_message('video not found')
    }

    cb(!!hls_url)
  })
}

// ----------------------------------------------------------------------------- bootstrap: wait 1 sec after each failed attempt; timeout after 15x failed attempts

var init = function() {
  process_page(false, function(success){
    var count, timer

    if (!success) {
      count = 15
      timer = unsafeWindow.setInterval(
        function() {
          if (count <= 1) unsafeWindow.clearInterval(timer)
          if (count <= 0) return

          process_page((count === 1), function(success){
            if (success)
              count = 0
            else
              count--
          })
        },
        1000
      )
    }
  })
}

init()

// -----------------------------------------------------------------------------
