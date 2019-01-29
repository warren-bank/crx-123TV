// http://123tv.live/category/united-states-usa/
// http://123tv.live/category/united-kingdom-uk/
// http://123tv.live/category/france-fr/

jQuery(document).ready(function($){
  let data = []
  let $a = $('div.videos-latest-list > div > div.video-latest-list > div.video-title > a')

  $a.each(function(){
    let href = this.href
    let name = $(this).find('h4[title]:first').attr('title')

    data.push([href,name])
  })

  data.sort(function(a, b){
    let nameA = a[1].toLowerCase()
    let nameB = b[1].toLowerCase()
    return (nameA < nameB)
      ? -1
      : (nameA > nameB)
        ? 1
        : 0
  })

  let md   = ''
  let html = ''
  let i

  for (i=0; i<data.length; i++) {
    let href = data[i][0]
    let name = data[i][1]

    md   += `  * [${name}](${href})\n`
    html += `                <li><a href="${href}">${name}</a></li>\n`
  }

  console.log("\n----------------------------------------\n")
  console.log('md:')
  console.log(md)
  console.log("\n----------------------------------------\n")
  console.log('html:')
  console.log(html)
  console.log("\n----------------------------------------\n")

  // console.log is disabled
  // use SweetAlert2 instead:
  //   https://github.com/sweetalert2/sweetalert2
  //   https://github.com/sweetalert2/sweetalert2/tree/v6.10.2

  $('head').append('<style type="text/css">.swal2-modal.swal2-show {width: 95% !important} .swal2-modal.swal2-show #swal2-content {text-align: left} .swal2-modal.swal2-show #swal2-content xmp {font-family: monospace; font-size: 0.75em; white-space:pre-wrap;}</style>')

  swal({
    type: 'info',
    title: 'md:',
    html: `<xmp>${md}</xmp>`
  })
  .then(() => {
    swal({
      type: 'info',
      title: 'html:',
      html: `<xmp>${html}</xmp>`
    })
  })
})
