var ejs = require("ejs");
var fs = require('fs');
var path = require('path');

function render_template(name, data, response) {
	var content = fs.readFileSync(name);
	html = ejs.render(content.toString(), data);
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(html);
	response.end();
}

function serve_static(pathname, query, response) {
	path.exists('.' + pathname, function(exists) {
		if (exists) {
			fs.readFile('.' + pathname, function (err, data) {
			  	if (err) throw err;
			  	response.writeHead(200, {'Content-Type': 'text/css'});
				response.write(data);
				response.end();
			});
		} else {
			response.writeHead(404);
            response.end();
		}
	});
}

function start(query, response) {
	var data = {
		'title': 'Garabalda'
	};
	render_template('index.html', data, response);
}


exports.start = start;
exports.serve_static = serve_static;
