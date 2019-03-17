var payload = function(){
  var $, $player, css, redirect_page

  $ = window.jQuery
  if (!$) return

  $player = $('div#123tv-player:first')
  if (!$player.length) return

  $player
    .detach()
    .appendTo(
      $('body').empty()
    )

  css = []
  css.push('body > * {display:none;}')
  css.push('body > div.jwplayer.jw-flag-aspect-mode {display:block; height:' + document.documentElement.clientHeight + 'px !important;}')
  css.push('body > div#123tv-player {display:block; height:' + document.documentElement.clientHeight + 'px !important;}')

  $('head').append(
    $('<style></style>').text(css.join("\n"))
  )

  redirect_page = function(){
    try {
      let hls_url = jwplayer().getPlaylistItem().sources[0].file
      if (!hls_url) throw ''

      let webcast_reloaded_base
      if (window.filter_through_hls_proxy) {
      //webcast_reloaded_base  = 'https://warren-bank.github.io/crx-webcast-reloaded/external_website/proxy.html#/watch/'
        webcast_reloaded_base  = 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/proxy.html#/watch/'
      }
      else {
      //webcast_reloaded_base  = 'https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html#/watch/'
        webcast_reloaded_base  = 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/index.html#/watch/'
      }
      let encoded_hls_url      = encodeURIComponent(encodeURIComponent(btoa(hls_url)))
      let webcast_reloaded_url = webcast_reloaded_base + encoded_hls_url

      window.location = webcast_reloaded_url
    }
    catch(err) {}
  }

  if (window.open_in_webcast_reloaded) {
    setInterval(redirect_page, 100)
  }
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
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['open_in_webcast_reloaded','filter_through_hls_proxy'], (items) => {
      var _function = ''
      _function += 'function(){'
      for (var key in items){
        _function += `window['${key}'] = ${items[key]};`
      }
      _function += '}'
      inject_function(_function)
      resolve()
    })
  })
}

var inject_options_then_function = function(_function){
  inject_options()
  .then(() => {
    inject_function(_function)
  })
  .catch(() => {})
}

if (document.readyState === 'complete'){
  inject_options_then_function(payload)
}
else {
  document.addEventListener("DOMContentLoaded", function(event) {
    inject_options_then_function(payload)
  })
}
