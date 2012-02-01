var ejs = require("ejs");
var fs = require('fs');


function render_template(name, data, response) {
	var content = fs.readFileSync(name);
	html = ejs.render(content.toString(), data);
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write(html);
	response.end();
}

function start(query, response) {
	var data = {
		'title': 'Garabalda'
	};
	render_template('index.html', data, response);
}

exports.start = start;
