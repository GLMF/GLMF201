package controlers;
import haxe.Resource;
import haxe.Template;
import haxe.Json;
import js.node.http.IncomingMessage;
import js.node.http.ServerResponse;
using StringTools;

class Author {
	public static function dispatch(id : String, req : IncomingMessage, res : ServerResponse, data : models.Author) {
		switch (req.method) {
			case "GET":
				if (id == null) {
					retrieveAuthors(req, res);
				} else {
					throw new APIError(400, "Bad Request: can't get author's detail");
				}
			case "POST":
				if (id == null) {
					createAuthor(req, res, data);
				} else {
					if (data == null) deleteAuthor(id, req, res);
					else updateAuthor(id, req, res, data);
				}
			case "PUT": updateAuthor(id, req, res, data);
			case "DELETE": deleteAuthor(id, req, res);
			default: throw new APIError(405, "Method not allowed: " + req.method);
		}
	}
	
	public static function retrieveAuthors(req : IncomingMessage, res : ServerResponse) {
		var authors : Array<models.Author> = models.Author.manager.all();
		if (req.headers.get("accept") == "application/json") {
			res.setHeader("content-type", "application/json");
			res.end(Json.stringify(authors));
		} else {
			var page : String = Resource.getString("index");
			var part : String = Resource.getString("part-author-list");
			var subTpl : Template = new Template(part);
			var content : String = subTpl.execute({ authors : authors });
			var tpl : Template = new Template(page);
			var html : String = tpl.execute({ part : content });
			res.end(html);
		}
	}
	
	public static function createAuthor(req : IncomingMessage, res : ServerResponse, data : models.Author) {
		if (data == null || data.firstname == "" || data.lastname == "") {
			new APIError(400, "Missing data");
		}
		var a : models.Author = new models.Author(data.firstname.htmlEscape(), data.lastname.htmlEscape());
		a.insert();
		if (req.headers.get("accept") == "application/json") {
			res.setHeader("content-type", "application/json");
			res.end('{"id":"' + a.id +'"}');
		} else {
			res.writeHead(302, { location : "/author" });
			res.end();
		}
	}
	
	public static function updateAuthor(id : String, req : IncomingMessage, res : ServerResponse, data : models.Author) {
		if (data == null || data.firstname == "" || data.lastname == "") {
			new APIError(400, "Missing data");
		}
		var a : models.Author = models.Author.manager.get(id);
		if (a == null) {
			throw new APIError(404, "Author not found: " + id);
		}
		a.firstname = data.firstname.htmlEscape();
		a.lastname = data.lastname.htmlEscape();
		a.update();
		if (req.headers.get("accept") == "application/json") {
			res.end();
		} else {
			res.writeHead(302, { location : "/author" });
			res.end();
		}
	}
	
	public static function deleteAuthor(id : String, req : IncomingMessage, res : ServerResponse) {
		var a : models.Author = models.Author.manager.get(id);
		if (a == null) {
			throw new APIError(404, "Author not found: " + id);
		}
		a.delete();
		if (req.headers.get("accept") == "application/json") {
			res.end();
		} else {
			res.writeHead(301, { location : "/author" });
			res.end();
		}
	}
}
