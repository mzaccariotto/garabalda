var server = require("./server");
var handlers = require("./handlers");

var handle = {}
handle["/"] = handlers.start;
handle["/start"] = handlers.start;
handle["/garabald"] = handlers.garabald;
handle["/messages"] = handlers.messages;
handle["/serve_static"] = handlers.serve_static;

server.start(server.route, handle);
