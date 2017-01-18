import haxe.web.Dispatch;
import haxe.Json;
import js.Error;
import js.Node;
import js.node.Http;
import js.node.http.Server;
import js.node.http.IncomingMessage;
import js.node.http.ServerResponse;
import js.node.Fs;
import js.node.fs.Stats;
using StringTools;

class Listener {
	public static function start() {
		var srv : Server = Http.createServer(function(req : IncomingMessage, res : ServerResponse) {
			if (req.url.indexOf("/static") == 0) {
				handleStatic(req, res);
			} else {
				handleDynamic(req, res);
			}
		});
		var argv : Array<String> = js.Node.process.argv;
		var port : Int = 8080;
		if (argv.length == 3) {
			port = Std.parseInt(argv[2]);
		}
		srv.listen(port);
	}
	
	static function handleStatic(req : IncomingMessage, res : ServerResponse) {
		var filename : String = Node.__dirname + req.url;
		var extension : String = req.url.substr(req.url.lastIndexOf(".") + 1);
		var mimetype : String = null;
		switch (extension) {
			case "jpeg", "jpg": mimetype = "image/jpeg";
			case "png": mimetype = "image/png";
			case "css": mimetype = "text/css";
			case "html": mimetype = "text/html";
			case "js": mimetype = "text/javascript";
		}
		if (mimetype == null) {
			res.writeHead(400, "Forbidden file extension: '" + req.url + "'");
			res.end();
		} else {
			Fs.stat(filename, function(e : Error, infos : Stats) {
				if (infos == null) {
					res.writeHead(404, "File not found: '" + req.url + "'");
					res.end();
				} else {
					res.setHeader("Content-Type", mimetype);
					res.setHeader("Content-Length", Std.string(infos.size));
					Fs.createReadStream(filename).pipe(res);
				}
			});
		}
	}
	
	static function handleDynamic(req : IncomingMessage, res : ServerResponse) {
		var data : String = "";
		req.on("data", function(chunk : String) {
			data += chunk;
		});
		req.on("end", function() {
			try {
				var obj : Dynamic = null;
				if (data.length != 0) {
					obj = parseBody(data, req.headers.get("content-type"));
				}
				Dispatch.run(req.url, null, new Index(req, res, obj));
			} catch (e : DispatchError) {
				res.writeHead(400, "No route for '" + req.url + "'");
				res.end();
			} catch (e : APIError) {
				res.writeHead(e.code, e.reason);
				res.end();
			}
		});
	}
	
	static function parseBody(data : String, contentType : String) : Dynamic {
		var obj : Dynamic;
		
		data = data.replace("%C3", "").replace("%A0", "à").replace("%A2", "â").replace("%A4", "ä");
		data = data.replace("%A9", "é").replace("%A8", "è").replace("%AA", "ê").replace("%AB", "ë");
		data = data.replace("%AE", "î").replace("%AF", "ï");
		data = data.replace("%B4", "ô").replace("%B6", "ö");
		data = data.replace("%B9", "ù").replace("%BB", "û").replace("%BC", "ü");
		
		switch (contentType) {
			case "application/json": 
			try {
				obj = Json.parse(data);
			} catch (e : Error) {
				throw new APIError(400, "Invalid JSON");
			}
		case "application/x-www-form-urlencoded":
			obj = {};
			for (param in data.split("&")) {
				var i : Int = param.indexOf("=");
				if (i == -1) {
					throw new APIError(400, "Invalid form/urlencoded body");
				}
				Reflect.setField(obj, param.substr(0, i), param.substr(i+1));
			}
		default: obj = data; }
		return obj;
	}
}
	
