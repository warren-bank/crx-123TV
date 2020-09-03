// ==UserScript==
// @name         TV123
// @description  Watch videos in external player.
// @version      3.0.0
// @match        *://123tvnow.com/watch/*
// @icon         http://123tvnow.com/wp-content/themes/123tv_v2/img/icon.png
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-123TV/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-123TV/issues
// @downloadURL  https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
// @updateURL    https://github.com/warren-bank/crx-123TV/raw/webmonkey-userscript/es5/webmonkey-userscript/123TV.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// =============================================================================
/*
 * This ES5 variation is intented to be run in older versions of Android (ie: WebKit, Chrome 30).
 * In this context, JW Player fails to initialize.. and the normal method to retrieve the HLS video URL from JW Player also fails.
 * A fallback strategy is to extract and evaluate javascript from the page source.
 *
 * example:
 * ========
 * page = view-source:http://123tvnow.com/watch/abc/
 * code:
 *   var _0x49acb3=_0x3b07f1=>{_0x3b07f1=['eyJjaXBoZXJ0ZXh0IjoiRENtQ0dITWdGaUpRbThJWFFRaUVBTVlTSTFrSlJ1bzJiSk1ab0VKTGpBWFlwVlJqRUpGc2YwMHpKMllVUDJ3UWdQNnlsVnNpcFZNQTBzU1o1cmpzNzVPZXU3c25JU00wTFR5WHJXeG8xMjFubkZaTVwvWGk0ZkY1Q09RUkFLWVJ3IiwiaXYiOiJjYWVlMTAzOTlkZDdlNTAxY2IxOTM3MDA4NGQzYW','E3ZiIsInNhbHQiOiI1NjViZTA3YzhiMTNmMjczOTQ0MzQxNDY1NDY0OThjYzJhM2ZmODdiNWY1MjFhMmM5MDczNzY5OGE4ZmQyNzU2NmZjYTdlNzc1OTVkMzM3YTBiZmM0ZTM5OWVmOGFkZTAzOGY4ZDQ3OTIxNWZhNjc1MDE2YWY2NGRkODY1MWE2YmEyNjZlOTE4MWFlZjM0NWEwYjllYmYyNzY1NTg1OTcyMzkzMTRjZWFj','ZDRkYTY3YjJlMmMzYjE4MzdlNWI3Y2E3ZDczMDM0YzA4NThkM2M0MzRhMjNmM2Y5YTRmMzdiMWJkMGE0OWQ2N2QzNjIzYzIzNGRlNWZiNTY4ZjA2MzY5M2MxOWMwZWFkYjdhNjhhZGJkNTk3YjBiZWRjMDA3MWU5Nzk3ZjY5YWQ0YWYwYTI3MjkzODBhZDllMjI4ZmM5Y2M0ZTkzZDE4ODkzMDg5MDUyNmI0ZjBjOTk5MzllNT','U4YmE3NjYwNzA1OWQyZTdmMmUxNGIxZjEyNTY1Zjg0MzRhYjZkMjA4Nzk5YzYyNTZlNWMyNjc3ZTE3OTFiM2MwNzc1MGQ0MTE2NmU3MWNhMWY5YmU3ZGQ1ZTg4NTJjYmNiMTVhMTU2MTNiNzAxM2ZiZTQ2ODk3NTQwMzQxNTdjYjNkMzAyZWQ2N2YyMzJkMGMxNzA3YTFhNmU5N2M5OWViZiIsIml0ZXJhdGlvbnMiOjk5OX0=',''];return _0x3b07f1.join('');}
 *   var _0xdea76=_0xd93475=>{_0x34a189=[101,57,98,51];_0x769cd4=[102,52,100,99];_0xcd4a=[54,49,56,50];_0x685a2e=[55,48,53,97];_0x34a189=_0x34a189.concat(_0x769cd4);_0x34a189=_0x34a189.concat(_0xcd4a);_0xd93475=_0x34a189.concat(_0x685a2e);return _0xd93475.map(e=>String.fromCharCode(e)).reverse().join('');}
 *   var _0x4fce28=E['d'](_0x49acb3('dea9501862'),_0xdea76('81e03c2'));
 * result:
 *   _0x4fce28 === 'http://get.123tv.live/channel/6f315272796a396432693734396130494d35776653413d3d/23/abc.m3u8'
 * however:
 *   - video players refuse to play this manifest
 *   - even ExoAirPlayer doesn't play it, and that's when the Referer header is properly configured
 * test:
 *   curl -H 'Referer: http://123tvnow.com/watch/abc/' 'http://get.123tv.live/channel/6f315272796a396432693734396130494d35776653413d3d/23/abc.m3u8'
 * result:
 *   'http://hls.123tv.live/ch/nPABQAnsjNp8TzV4YAVMGw/1599132770/abc.m3u8'
 *
 * Consequently, after the javascript is evaluated and the 1st HLS URL is obtained..
 * need to make a second XHR call to resolve the 2nd HSL URL that is able to be played by external video players.
 * Unfortunately, ES5 means that the code will need to be restructured to use a callback.. since Promise and async/await are not available.
 */

var get_hls_url = function(cb) {
  var hls_url = null
  var patterns = {
    extraction_start: "$(document).ready(function(){var post_id=parseInt($('#video-id').val());",
    extraction_stop:  ";if(",
    replacements: [
      {
        s: /var [^=]+=[^=]+=>{var [^=]+=(E\['d'\])/,
        r: 'return $1'
      },
      {
        // the purpose of this replacement is to convert ES6 functions to ES5 syntax
        s: /([^=]+)=>{/g,
        r: 'function($1){'
      },
      {
        // the purpose of this replacement is to convert ES6 functions to ES5 syntax
        s: 'e=>String.fromCharCode(e)',
        r: 'function(e){return String.fromCharCode(e);}'
      }
    ]
  }
  try {
    var scripts, script, index, sr
    scripts = document.querySelectorAll('script')
    scripts = Array.prototype.slice.call(scripts)

    for (var i=0; !hls_url && (i < scripts.length); i++) {
      script = scripts[i].innerText

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
  xhr.send()
}

// =============================================================================

var get_referer_url = function() {
  var referer_url
  try {
    referer_url = window.top.location.href
  }
  catch(e) {
    referer_url = window.location.href
  }
  return referer_url
}

// =============================================================================

var process_page = function(show_error, cb) {
  get_hls_url(function(hls_url){
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

    cb(!!hls_url)
  })
}

// =============================================================================

var init = function() {
  process_page(false, function(success){
    var count, timer

    if (!success) {
      count = 15
      timer = window.setInterval(
        function() {
          if (count <= 1) window.clearInterval(timer)
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

// =============================================================================

init()
