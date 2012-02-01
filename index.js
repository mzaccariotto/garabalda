var server = require("./server");
var handlers = require("./handlers");

var handle = {}
handle["/"] = handlers.start;
handle["/start"] = handlers.start;
handle["/upload"] = handlers.upload;

server.start(server.route, handle);