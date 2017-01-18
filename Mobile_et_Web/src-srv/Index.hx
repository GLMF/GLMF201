import haxe.Resource;
import haxe.Template;
import js.node.http.IncomingMessage;
import js.node.http.ServerResponse;
import data.Manager;

class Index {
	static var changesCount : Int = 0;
	var req : IncomingMessage;
	var res : ServerResponse;
	var data : Dynamic; //libre (plusieurs possibilités)
	
	public function new(req : IncomingMessage,  res : ServerResponse, data : Dynamic) {
		this.req = req;
		this.res = res;
		this.data = data;
	}
	
	public function doDefault() {
		var page : String = Resource.getString("index");
		var content : String = Resource.getString("part-index");
		var tpl : Template = new Template(page);
		var html : String = tpl.execute({ part : content }); //fusion (cf ::part::)
		res.end(html);
	}
	
	public function doAuthor(?id : String = null) {
		controlers.Author.dispatch(id, req, res, data);
		handleWrites();
	}
	
	function handleWrites() {
		if (req.method == "POST" || req.method == "PUT" || req.method == "DELETE") {
			changesCount++;
		}
		if (changesCount > 10) {
			Manager.db.save();
			changesCount = 0;
		}
	}
	
	public static function main() {
		Manager.cnx = "lowdb.json";
		Listener.start();
	}
}
