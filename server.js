var http = require("http");
var url = require("url");
var port = process.env.PORT || 8888;

function route(handle, pathname, query, response) {
  console.log("About to route a request for " + pathname);
  if (typeof handle[pathname] === 'function') {
      return handle[pathname](query, response);
  } else {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write('Not Found!');
      response.end();
  }
}

function start(route, handle) {
  function onRequest(request, response) {
    var parsed = url.parse(request.url, true);
    var query = parsed.query;
    var pathname = parsed.pathname;
    console.log("Request for " + pathname + " received");
    route(handle, pathname, query, response);
  }

  http.createServer(onRequest).listen(port);
  console.log("Server has started.");
}

exports.start = start;
exports.route = route;
