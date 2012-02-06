var ejs = require("ejs");
var fs = require('fs');
var path = require('path');
var http = require('http');
var querystring = require('querystring');
var redis_url = process.env.REDISTOGO_URL ||  "" ;
var redis = require('redis-url').createClient(redis_url);


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

var transform_matrix = {
	'A': ['a', 'á', 'à', 'ä', 'â', 'A', 'Á', 'À', 'Ä', 'Â'],
	'E': ['e', 'é', 'è', 'ë', 'ê', 'E', 'É', 'È', 'Ë', 'Ê'],
	'I': ['i', 'í', 'ì', 'ï', 'î', 'I', 'Í', 'Ì', 'Ï', 'Î'],
	'O': ['o', 'ó', 'ò', 'ö', 'ô', 'O', 'Ó', 'Ò', 'Ö', 'Ô'],
	'U': ['u', 'ú', 'ù', 'ü', 'û', 'U', 'Ú', 'Ù', 'Ü', 'Û']
}

function translate(input, vowel) {
	vowel = vowel.toUpperCase();
	for(var v in transform_matrix) {
		vowels = transform_matrix[v];
		for (var s in vowels) {
			symbol = vowels[s];
			var re = new RegExp(symbol, 'g');
			input = input.replace(re, transform_matrix[vowel][s]);
    	}
	}
	return input;
}

function register_last(letter, text) {
	redis.llen ('last_messages', function(err, length) {
	 	if (length > 10) {
	 		redis.lpop('last_messages');
	 	}
	});
	msg = querystring.stringify({'l': letter, 's': text});
	console.log(msg);
	redis.lrange ('last_messages', -10, 11, function(err, messages) {
	 	if (messages.indexOf(msg) == -1) {
		 	redis.rpush('last_messages', msg);
		 	redis.set('last_update', new Date().getTime());
		}
	});
}

function redirect(res, url) {
	res.writeHead(301, {'Location':url, 'Expires': (new Date).toGMTString()});
    res.end();
}

function start(query, response) {
	data = {"s": "", "orig": "", "caption": ""};
	letter = "A";
	if (query["l"] != undefined && transform_matrix[query['l'].toUpperCase()] != undefined) {
		query["l"] = decodeURIComponent(query["l"]);
		letter = query["l"];
	}
	letter = letter.toUpperCase();
	if (query["s"]!= undefined) {
		if (query["share"] != undefined && query["share"] == 'true') {
			register_last(letter, query["s"]);
			delete query['share'];
			redirect(response, 'start?' + querystring.stringify(query));
		}
		query["s"] = decodeURIComponent(query["s"]);
		data["orig"] = query["s"];
		data["s"] = translate(query["s"], letter);
		data["caption"] = data["s"].substring(0, 20) + "...";
	}
	data["curr_letter"] = letter;
	render_template('index.html', data, response);
}

function garabald(query, response) {
	input = query['text'];
	letter = query['letter'];
	response.writeHead(200, {'Content-Type': 'text/plain'});
	response.write(JSON.stringify(translate(input, letter)));
	response.end();
}


function messages(query, response) {
	redis.get('last_update', function(err, last_update) {
		redis.lrange ('last_messages', -10, 11, function(err, messages) {
			resp_msg = []
		 	for (i in messages) {
		 		query = querystring.parse(messages[i]);
		 		msg = {'title': translate(query["s"], query["l"]), 'href': '?' + messages[i]}
		 		resp_msg[i] = msg;
		 	}
		 	resp_msg.reverse();
		 	response.writeHead(200, {'Content-Type': 'text/plain'});
			response.write(JSON.stringify({'last_update': last_update, 'msgs': resp_msg }));
			response.end();
		});
	});
}


exports.start = start;
exports.serve_static = serve_static;
exports.garabald = garabald;
exports.messages = messages;

function test_translate() {
	t = translate('AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû', 'A');
	console.log('test A -> ' + (t == 'AÁÀÄÂAÁÀÄÂAÁÀÄÂAÁÀÄÂAÁÀÄÂaáàäâaáàäâaáàäâaáàäâaáàäâ AÁÀÄÂAÁÀÄÂAÁÀÄÂAÁÀÄÂAÁÀÄÂaáàäâaáàäâaáàäâaáàäâaáàäâ'));
	t = translate('AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû', 'E');
	console.log('test E -> ' + (t == 'EÉÈËÊEÉÈËÊEÉÈËÊEÉÈËÊEÉÈËÊeéèëêeéèëêeéèëêeéèëêeéèëê EÉÈËÊEÉÈËÊEÉÈËÊEÉÈËÊEÉÈËÊeéèëêeéèëêeéèëêeéèëêeéèëê'));
	t = translate('AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû', 'i');
	console.log('test I -> ' + (t == 'IÍÌÏÎIÍÌÏÎIÍÌÏÎIÍÌÏÎIÍÌÏÎiíìïîiíìïîiíìïîiíìïîiíìïî IÍÌÏÎIÍÌÏÎIÍÌÏÎIÍÌÏÎIÍÌÏÎiíìïîiíìïîiíìïîiíìïîiíìïî'));
	t = translate('AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû', 'O');
	console.log('test O -> ' + (t == 'OÓÒÖÔOÓÒÖÔOÓÒÖÔOÓÒÖÔOÓÒÖÔoóòöôoóòöôoóòöôoóòöôoóòöô OÓÒÖÔOÓÒÖÔOÓÒÖÔOÓÒÖÔOÓÒÖÔoóòöôoóòöôoóòöôoóòöôoóòöô'));
	t = translate('AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû AÁÀÄÂEÉÈËÊIÍÌÏÎOÓÒÖÔUÚÙÜÛaáàäâeéèëêiíìïîoóòöôuúùüû', 'u');
	console.log('test U -> ' + (t == 'UÚÙÜÛUÚÙÜÛUÚÙÜÛUÚÙÜÛUÚÙÜÛuúùüûuúùüûuúùüûuúùüûuúùüû UÚÙÜÛUÚÙÜÛUÚÙÜÛUÚÙÜÛUÚÙÜÛuúùüûuúùüûuúùüûuúùüûuúùüû'));
}
//test_translate();