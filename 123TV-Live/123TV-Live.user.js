// ==UserScript==
// @name 123TV Live
// @description Removes clutter and reduces CPU load.
// @version 0.1.0
// @match *://123tv.live/watch/*
// @icon http://123tv.live/wp-content/themes/123tv/img/icon.png
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var payload = function(){
  var iframe_html = document.querySelector('.video-player-page iframe').outerHTML

  document.head.innerHTML    = ''
  document.body.style.margin = '0'
  document.body.innerHTML    = '<div style="height:' + (document.documentElement.clientHeight-4) + 'px;">' + iframe_html + '</div>'
}

var inject_payload = function(){
  var inline, script, head

  inline = document.createTextNode(
    '(' + payload.toString() + ')()'
  )

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.getElementsByTagName('head')[0]
  head.appendChild(script)
}

if (document.readyState === 'complete'){
  inject_payload()
}
else {
  document.onreadystatechange = function(){
    if (document.readyState === 'complete'){
      inject_payload()
    }
  }
}
