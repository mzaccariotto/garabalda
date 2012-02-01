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

var vowels = ['a', 'e', 'i', 'o', 'u'];
var bVowels = ['A', 'E', 'I', 'O', 'U'];

function translate(input, letter) {
	for(var v in vowels) {
		var re = new RegExp(vowels[v], 'g');
		input = input.replace(re, letter.toLowerCase());
		var re = new RegExp(bVowels[v], 'g');
		input = input.replace(re, letter.toUpperCase());
	}
	return input;
}

function start(query, response) {
	data = {"s": ""};
	letter = 'A';
	if (query["l"] != undefined && vowels.concat(bVowels).indexOf(query['l']) != -1) {
		letter = query["l"];
	}
	if (query["s"]!= undefined) {
		data["s"] = translate(query["s"], letter);
	}
	render_template('index.html', data, response);
}

function garabald(query, response) {
	input = query['text'];
	letter = query['letter'];
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write(JSON.stringify(translate(input, letter)));
	response.end();
}


exports.start = start;
exports.serve_static = serve_static;
exports.garabald = garabald;