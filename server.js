  var finalhandler = require('finalhandler')
  var http = require('http')
  var serveStatic = require('serve-static')

  var serve = serveStatic(__dirname)

  // Create server
  var server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res))
  })

  // Listen
  server.listen(8080)
