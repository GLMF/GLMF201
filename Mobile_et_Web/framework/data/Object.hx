package data;
import haxe.macro.Expr;
import haxe.macro.Context;

@:autoBuild(data.ObjectStaticMethods.add()) class Object {
	public var id(default, null) : String;
	
	//~ #if ! macro
	public function new() {
		this.id = HaxeLow.uuid();
	}
	public function insert() { //create
		Manager.db.idCol(Type.getClass(this)).idInsert(this);
	}
	
	public function update() {
		Manager.db.idCol(Type.getClass(this)).idReplace(this);
	}
	
	public function delete() {
		Manager.db.idCol(Type.getClass(this)).idRemove(this.id);
	}
	//~ #end
}

class ObjectStaticMethods {
	macro public static function add() : Array<Field> {
		var className = Context.makeExpr(Context.getLocalClass().get().module, Context.currentPos());
		//~ var objClass = macro Type.resolveClass($className);
		var fields = Context.getBuildFields(); //champs de la classe
		fields.push({
			pos : Context.currentPos(),
			name : "manager", //nom du champ
			access : [Access.APublic, Access.AStatic],
			//~ kind : FieldType.FVar(macro : data.Manager, macro new data.Manager($objClass)) //type, valeur
			kind : FieldType.FVar(macro : data.Manager, macro new data.Manager($className)) //type, valeur
		});
		return fields;
	}
}
