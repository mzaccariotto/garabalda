var http = require("http");
var url = require("url");
var port = process.env.PORT || 8888;

function route(handle, pathname, query, response) {
  console.log("routing request for " + pathname);
  if (typeof handle[pathname] === 'function') {
      	return handle[pathname](query, response);
  } else if (typeof handle['/serve_static'] === 'function') {
      	return handle['/serve_static'](pathname, query, response);
  } else {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('404: Not found!');
      	response.end();
  }
}

function start(route, handle) {
  function onRequest(request, response) {
    var parsed = url.parse(request.url, true);
    var query = parsed.query;
    var pathname = parsed.pathname;
    route(handle, pathname, query, response);
  }

  http.createServer(onRequest).listen(port);
  console.log("Server has started.");
}

exports.start = start;
exports.route = route;
