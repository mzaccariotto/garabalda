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
	render_template('index.html', {}, response);
}

function garabald(query, response) {
	input = query['text'];
	letter = query['letter'];
	vowels = ['a', 'e', 'i', 'o', 'u'];
	bVowels = ['A', 'E', 'I', 'O', 'U'];
	for(var v in vowels) {
		var re = new RegExp(vowels[v], 'g');
		input = input.replace(re, letter.toLowerCase());
		var re = new RegExp(bVowels[v], 'g');
		input = input.replace(re, letter.toUpperCase());
	}
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write(JSON.stringify(input));
	response.end();
}


exports.start = start;
exports.serve_static = serve_static;
exports.garabald = garabald;