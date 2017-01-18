package data;

class Manager {
	public static var cnx(default, set) : String;
	static function set_cnx(filename : String) : String {
		cnx = filename;
		db = null;
		return cnx;
	}
	
	public static var db(get, null) : HaxeLow;
	static function get_db() : HaxeLow {
		if (db == null) {
			db = new HaxeLow(cnx);
		}
		return db;
	}
	
	
	var objClass : Class<Dynamic>; //générique
	
	//~ public function new(objClass : Class<Dynamic>) {
		//~ this.objClass = objClass;
	//~ }
	public function new(className : String) {
		this.objClass = Type.resolveClass(className);
	}
	
	public function all() : Dynamic { //Array<Dynamic>
		return db.col(objClass);
	}
	
	public function get(id : String) : Dynamic {
		return db.idCol(objClass).idGet(id);
	}
	
	public function search(params : Dynamic) : Array<Dynamic> {
		var items = new Array();
		var all : Array<Dynamic> = this.all();
		for (e in all) {
			var equals = true;
			for (f in Reflect.fields(params)) {
				if (Reflect.field(e, f) != Reflect.field(params, f)) {
					equals = false;
					break;
				}
			}
			if (equals) {
				items.push(e);
			}
		}
		return items;
	}
}
