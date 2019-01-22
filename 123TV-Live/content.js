var payload = function(){
  var iframe_html = document.querySelector('.video-player-page iframe').outerHTML

  document.head.innerHTML    = ''
  document.body.style.margin = '0'
  document.body.innerHTML    = '<div style="height:' + (document.documentElement.clientHeight-4) + 'px;">' + iframe_html + '</div>'
}

var inject_function = function(_function){
  var inline, script, head

  inline = document.createTextNode(
    '(' + _function.toString() + ')()'
  )

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.head
  head.appendChild(script)
}

if (document.readyState === 'complete'){
  inject_function(payload)
}
else {
  document.addEventListener("DOMContentLoaded", function(event) {
    inject_function(payload)
  })
}
