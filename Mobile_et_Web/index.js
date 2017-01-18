(function (console, $global) { "use strict";
var $hxClasses = {},$estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var APIError = function(code,reason) {
	this.code = code;
	this.reason = reason;
};
$hxClasses["APIError"] = APIError;
APIError.__name__ = ["APIError"];
APIError.prototype = {
	code: null
	,reason: null
	,__class__: APIError
};
var EReg = function(r,opt) {
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
};
$hxClasses["EReg"] = EReg;
EReg.__name__ = ["EReg"];
EReg.prototype = {
	r: null
	,match: function(s) {
		if(this.r.global) this.r.lastIndex = 0;
		this.r.m = this.r.exec(s);
		this.r.s = s;
		return this.r.m != null;
	}
	,matched: function(n) {
		if(this.r.m != null && n >= 0 && n < this.r.m.length) return this.r.m[n]; else throw new js__$Boot_HaxeError("EReg::matched");
	}
	,matchedRight: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		var sz = this.r.m.index + this.r.m[0].length;
		return HxOverrides.substr(this.r.s,sz,this.r.s.length - sz);
	}
	,matchedPos: function() {
		if(this.r.m == null) throw new js__$Boot_HaxeError("No string matched");
		return { pos : this.r.m.index, len : this.r.m[0].length};
	}
	,__class__: EReg
};
var HaxeLowDisk = function() { };
$hxClasses["HaxeLowDisk"] = HaxeLowDisk;
HaxeLowDisk.__name__ = ["HaxeLowDisk"];
HaxeLowDisk.prototype = {
	readFileSync: null
	,writeFile: null
	,__class__: HaxeLowDisk
};
var NodeJsDisk = function() {
	this.steno = require("steno");
	try {
		this.fs = require("graceful-fs");
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		this.fs = require("steno/node_modules/graceful-fs");
	}
	if(this.steno == null) throw new js__$Boot_HaxeError("Node.js error: package 'steno' not found. Please install with 'npm install --save steno'");
};
$hxClasses["NodeJsDisk"] = NodeJsDisk;
NodeJsDisk.__name__ = ["NodeJsDisk"];
NodeJsDisk.__interfaces__ = [HaxeLowDisk];
NodeJsDisk.prototype = {
	steno: null
	,fs: null
	,readFileSync: function(file) {
		if(this.fs.existsSync(file)) return this.fs.readFileSync(file,{ encoding : "utf8"}); else return null;
	}
	,writeFile: function(file,data) {
		this.steno.writeFile(file,data,function(err) {
			if(err) throw new js__$Boot_HaxeError(err);
		});
	}
	,__class__: NodeJsDisk
};
var NodeJsDiskSync = function() {
	this.steno = require("steno");
	this.fs = require("graceful-fs");
	if(this.steno == null) throw new js__$Boot_HaxeError("Node.js error: package 'steno' not found. Please install with 'npm install --save steno'");
};
$hxClasses["NodeJsDiskSync"] = NodeJsDiskSync;
NodeJsDiskSync.__name__ = ["NodeJsDiskSync"];
NodeJsDiskSync.__interfaces__ = [HaxeLowDisk];
NodeJsDiskSync.prototype = {
	steno: null
	,fs: null
	,readFileSync: function(file) {
		if(this.fs.existsSync(file)) return this.fs.readFileSync(file,{ encoding : "utf8"}); else return null;
	}
	,writeFile: function(file,data) {
		this.steno.writeFileSync(file,data);
	}
	,__class__: NodeJsDiskSync
};
var SysDisk = function() {
};
$hxClasses["SysDisk"] = SysDisk;
SysDisk.__name__ = ["SysDisk"];
SysDisk.__interfaces__ = [HaxeLowDisk];
SysDisk.prototype = {
	readFileSync: function(file) {
		if(sys_FileSystem.exists(file)) return js_node_Fs.readFileSync(file,{ encoding : "utf8"}); else return null;
	}
	,writeFile: function(file,data) {
		js_node_Fs.writeFileSync(file,data);
	}
	,__class__: SysDisk
};
var HaxeLow = function(file,disk) {
	this.file = file;
	this.disk = disk;
	this.db = { };
	if(disk == null && file != null) this.disk = new NodeJsDisk();
	if(this.file != null) {
		if(this.disk == null) throw new js__$Boot_HaxeError("HaxeLow: no disk storage set.");
		this.checksum = this.disk.readFileSync(this.file);
		if(this.checksum != null) this.restore(this.checksum);
	}
};
$hxClasses["HaxeLow"] = HaxeLow;
HaxeLow.__name__ = ["HaxeLow"];
HaxeLow.uuid = function() {
	var uid = new StringBuf();
	var a = 8;
	uid.add(StringTools.hex(Std["int"](new Date().getTime()),8));
	while(a++ < 36) uid.add((a * 51 & 52) != 0?StringTools.hex((a ^ 15) != 0?8 ^ Std["int"](Math.random() * ((a ^ 20) != 0?16:4)):4):"-");
	return uid.b.toLowerCase();
};
HaxeLow.prototype = {
	file: null
	,db: null
	,checksum: null
	,disk: null
	,backup: function(file) {
		var backup = tjson_TJSON.encode(this.db,"fancy");
		if(file != null) this.disk.writeFile(file,backup);
		return backup;
	}
	,restore: function(s) {
		try {
			this.db = tjson_TJSON.parse(s);
			this.checksum = null;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			throw new js__$Boot_HaxeError("HaxeLow: JSON parsing failed: file \"" + this.file + "\" is corrupt. " + Std.string(e));
		}
		return this;
	}
	,save: function() {
		if(this.file == null) return this;
		var data = this.backup();
		if(data == this.checksum) return this;
		this.checksum = data;
		this.disk.writeFile(this.file,data);
		return this;
	}
	,col: function(cls) {
		var name = Type.getClassName(cls);
		if(!Object.prototype.hasOwnProperty.call(this.db,name)) {
			Reflect.setField(this.db,name,[]);
			this.save();
		}
		return Reflect.field(this.db,name);
	}
	,keyCol: function(cls,keyField,keyType) {
		var array = this.col(cls);
		var this1;
		this1 = array;
		if(keyField != null) this1.__haxeLowId = keyField;
		return this1;
	}
	,idCol: function(cls,keyType) {
		return this.keyCol(cls,"id",keyType);
	}
	,_idCol: function(cls,keyType) {
		return this.keyCol(cls,"_id",keyType);
	}
	,__class__: HaxeLow
};
var _$HaxeLowCol_HaxeLowCol_$Impl_$ = {};
$hxClasses["_HaxeLowCol.HaxeLowCol_Impl_"] = _$HaxeLowCol_HaxeLowCol_$Impl_$;
_$HaxeLowCol_HaxeLowCol_$Impl_$.__name__ = ["_HaxeLowCol","HaxeLowCol_Impl_"];
_$HaxeLowCol_HaxeLowCol_$Impl_$._new = function(array,keyField) {
	var this1;
	this1 = array;
	if(keyField != null) this1.__haxeLowId = keyField;
	return this1;
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.idGet = function(this1,id) {
	return Lambda.find(this1,function(o) {
		return Reflect.field(o,Reflect.field(this1,"__haxeLowId")) == id;
	});
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.idInsert = function(this1,obj) {
	if(_$HaxeLowCol_HaxeLowCol_$Impl_$.idGet(this1,Reflect.field(obj,Reflect.field(this1,"__haxeLowId"))) == null) {
		this1.push(obj);
		return true;
	}
	return false;
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.idUpdate = function(this1,id,props) {
	var exists = _$HaxeLowCol_HaxeLowCol_$Impl_$.idGet(this1,id);
	if(exists == null) return null;
	var _g = 0;
	var _g1 = Type.getInstanceFields(exists == null?null:js_Boot.getClass(exists));
	while(_g < _g1.length) {
		var field = _g1[_g];
		++_g;
		if(Object.prototype.hasOwnProperty.call(props,field)) Reflect.setProperty(exists,field,Reflect.field(props,field));
	}
	return exists;
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.idReplace = function(this1,obj) {
	var exists = _$HaxeLowCol_HaxeLowCol_$Impl_$.idGet(this1,Reflect.field(obj,Reflect.field(this1,"__haxeLowId")));
	if(exists != null) {
		if(exists == obj) return false;
		HxOverrides.remove(this1,exists);
	}
	this1.push(obj);
	return exists != null;
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.idRemove = function(this1,id) {
	var exists = _$HaxeLowCol_HaxeLowCol_$Impl_$.idGet(this1,id);
	if(exists == null) return null;
	HxOverrides.remove(this1,exists);
	return exists;
};
_$HaxeLowCol_HaxeLowCol_$Impl_$.keyValue = function(this1,obj) {
	return Reflect.field(obj,Reflect.field(this1,"__haxeLowId"));
};
var HxOverrides = function() { };
$hxClasses["HxOverrides"] = HxOverrides;
HxOverrides.__name__ = ["HxOverrides"];
HxOverrides.strDate = function(s) {
	var _g = s.length;
	switch(_g) {
	case 8:
		var k = s.split(":");
		var d = new Date();
		d.setTime(0);
		d.setUTCHours(k[0]);
		d.setUTCMinutes(k[1]);
		d.setUTCSeconds(k[2]);
		return d;
	case 10:
		var k1 = s.split("-");
		return new Date(k1[0],k1[1] - 1,k1[2],0,0,0);
	case 19:
		var k2 = s.split(" ");
		var y = k2[0].split("-");
		var t = k2[1].split(":");
		return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
	default:
		throw new js__$Boot_HaxeError("Invalid date format : " + s);
	}
};
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
HxOverrides.substr = function(s,pos,len) {
	if(pos != null && pos != 0 && len != null && len < 0) return "";
	if(len == null) len = s.length;
	if(pos < 0) {
		pos = s.length + pos;
		if(pos < 0) pos = 0;
	} else if(len < 0) len = s.length + len - pos;
	return s.substr(pos,len);
};
HxOverrides.indexOf = function(a,obj,i) {
	var len = a.length;
	if(i < 0) {
		i += len;
		if(i < 0) i = 0;
	}
	while(i < len) {
		if(a[i] === obj) return i;
		i++;
	}
	return -1;
};
HxOverrides.remove = function(a,obj) {
	var i = HxOverrides.indexOf(a,obj,0);
	if(i == -1) return false;
	a.splice(i,1);
	return true;
};
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Index = function(req,res,data) {
	this.req = req;
	this.res = res;
	this.data = data;
};
$hxClasses["Index"] = Index;
Index.__name__ = ["Index"];
Index.main = function() {
	data_Manager.set_cnx("lowdb.json");
	Listener.start();
};
Index.prototype = {
	req: null
	,res: null
	,data: null
	,doDefault: function() {
		var page = haxe_Resource.getString("index");
		var content = haxe_Resource.getString("part-index");
		var tpl = new haxe_Template(page);
		var html = tpl.execute({ part : content});
		this.res.end(html);
	}
	,doAuthor: function(id) {
		controlers_Author.dispatch(id,this.req,this.res,this.data);
		this.handleWrites();
	}
	,handleWrites: function() {
		if(this.req.method == "POST" || this.req.method == "PUT" || this.req.method == "DELETE") Index.changesCount++;
		if(Index.changesCount > 10) {
			data_Manager.get_db().save();
			Index.changesCount = 0;
		}
	}
	,__class__: Index
};
var Lambda = function() { };
$hxClasses["Lambda"] = Lambda;
Lambda.__name__ = ["Lambda"];
Lambda.find = function(it,f) {
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var v = $it0.next();
		if(f(v)) return v;
	}
	return null;
};
var List = function() {
	this.length = 0;
};
$hxClasses["List"] = List;
List.__name__ = ["List"];
List.prototype = {
	h: null
	,q: null
	,length: null
	,add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
	,push: function(item) {
		var x = [item,this.h];
		this.h = x;
		if(this.q == null) this.q = x;
		this.length++;
	}
	,first: function() {
		if(this.h == null) return null; else return this.h[0];
	}
	,pop: function() {
		if(this.h == null) return null;
		var x = this.h[0];
		this.h = this.h[1];
		if(this.h == null) this.q = null;
		this.length--;
		return x;
	}
	,isEmpty: function() {
		return this.h == null;
	}
	,iterator: function() {
		return new _$List_ListIterator(this.h);
	}
	,__class__: List
};
var _$List_ListIterator = function(head) {
	this.head = head;
	this.val = null;
};
$hxClasses["_List.ListIterator"] = _$List_ListIterator;
_$List_ListIterator.__name__ = ["_List","ListIterator"];
_$List_ListIterator.prototype = {
	head: null
	,val: null
	,hasNext: function() {
		return this.head != null;
	}
	,next: function() {
		this.val = this.head[0];
		this.head = this.head[1];
		return this.val;
	}
	,__class__: _$List_ListIterator
};
var Listener = function() { };
$hxClasses["Listener"] = Listener;
Listener.__name__ = ["Listener"];
Listener.start = function() {
	var srv = js_node_Http.createServer(function(req,res) {
		if(req.url.indexOf("/static") == 0) Listener.handleStatic(req,res); else Listener.handleDynamic(req,res);
	});
	var argv = process.argv;
	var port = 8080;
	if(argv.length == 3) port = Std.parseInt(argv[2]);
	srv.listen(port);
};
Listener.handleStatic = function(req,res) {
	var filename = __dirname + req.url;
	var extension;
	var pos = req.url.lastIndexOf(".") + 1;
	extension = HxOverrides.substr(req.url,pos,null);
	var mimetype = null;
	switch(extension) {
	case "jpeg":case "jpg":
		mimetype = "image/jpeg";
		break;
	case "png":
		mimetype = "image/png";
		break;
	case "css":
		mimetype = "text/css";
		break;
	case "html":
		mimetype = "text/html";
		break;
	case "js":
		mimetype = "text/javascript";
		break;
	}
	if(mimetype == null) {
		res.writeHead(400,"Forbidden file extension: '" + req.url + "'");
		res.end();
	} else js_node_Fs.stat(filename,function(e,infos) {
		if(infos == null) {
			res.writeHead(404,"File not found: '" + req.url + "'");
			res.end();
		} else {
			res.setHeader("Content-Type",mimetype);
			res.setHeader("Content-Length",infos.size == null?"null":"" + infos.size);
			js_node_Fs.createReadStream(filename).pipe(res);
		}
	});
};
Listener.handleDynamic = function(req,res) {
	var data = "";
	req.on("data",function(chunk) {
		data += chunk;
	});
	req.on("end",function() {
		try {
			var obj = null;
			if(data.length != 0) obj = Listener.parseBody(data,req.headers["content-type"]);
			new haxe_web_Dispatch(req.url,null).runtimeDispatch(haxe_web_Dispatch.extractConfig(new Index(req,res,obj)));
		} catch( $e0 ) {
			if ($e0 instanceof js__$Boot_HaxeError) $e0 = $e0.val;
			if( js_Boot.__instanceof($e0,haxe_web_DispatchError) ) {
				var e = $e0;
				res.writeHead(400,"No route for '" + req.url + "'");
				res.end();
			} else if( js_Boot.__instanceof($e0,APIError) ) {
				var e1 = $e0;
				res.writeHead(e1.code,e1.reason);
				res.end();
			} else throw($e0);
		}
	});
};
Listener.parseBody = function(data,contentType) {
	var obj;
	data = StringTools.replace(StringTools.replace(StringTools.replace(StringTools.replace(data,"%C3",""),"%A0","à"),"%A2","â"),"%A4","ä");
	data = StringTools.replace(StringTools.replace(StringTools.replace(StringTools.replace(data,"%A9","é"),"%A8","è"),"%AA","ê"),"%AB","ë");
	data = StringTools.replace(StringTools.replace(data,"%AE","î"),"%AF","ï");
	data = StringTools.replace(StringTools.replace(data,"%B4","ô"),"%B6","ö");
	data = StringTools.replace(StringTools.replace(StringTools.replace(data,"%B9","ù"),"%BB","û"),"%BC","ü");
	switch(contentType) {
	case "application/json":
		try {
			obj = JSON.parse(data);
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			if( js_Boot.__instanceof(e,Error) ) {
				throw new js__$Boot_HaxeError(new APIError(400,"Invalid JSON"));
			} else throw(e);
		}
		break;
	case "application/x-www-form-urlencoded":
		obj = { };
		var _g = 0;
		var _g1 = data.split("&");
		while(_g < _g1.length) {
			var param = _g1[_g];
			++_g;
			var i = param.indexOf("=");
			if(i == -1) throw new js__$Boot_HaxeError(new APIError(400,"Invalid form/urlencoded body"));
			Reflect.setField(obj,HxOverrides.substr(param,0,i),HxOverrides.substr(param,i + 1,null));
		}
		break;
	default:
		obj = data;
	}
	return obj;
};
Math.__name__ = ["Math"];
var Reflect = function() { };
$hxClasses["Reflect"] = Reflect;
Reflect.__name__ = ["Reflect"];
Reflect.field = function(o,field) {
	try {
		return o[field];
	} catch( e ) {
		if (e instanceof js__$Boot_HaxeError) e = e.val;
		return null;
	}
};
Reflect.setField = function(o,field,value) {
	o[field] = value;
};
Reflect.setProperty = function(o,field,value) {
	var tmp;
	if(o.__properties__ && (tmp = o.__properties__["set_" + field])) o[tmp](value); else o[field] = value;
};
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
};
Reflect.fields = function(o) {
	var a = [];
	if(o != null) {
		var hasOwnProperty = Object.prototype.hasOwnProperty;
		for( var f in o ) {
		if(f != "__id__" && f != "hx__closures__" && hasOwnProperty.call(o,f)) a.push(f);
		}
	}
	return a;
};
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && !(f.__name__ || f.__ename__);
};
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && v.__enum__ == null || t == "function" && (v.__name__ || v.__ename__) != null;
};
var Std = function() { };
$hxClasses["Std"] = Std;
Std.__name__ = ["Std"];
Std.string = function(s) {
	return js_Boot.__string_rec(s,"");
};
Std["int"] = function(x) {
	return x | 0;
};
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && (HxOverrides.cca(x,1) == 120 || HxOverrides.cca(x,1) == 88)) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
};
Std.parseFloat = function(x) {
	return parseFloat(x);
};
var StringBuf = function() {
	this.b = "";
};
$hxClasses["StringBuf"] = StringBuf;
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype = {
	b: null
	,add: function(x) {
		this.b += Std.string(x);
	}
	,__class__: StringBuf
};
var StringTools = function() { };
$hxClasses["StringTools"] = StringTools;
StringTools.__name__ = ["StringTools"];
StringTools.htmlEscape = function(s,quotes) {
	s = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	if(quotes) return s.split("\"").join("&quot;").split("'").join("&#039;"); else return s;
};
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && HxOverrides.substr(s,0,start.length) == start;
};
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
};
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
};
StringTools.fastCodeAt = function(s,index) {
	return s.charCodeAt(index);
};
var ValueType = $hxClasses["ValueType"] = { __ename__ : true, __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] };
ValueType.TNull = ["TNull",0];
ValueType.TNull.toString = $estr;
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.toString = $estr;
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.toString = $estr;
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.toString = $estr;
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.toString = $estr;
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.toString = $estr;
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; };
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.toString = $estr;
ValueType.TUnknown.__enum__ = ValueType;
var Type = function() { };
$hxClasses["Type"] = Type;
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null; else return js_Boot.getClass(o);
};
Type.getSuperClass = function(c) {
	return c.__super__;
};
Type.getClassName = function(c) {
	var a = c.__name__;
	if(a == null) return null;
	return a.join(".");
};
Type.resolveClass = function(name) {
	var cl = $hxClasses[name];
	if(cl == null || !cl.__name__) return null;
	return cl;
};
Type.resolveEnum = function(name) {
	var e = $hxClasses[name];
	if(e == null || !e.__ename__) return null;
	return e;
};
Type.createEmptyInstance = function(cl) {
	function empty() {}; empty.prototype = cl.prototype;
	return new empty();
};
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw new js__$Boot_HaxeError("No such constructor " + constr);
	if(Reflect.isFunction(f)) {
		if(params == null) throw new js__$Boot_HaxeError("Constructor " + constr + " need parameters");
		return Reflect.callMethod(e,f,params);
	}
	if(params != null && params.length != 0) throw new js__$Boot_HaxeError("Constructor " + constr + " does not need parameters");
	return f;
};
Type.createEnumIndex = function(e,index,params) {
	var c = e.__constructs__[index];
	if(c == null) throw new js__$Boot_HaxeError(index + " is not a valid enum constructor index");
	return Type.createEnum(e,c,params);
};
Type.getInstanceFields = function(c) {
	var a = [];
	for(var i in c.prototype) a.push(i);
	HxOverrides.remove(a,"__class__");
	HxOverrides.remove(a,"__properties__");
	return a;
};
Type.getEnumConstructs = function(e) {
	var a = e.__constructs__;
	return a.slice();
};
Type["typeof"] = function(v) {
	var _g = typeof(v);
	switch(_g) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c = js_Boot.getClass(v);
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ || v.__ename__) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
};
var controlers_Author = function() { };
$hxClasses["controlers.Author"] = controlers_Author;
controlers_Author.__name__ = ["controlers","Author"];
controlers_Author.dispatch = function(id,req,res,data) {
	var _g = req.method;
	switch(_g) {
	case "GET":
		if(id == null) controlers_Author.retrieveAuthors(req,res); else throw new js__$Boot_HaxeError(new APIError(400,"Bad Request: can't get author's detail"));
		break;
	case "POST":
		if(id == null) controlers_Author.createAuthor(req,res,data); else if(data == null) controlers_Author.deleteAuthor(id,req,res); else controlers_Author.updateAuthor(id,req,res,data);
		break;
	case "PUT":
		controlers_Author.updateAuthor(id,req,res,data);
		break;
	case "DELETE":
		controlers_Author.deleteAuthor(id,req,res);
		break;
	default:
		throw new js__$Boot_HaxeError(new APIError(405,"Method not allowed: " + req.method));
	}
};
controlers_Author.retrieveAuthors = function(req,res) {
	var authors = models_Author.manager.all();
	if(req.headers.accept == "application/json") {
		res.setHeader("content-type","application/json");
		res.end(JSON.stringify(authors));
	} else {
		var page = haxe_Resource.getString("index");
		var part = haxe_Resource.getString("part-author-list");
		var subTpl = new haxe_Template(part);
		var content = subTpl.execute({ authors : authors});
		var tpl = new haxe_Template(page);
		var html = tpl.execute({ part : content});
		res.end(html);
	}
};
controlers_Author.createAuthor = function(req,res,data) {
	if(data == null || data.firstname == "" || data.lastname == "") new APIError(400,"Missing data");
	var a = new models_Author(StringTools.htmlEscape(data.firstname),StringTools.htmlEscape(data.lastname));
	a.insert();
	if(req.headers.accept == "application/json") {
		res.setHeader("content-type","application/json");
		res.end("{\"id\":\"" + a.id + "\"}");
	} else {
		res.writeHead(302,{ location : "/author"});
		res.end();
	}
};
controlers_Author.updateAuthor = function(id,req,res,data) {
	if(data == null || data.firstname == "" || data.lastname == "") new APIError(400,"Missing data");
	var a = models_Author.manager.get(id);
	if(a == null) throw new js__$Boot_HaxeError(new APIError(404,"Author not found: " + id));
	a.firstname = StringTools.htmlEscape(data.firstname);
	a.lastname = StringTools.htmlEscape(data.lastname);
	a.update();
	if(req.headers.accept == "application/json") res.end(); else {
		res.writeHead(302,{ location : "/author"});
		res.end();
	}
};
controlers_Author.deleteAuthor = function(id,req,res) {
	var a = models_Author.manager.get(id);
	if(a == null) throw new js__$Boot_HaxeError(new APIError(404,"Author not found: " + id));
	a["delete"]();
	if(req.headers.accept == "application/json") res.end(); else {
		res.writeHead(301,{ location : "/author"});
		res.end();
	}
};
var data_Manager = function(className) {
	this.objClass = Type.resolveClass(className);
};
$hxClasses["data.Manager"] = data_Manager;
data_Manager.__name__ = ["data","Manager"];
data_Manager.__properties__ = {get_db:"get_db",set_cnx:"set_cnx"}
data_Manager.set_cnx = function(filename) {
	data_Manager.cnx = filename;
	data_Manager.db = null;
	return data_Manager.cnx;
};
data_Manager.get_db = function() {
	if(data_Manager.db == null) data_Manager.db = new HaxeLow(data_Manager.cnx);
	return data_Manager.db;
};
data_Manager.prototype = {
	objClass: null
	,all: function() {
		return data_Manager.get_db().col(this.objClass);
	}
	,get: function(id) {
		return _$HaxeLowCol_HaxeLowCol_$Impl_$.idGet(data_Manager.get_db().idCol(this.objClass),id);
	}
	,search: function(params) {
		var items = [];
		var all = this.all();
		var _g = 0;
		while(_g < all.length) {
			var e = all[_g];
			++_g;
			var equals = true;
			var _g1 = 0;
			var _g2 = Reflect.fields(params);
			while(_g1 < _g2.length) {
				var f = _g2[_g1];
				++_g1;
				if(Reflect.field(e,f) != Reflect.field(params,f)) {
					equals = false;
					break;
				}
			}
			if(equals) items.push(e);
		}
		return items;
	}
	,__class__: data_Manager
};
var data_Object = function() {
	this.id = HaxeLow.uuid();
};
$hxClasses["data.Object"] = data_Object;
data_Object.__name__ = ["data","Object"];
data_Object.prototype = {
	id: null
	,insert: function() {
		_$HaxeLowCol_HaxeLowCol_$Impl_$.idInsert(data_Manager.get_db().idCol(js_Boot.getClass(this)),this);
	}
	,update: function() {
		_$HaxeLowCol_HaxeLowCol_$Impl_$.idReplace(data_Manager.get_db().idCol(js_Boot.getClass(this)),this);
	}
	,'delete': function() {
		_$HaxeLowCol_HaxeLowCol_$Impl_$.idRemove(data_Manager.get_db().idCol(js_Boot.getClass(this)),this.id);
	}
	,__class__: data_Object
};
var data_ObjectStaticMethods = function() { };
$hxClasses["data.ObjectStaticMethods"] = data_ObjectStaticMethods;
data_ObjectStaticMethods.__name__ = ["data","ObjectStaticMethods"];
var haxe_IMap = function() { };
$hxClasses["haxe.IMap"] = haxe_IMap;
haxe_IMap.__name__ = ["haxe","IMap"];
haxe_IMap.prototype = {
	get: null
	,keys: null
	,__class__: haxe_IMap
};
var haxe__$Int64__$_$_$Int64 = function(high,low) {
	this.high = high;
	this.low = low;
};
$hxClasses["haxe._Int64.___Int64"] = haxe__$Int64__$_$_$Int64;
haxe__$Int64__$_$_$Int64.__name__ = ["haxe","_Int64","___Int64"];
haxe__$Int64__$_$_$Int64.prototype = {
	high: null
	,low: null
	,__class__: haxe__$Int64__$_$_$Int64
};
var haxe_Resource = function() { };
$hxClasses["haxe.Resource"] = haxe_Resource;
haxe_Resource.__name__ = ["haxe","Resource"];
haxe_Resource.getString = function(name) {
	var _g = 0;
	var _g1 = haxe_Resource.content;
	while(_g < _g1.length) {
		var x = _g1[_g];
		++_g;
		if(x.name == name) {
			if(x.str != null) return x.str;
			var b = haxe_crypto_Base64.decode(x.data);
			return b.toString();
		}
	}
	return null;
};
var haxe__$Template_TemplateExpr = $hxClasses["haxe._Template.TemplateExpr"] = { __ename__ : true, __constructs__ : ["OpVar","OpExpr","OpIf","OpStr","OpBlock","OpForeach","OpMacro"] };
haxe__$Template_TemplateExpr.OpVar = function(v) { var $x = ["OpVar",0,v]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpExpr = function(expr) { var $x = ["OpExpr",1,expr]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpIf = function(expr,eif,eelse) { var $x = ["OpIf",2,expr,eif,eelse]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpStr = function(str) { var $x = ["OpStr",3,str]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpBlock = function(l) { var $x = ["OpBlock",4,l]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpForeach = function(expr,loop) { var $x = ["OpForeach",5,expr,loop]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
haxe__$Template_TemplateExpr.OpMacro = function(name,params) { var $x = ["OpMacro",6,name,params]; $x.__enum__ = haxe__$Template_TemplateExpr; $x.toString = $estr; return $x; };
var haxe_Template = function(str) {
	var tokens = this.parseTokens(str);
	this.expr = this.parseBlock(tokens);
	if(!tokens.isEmpty()) throw new js__$Boot_HaxeError("Unexpected '" + Std.string(tokens.first().s) + "'");
};
$hxClasses["haxe.Template"] = haxe_Template;
haxe_Template.__name__ = ["haxe","Template"];
haxe_Template.prototype = {
	expr: null
	,context: null
	,macros: null
	,stack: null
	,buf: null
	,execute: function(context,macros) {
		if(macros == null) this.macros = { }; else this.macros = macros;
		this.context = context;
		this.stack = new List();
		this.buf = new StringBuf();
		this.run(this.expr);
		return this.buf.b;
	}
	,resolve: function(v) {
		if(Object.prototype.hasOwnProperty.call(this.context,v)) return Reflect.field(this.context,v);
		var _g_head = this.stack.h;
		var _g_val = null;
		while(_g_head != null) {
			var ctx;
			_g_val = _g_head[0];
			_g_head = _g_head[1];
			ctx = _g_val;
			if(Object.prototype.hasOwnProperty.call(ctx,v)) return Reflect.field(ctx,v);
		}
		if(v == "__current__") return this.context;
		return Reflect.field(haxe_Template.globals,v);
	}
	,parseTokens: function(data) {
		var tokens = new List();
		while(haxe_Template.splitter.match(data)) {
			var p = haxe_Template.splitter.matchedPos();
			if(p.pos > 0) tokens.add({ p : HxOverrides.substr(data,0,p.pos), s : true, l : null});
			if(HxOverrides.cca(data,p.pos) == 58) {
				tokens.add({ p : HxOverrides.substr(data,p.pos + 2,p.len - 4), s : false, l : null});
				data = haxe_Template.splitter.matchedRight();
				continue;
			}
			var parp = p.pos + p.len;
			var npar = 1;
			var params = [];
			var part = "";
			while(true) {
				var c = HxOverrides.cca(data,parp);
				parp++;
				if(c == 40) npar++; else if(c == 41) {
					npar--;
					if(npar <= 0) break;
				} else if(c == null) throw new js__$Boot_HaxeError("Unclosed macro parenthesis");
				if(c == 44 && npar == 1) {
					params.push(part);
					part = "";
				} else part += String.fromCharCode(c);
			}
			params.push(part);
			tokens.add({ p : haxe_Template.splitter.matched(2), s : false, l : params});
			data = HxOverrides.substr(data,parp,data.length - parp);
		}
		if(data.length > 0) tokens.add({ p : data, s : true, l : null});
		return tokens;
	}
	,parseBlock: function(tokens) {
		var l = new List();
		while(true) {
			var t = tokens.first();
			if(t == null) break;
			if(!t.s && (t.p == "end" || t.p == "else" || HxOverrides.substr(t.p,0,7) == "elseif ")) break;
			l.add(this.parse(tokens));
		}
		if(l.length == 1) return l.first();
		return haxe__$Template_TemplateExpr.OpBlock(l);
	}
	,parse: function(tokens) {
		var t = tokens.pop();
		var p = t.p;
		if(t.s) return haxe__$Template_TemplateExpr.OpStr(p);
		if(t.l != null) {
			var pe = new List();
			var _g = 0;
			var _g1 = t.l;
			while(_g < _g1.length) {
				var p1 = _g1[_g];
				++_g;
				pe.add(this.parseBlock(this.parseTokens(p1)));
			}
			return haxe__$Template_TemplateExpr.OpMacro(p,pe);
		}
		if(HxOverrides.substr(p,0,3) == "if ") {
			p = HxOverrides.substr(p,3,p.length - 3);
			var e = this.parseExpr(p);
			var eif = this.parseBlock(tokens);
			var t1 = tokens.first();
			var eelse;
			if(t1 == null) throw new js__$Boot_HaxeError("Unclosed 'if'");
			if(t1.p == "end") {
				tokens.pop();
				eelse = null;
			} else if(t1.p == "else") {
				tokens.pop();
				eelse = this.parseBlock(tokens);
				t1 = tokens.pop();
				if(t1 == null || t1.p != "end") throw new js__$Boot_HaxeError("Unclosed 'else'");
			} else {
				t1.p = HxOverrides.substr(t1.p,4,t1.p.length - 4);
				eelse = this.parse(tokens);
			}
			return haxe__$Template_TemplateExpr.OpIf(e,eif,eelse);
		}
		if(HxOverrides.substr(p,0,8) == "foreach ") {
			p = HxOverrides.substr(p,8,p.length - 8);
			var e1 = this.parseExpr(p);
			var efor = this.parseBlock(tokens);
			var t2 = tokens.pop();
			if(t2 == null || t2.p != "end") throw new js__$Boot_HaxeError("Unclosed 'foreach'");
			return haxe__$Template_TemplateExpr.OpForeach(e1,efor);
		}
		if(haxe_Template.expr_splitter.match(p)) return haxe__$Template_TemplateExpr.OpExpr(this.parseExpr(p));
		return haxe__$Template_TemplateExpr.OpVar(p);
	}
	,parseExpr: function(data) {
		var l = new List();
		var expr = data;
		while(haxe_Template.expr_splitter.match(data)) {
			var p = haxe_Template.expr_splitter.matchedPos();
			var k = p.pos + p.len;
			if(p.pos != 0) l.add({ p : HxOverrides.substr(data,0,p.pos), s : true});
			var p1 = haxe_Template.expr_splitter.matched(0);
			l.add({ p : p1, s : p1.indexOf("\"") >= 0});
			data = haxe_Template.expr_splitter.matchedRight();
		}
		if(data.length != 0) l.add({ p : data, s : true});
		var e;
		try {
			e = this.makeExpr(l);
			if(!l.isEmpty()) throw new js__$Boot_HaxeError(l.first().p);
		} catch( s ) {
			if (s instanceof js__$Boot_HaxeError) s = s.val;
			if( js_Boot.__instanceof(s,String) ) {
				throw new js__$Boot_HaxeError("Unexpected '" + s + "' in " + expr);
			} else throw(s);
		}
		return function() {
			try {
				return e();
			} catch( exc ) {
				if (exc instanceof js__$Boot_HaxeError) exc = exc.val;
				throw new js__$Boot_HaxeError("Error : " + Std.string(exc) + " in " + expr);
			}
		};
	}
	,makeConst: function(v) {
		haxe_Template.expr_trim.match(v);
		v = haxe_Template.expr_trim.matched(1);
		if(HxOverrides.cca(v,0) == 34) {
			var str = HxOverrides.substr(v,1,v.length - 2);
			return function() {
				return str;
			};
		}
		if(haxe_Template.expr_int.match(v)) {
			var i = Std.parseInt(v);
			return function() {
				return i;
			};
		}
		if(haxe_Template.expr_float.match(v)) {
			var f = parseFloat(v);
			return function() {
				return f;
			};
		}
		var me = this;
		return function() {
			return me.resolve(v);
		};
	}
	,makePath: function(e,l) {
		var p = l.first();
		if(p == null || p.p != ".") return e;
		l.pop();
		var field = l.pop();
		if(field == null || !field.s) throw new js__$Boot_HaxeError(field.p);
		var f = field.p;
		haxe_Template.expr_trim.match(f);
		f = haxe_Template.expr_trim.matched(1);
		return this.makePath(function() {
			return Reflect.field(e(),f);
		},l);
	}
	,makeExpr: function(l) {
		return this.makePath(this.makeExpr2(l),l);
	}
	,makeExpr2: function(l) {
		var p = l.pop();
		if(p == null) throw new js__$Boot_HaxeError("<eof>");
		if(p.s) return this.makeConst(p.p);
		var _g = p.p;
		switch(_g) {
		case "(":
			var e1 = this.makeExpr(l);
			var p1 = l.pop();
			if(p1 == null || p1.s) throw new js__$Boot_HaxeError(p1.p);
			if(p1.p == ")") return e1;
			var e2 = this.makeExpr(l);
			var p2 = l.pop();
			if(p2 == null || p2.p != ")") throw new js__$Boot_HaxeError(p2.p);
			var _g1 = p1.p;
			switch(_g1) {
			case "+":
				return function() {
					return e1() + e2();
				};
			case "-":
				return function() {
					return e1() - e2();
				};
			case "*":
				return function() {
					return e1() * e2();
				};
			case "/":
				return function() {
					return e1() / e2();
				};
			case ">":
				return function() {
					return e1() > e2();
				};
			case "<":
				return function() {
					return e1() < e2();
				};
			case ">=":
				return function() {
					return e1() >= e2();
				};
			case "<=":
				return function() {
					return e1() <= e2();
				};
			case "==":
				return function() {
					return e1() == e2();
				};
			case "!=":
				return function() {
					return e1() != e2();
				};
			case "&&":
				return function() {
					return e1() && e2();
				};
			case "||":
				return function() {
					return e1() || e2();
				};
			default:
				throw new js__$Boot_HaxeError("Unknown operation " + p1.p);
			}
			break;
		case "!":
			var e = this.makeExpr(l);
			return function() {
				var v = e();
				return v == null || v == false;
			};
		case "-":
			var e3 = this.makeExpr(l);
			return function() {
				return -e3();
			};
		}
		throw new js__$Boot_HaxeError(p.p);
	}
	,run: function(e) {
		switch(e[1]) {
		case 0:
			var v = e[2];
			this.buf.add(Std.string(this.resolve(v)));
			break;
		case 1:
			var e1 = e[2];
			this.buf.add(Std.string(e1()));
			break;
		case 2:
			var eelse = e[4];
			var eif = e[3];
			var e2 = e[2];
			var v1 = e2();
			if(v1 == null || v1 == false) {
				if(eelse != null) this.run(eelse);
			} else this.run(eif);
			break;
		case 3:
			var str = e[2];
			if(str == null) this.buf.b += "null"; else this.buf.b += "" + str;
			break;
		case 4:
			var l = e[2];
			var _g_head = l.h;
			var _g_val = null;
			while(_g_head != null) {
				var e3;
				e3 = (function($this) {
					var $r;
					_g_val = _g_head[0];
					_g_head = _g_head[1];
					$r = _g_val;
					return $r;
				}(this));
				this.run(e3);
			}
			break;
		case 5:
			var loop = e[3];
			var e4 = e[2];
			var v2 = e4();
			try {
				var x = $iterator(v2)();
				if(x.hasNext == null) throw new js__$Boot_HaxeError(null);
				v2 = x;
			} catch( e5 ) {
				if (e5 instanceof js__$Boot_HaxeError) e5 = e5.val;
				try {
					if(v2.hasNext == null) throw new js__$Boot_HaxeError(null);
				} catch( e6 ) {
					if (e6 instanceof js__$Boot_HaxeError) e6 = e6.val;
					throw new js__$Boot_HaxeError("Cannot iter on " + Std.string(v2));
				}
			}
			this.stack.push(this.context);
			var v3 = v2;
			while( v3.hasNext() ) {
				var ctx = v3.next();
				this.context = ctx;
				this.run(loop);
			}
			this.context = this.stack.pop();
			break;
		case 6:
			var params = e[3];
			var m = e[2];
			var v4 = Reflect.field(this.macros,m);
			var pl = [];
			var old = this.buf;
			pl.push($bind(this,this.resolve));
			var _g_head1 = params.h;
			var _g_val1 = null;
			while(_g_head1 != null) {
				var p;
				p = (function($this) {
					var $r;
					_g_val1 = _g_head1[0];
					_g_head1 = _g_head1[1];
					$r = _g_val1;
					return $r;
				}(this));
				switch(p[1]) {
				case 0:
					var v5 = p[2];
					pl.push(this.resolve(v5));
					break;
				default:
					this.buf = new StringBuf();
					this.run(p);
					pl.push(this.buf.b);
				}
			}
			this.buf = old;
			try {
				this.buf.add(Std.string(Reflect.callMethod(this.macros,v4,pl)));
			} catch( e7 ) {
				if (e7 instanceof js__$Boot_HaxeError) e7 = e7.val;
				var plstr;
				try {
					plstr = pl.join(",");
				} catch( e8 ) {
					if (e8 instanceof js__$Boot_HaxeError) e8 = e8.val;
					plstr = "???";
				}
				var msg = "Macro call " + m + "(" + plstr + ") failed (" + Std.string(e7) + ")";
				throw new js__$Boot_HaxeError(msg);
			}
			break;
		}
	}
	,__class__: haxe_Template
};
var haxe_Unserializer = function(buf) {
	this.buf = buf;
	this.length = buf.length;
	this.pos = 0;
	this.scache = [];
	this.cache = [];
	var r = haxe_Unserializer.DEFAULT_RESOLVER;
	if(r == null) {
		r = Type;
		haxe_Unserializer.DEFAULT_RESOLVER = r;
	}
	this.setResolver(r);
};
$hxClasses["haxe.Unserializer"] = haxe_Unserializer;
haxe_Unserializer.__name__ = ["haxe","Unserializer"];
haxe_Unserializer.initCodes = function() {
	var codes = [];
	var _g1 = 0;
	var _g = haxe_Unserializer.BASE64.length;
	while(_g1 < _g) {
		var i = _g1++;
		codes[haxe_Unserializer.BASE64.charCodeAt(i)] = i;
	}
	return codes;
};
haxe_Unserializer.run = function(v) {
	return new haxe_Unserializer(v).unserialize();
};
haxe_Unserializer.prototype = {
	buf: null
	,pos: null
	,length: null
	,cache: null
	,scache: null
	,resolver: null
	,setResolver: function(r) {
		if(r == null) this.resolver = { resolveClass : function(_) {
			return null;
		}, resolveEnum : function(_1) {
			return null;
		}}; else this.resolver = r;
	}
	,get: function(p) {
		return this.buf.charCodeAt(p);
	}
	,readDigits: function() {
		var k = 0;
		var s = false;
		var fpos = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c != c) break;
			if(c == 45) {
				if(this.pos != fpos) break;
				s = true;
				this.pos++;
				continue;
			}
			if(c < 48 || c > 57) break;
			k = k * 10 + (c - 48);
			this.pos++;
		}
		if(s) k *= -1;
		return k;
	}
	,readFloat: function() {
		var p1 = this.pos;
		while(true) {
			var c = this.buf.charCodeAt(this.pos);
			if(c >= 43 && c < 58 || c == 101 || c == 69) this.pos++; else break;
		}
		return Std.parseFloat(HxOverrides.substr(this.buf,p1,this.pos - p1));
	}
	,unserializeObject: function(o) {
		while(true) {
			if(this.pos >= this.length) throw new js__$Boot_HaxeError("Invalid object");
			if(this.buf.charCodeAt(this.pos) == 103) break;
			var k = this.unserialize();
			if(!(typeof(k) == "string")) throw new js__$Boot_HaxeError("Invalid object key");
			var v = this.unserialize();
			o[k] = v;
		}
		this.pos++;
	}
	,unserializeEnum: function(edecl,tag) {
		if(this.get(this.pos++) != 58) throw new js__$Boot_HaxeError("Invalid enum format");
		var nargs = this.readDigits();
		if(nargs == 0) return Type.createEnum(edecl,tag);
		var args = [];
		while(nargs-- > 0) args.push(this.unserialize());
		return Type.createEnum(edecl,tag,args);
	}
	,unserialize: function() {
		var _g = this.get(this.pos++);
		switch(_g) {
		case 110:
			return null;
		case 116:
			return true;
		case 102:
			return false;
		case 122:
			return 0;
		case 105:
			return this.readDigits();
		case 100:
			return this.readFloat();
		case 121:
			var len = this.readDigits();
			if(this.get(this.pos++) != 58 || this.length - this.pos < len) throw new js__$Boot_HaxeError("Invalid string length");
			var s = HxOverrides.substr(this.buf,this.pos,len);
			this.pos += len;
			s = decodeURIComponent(s.split("+").join(" "));
			this.scache.push(s);
			return s;
		case 107:
			return NaN;
		case 109:
			return -Infinity;
		case 112:
			return Infinity;
		case 97:
			var buf = this.buf;
			var a = [];
			this.cache.push(a);
			while(true) {
				var c = this.buf.charCodeAt(this.pos);
				if(c == 104) {
					this.pos++;
					break;
				}
				if(c == 117) {
					this.pos++;
					var n = this.readDigits();
					a[a.length + n - 1] = null;
				} else a.push(this.unserialize());
			}
			return a;
		case 111:
			var o = { };
			this.cache.push(o);
			this.unserializeObject(o);
			return o;
		case 114:
			var n1 = this.readDigits();
			if(n1 < 0 || n1 >= this.cache.length) throw new js__$Boot_HaxeError("Invalid reference");
			return this.cache[n1];
		case 82:
			var n2 = this.readDigits();
			if(n2 < 0 || n2 >= this.scache.length) throw new js__$Boot_HaxeError("Invalid string reference");
			return this.scache[n2];
		case 120:
			throw new js__$Boot_HaxeError(this.unserialize());
			break;
		case 99:
			var name = this.unserialize();
			var cl = this.resolver.resolveClass(name);
			if(cl == null) throw new js__$Boot_HaxeError("Class not found " + name);
			var o1 = Type.createEmptyInstance(cl);
			this.cache.push(o1);
			this.unserializeObject(o1);
			return o1;
		case 119:
			var name1 = this.unserialize();
			var edecl = this.resolver.resolveEnum(name1);
			if(edecl == null) throw new js__$Boot_HaxeError("Enum not found " + name1);
			var e = this.unserializeEnum(edecl,this.unserialize());
			this.cache.push(e);
			return e;
		case 106:
			var name2 = this.unserialize();
			var edecl1 = this.resolver.resolveEnum(name2);
			if(edecl1 == null) throw new js__$Boot_HaxeError("Enum not found " + name2);
			this.pos++;
			var index = this.readDigits();
			var tag = Type.getEnumConstructs(edecl1)[index];
			if(tag == null) throw new js__$Boot_HaxeError("Unknown enum index " + name2 + "@" + index);
			var e1 = this.unserializeEnum(edecl1,tag);
			this.cache.push(e1);
			return e1;
		case 108:
			var l = new List();
			this.cache.push(l);
			var buf1 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) l.add(this.unserialize());
			this.pos++;
			return l;
		case 98:
			var h = new haxe_ds_StringMap();
			this.cache.push(h);
			var buf2 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s1 = this.unserialize();
				h.set(s1,this.unserialize());
			}
			this.pos++;
			return h;
		case 113:
			var h1 = new haxe_ds_IntMap();
			this.cache.push(h1);
			var buf3 = this.buf;
			var c1 = this.get(this.pos++);
			while(c1 == 58) {
				var i = this.readDigits();
				h1.set(i,this.unserialize());
				c1 = this.get(this.pos++);
			}
			if(c1 != 104) throw new js__$Boot_HaxeError("Invalid IntMap format");
			return h1;
		case 77:
			var h2 = new haxe_ds_ObjectMap();
			this.cache.push(h2);
			var buf4 = this.buf;
			while(this.buf.charCodeAt(this.pos) != 104) {
				var s2 = this.unserialize();
				h2.set(s2,this.unserialize());
			}
			this.pos++;
			return h2;
		case 118:
			var d;
			if(this.buf.charCodeAt(this.pos) >= 48 && this.buf.charCodeAt(this.pos) <= 57 && this.buf.charCodeAt(this.pos + 1) >= 48 && this.buf.charCodeAt(this.pos + 1) <= 57 && this.buf.charCodeAt(this.pos + 2) >= 48 && this.buf.charCodeAt(this.pos + 2) <= 57 && this.buf.charCodeAt(this.pos + 3) >= 48 && this.buf.charCodeAt(this.pos + 3) <= 57 && this.buf.charCodeAt(this.pos + 4) == 45) {
				var s3 = HxOverrides.substr(this.buf,this.pos,19);
				d = HxOverrides.strDate(s3);
				this.pos += 19;
			} else {
				var t = this.readFloat();
				var d1 = new Date();
				d1.setTime(t);
				d = d1;
			}
			this.cache.push(d);
			return d;
		case 115:
			var len1 = this.readDigits();
			var buf5 = this.buf;
			if(this.get(this.pos++) != 58 || this.length - this.pos < len1) throw new js__$Boot_HaxeError("Invalid bytes length");
			var codes = haxe_Unserializer.CODES;
			if(codes == null) {
				codes = haxe_Unserializer.initCodes();
				haxe_Unserializer.CODES = codes;
			}
			var i1 = this.pos;
			var rest = len1 & 3;
			var size;
			size = (len1 >> 2) * 3 + (rest >= 2?rest - 1:0);
			var max = i1 + (len1 - rest);
			var bytes = haxe_io_Bytes.alloc(size);
			var bpos = 0;
			while(i1 < max) {
				var c11 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c2 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c11 << 2 | c2 >> 4);
				var c3 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c2 << 4 | c3 >> 2);
				var c4 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c3 << 6 | c4);
			}
			if(rest >= 2) {
				var c12 = codes[StringTools.fastCodeAt(buf5,i1++)];
				var c21 = codes[StringTools.fastCodeAt(buf5,i1++)];
				bytes.set(bpos++,c12 << 2 | c21 >> 4);
				if(rest == 3) {
					var c31 = codes[StringTools.fastCodeAt(buf5,i1++)];
					bytes.set(bpos++,c21 << 4 | c31 >> 2);
				}
			}
			this.pos += len1;
			this.cache.push(bytes);
			return bytes;
		case 67:
			var name3 = this.unserialize();
			var cl1 = this.resolver.resolveClass(name3);
			if(cl1 == null) throw new js__$Boot_HaxeError("Class not found " + name3);
			var o2 = Type.createEmptyInstance(cl1);
			this.cache.push(o2);
			o2.hxUnserialize(this);
			if(this.get(this.pos++) != 103) throw new js__$Boot_HaxeError("Invalid custom data");
			return o2;
		case 65:
			var name4 = this.unserialize();
			var cl2 = this.resolver.resolveClass(name4);
			if(cl2 == null) throw new js__$Boot_HaxeError("Class not found " + name4);
			return cl2;
		case 66:
			var name5 = this.unserialize();
			var e2 = this.resolver.resolveEnum(name5);
			if(e2 == null) throw new js__$Boot_HaxeError("Enum not found " + name5);
			return e2;
		default:
		}
		this.pos--;
		throw new js__$Boot_HaxeError("Invalid char " + this.buf.charAt(this.pos) + " at position " + this.pos);
	}
	,__class__: haxe_Unserializer
};
var haxe_Utf8 = function(size) {
	this.__b = "";
};
$hxClasses["haxe.Utf8"] = haxe_Utf8;
haxe_Utf8.__name__ = ["haxe","Utf8"];
haxe_Utf8.prototype = {
	__b: null
	,__class__: haxe_Utf8
};
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
$hxClasses["haxe.io.Bytes"] = haxe_io_Bytes;
haxe_io_Bytes.__name__ = ["haxe","io","Bytes"];
haxe_io_Bytes.alloc = function(length) {
	return new haxe_io_Bytes(new ArrayBuffer(length));
};
haxe_io_Bytes.ofString = function(s) {
	var a = [];
	var i = 0;
	while(i < s.length) {
		var c = StringTools.fastCodeAt(s,i++);
		if(55296 <= c && c <= 56319) c = c - 55232 << 10 | StringTools.fastCodeAt(s,i++) & 1023;
		if(c <= 127) a.push(c); else if(c <= 2047) {
			a.push(192 | c >> 6);
			a.push(128 | c & 63);
		} else if(c <= 65535) {
			a.push(224 | c >> 12);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		} else {
			a.push(240 | c >> 18);
			a.push(128 | c >> 12 & 63);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		}
	}
	return new haxe_io_Bytes(new Uint8Array(a).buffer);
};
haxe_io_Bytes.prototype = {
	length: null
	,b: null
	,get: function(pos) {
		return this.b[pos];
	}
	,set: function(pos,v) {
		this.b[pos] = v & 255;
	}
	,getString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				var u = (c & 15) << 18 | (c21 & 127) << 12 | (c3 & 127) << 6 | b[i++] & 127;
				s += fcc((u >> 10) + 55232);
				s += fcc(u & 1023 | 56320);
			}
		}
		return s;
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
	,__class__: haxe_io_Bytes
};
var haxe_crypto_Base64 = function() { };
$hxClasses["haxe.crypto.Base64"] = haxe_crypto_Base64;
haxe_crypto_Base64.__name__ = ["haxe","crypto","Base64"];
haxe_crypto_Base64.decode = function(str,complement) {
	if(complement == null) complement = true;
	if(complement) while(HxOverrides.cca(str,str.length - 1) == 61) str = HxOverrides.substr(str,0,-1);
	return new haxe_crypto_BaseCode(haxe_crypto_Base64.BYTES).decodeBytes(haxe_io_Bytes.ofString(str));
};
var haxe_crypto_BaseCode = function(base) {
	var len = base.length;
	var nbits = 1;
	while(len > 1 << nbits) nbits++;
	if(nbits > 8 || len != 1 << nbits) throw new js__$Boot_HaxeError("BaseCode : base length must be a power of two.");
	this.base = base;
	this.nbits = nbits;
};
$hxClasses["haxe.crypto.BaseCode"] = haxe_crypto_BaseCode;
haxe_crypto_BaseCode.__name__ = ["haxe","crypto","BaseCode"];
haxe_crypto_BaseCode.prototype = {
	base: null
	,nbits: null
	,tbl: null
	,initTable: function() {
		var tbl = [];
		var _g = 0;
		while(_g < 256) {
			var i = _g++;
			tbl[i] = -1;
		}
		var _g1 = 0;
		var _g2 = this.base.length;
		while(_g1 < _g2) {
			var i1 = _g1++;
			tbl[this.base.b[i1]] = i1;
		}
		this.tbl = tbl;
	}
	,decodeBytes: function(b) {
		var nbits = this.nbits;
		var base = this.base;
		if(this.tbl == null) this.initTable();
		var tbl = this.tbl;
		var size = b.length * nbits >> 3;
		var out = haxe_io_Bytes.alloc(size);
		var buf = 0;
		var curbits = 0;
		var pin = 0;
		var pout = 0;
		while(pout < size) {
			while(curbits < 8) {
				curbits += nbits;
				buf <<= nbits;
				var i = tbl[b.get(pin++)];
				if(i == -1) throw new js__$Boot_HaxeError("BaseCode : invalid encoded char");
				buf |= i;
			}
			curbits -= 8;
			out.set(pout++,buf >> curbits & 255);
		}
		return out;
	}
	,__class__: haxe_crypto_BaseCode
};
var haxe_ds_IntMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.IntMap"] = haxe_ds_IntMap;
haxe_ds_IntMap.__name__ = ["haxe","ds","IntMap"];
haxe_ds_IntMap.__interfaces__ = [haxe_IMap];
haxe_ds_IntMap.prototype = {
	h: null
	,set: function(key,value) {
		this.h[key] = value;
	}
	,get: function(key) {
		return this.h[key];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) a.push(key | 0);
		}
		return HxOverrides.iter(a);
	}
	,__class__: haxe_ds_IntMap
};
var haxe_ds_ObjectMap = function() {
	this.h = { };
	this.h.__keys__ = { };
};
$hxClasses["haxe.ds.ObjectMap"] = haxe_ds_ObjectMap;
haxe_ds_ObjectMap.__name__ = ["haxe","ds","ObjectMap"];
haxe_ds_ObjectMap.__interfaces__ = [haxe_IMap];
haxe_ds_ObjectMap.prototype = {
	h: null
	,set: function(key,value) {
		var id = key.__id__ || (key.__id__ = ++haxe_ds_ObjectMap.count);
		this.h[id] = value;
		this.h.__keys__[id] = key;
	}
	,get: function(key) {
		return this.h[key.__id__];
	}
	,keys: function() {
		var a = [];
		for( var key in this.h.__keys__ ) {
		if(this.h.hasOwnProperty(key)) a.push(this.h.__keys__[key]);
		}
		return HxOverrides.iter(a);
	}
	,__class__: haxe_ds_ObjectMap
};
var haxe_ds_StringMap = function() {
	this.h = { };
};
$hxClasses["haxe.ds.StringMap"] = haxe_ds_StringMap;
haxe_ds_StringMap.__name__ = ["haxe","ds","StringMap"];
haxe_ds_StringMap.__interfaces__ = [haxe_IMap];
haxe_ds_StringMap.prototype = {
	h: null
	,rh: null
	,set: function(key,value) {
		if(__map_reserved[key] != null) this.setReserved(key,value); else this.h[key] = value;
	}
	,get: function(key) {
		if(__map_reserved[key] != null) return this.getReserved(key);
		return this.h[key];
	}
	,setReserved: function(key,value) {
		if(this.rh == null) this.rh = { };
		this.rh["$" + key] = value;
	}
	,getReserved: function(key) {
		if(this.rh == null) return null; else return this.rh["$" + key];
	}
	,keys: function() {
		var _this = this.arrayKeys();
		return HxOverrides.iter(_this);
	}
	,arrayKeys: function() {
		var out = [];
		for( var key in this.h ) {
		if(this.h.hasOwnProperty(key)) out.push(key);
		}
		if(this.rh != null) {
			for( var key in this.rh ) {
			if(key.charCodeAt(0) == 36) out.push(key.substr(1));
			}
		}
		return out;
	}
	,__class__: haxe_ds_StringMap
};
var haxe_io_Error = $hxClasses["haxe.io.Error"] = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
var haxe_io_FPHelper = function() { };
$hxClasses["haxe.io.FPHelper"] = haxe_io_FPHelper;
haxe_io_FPHelper.__name__ = ["haxe","io","FPHelper"];
haxe_io_FPHelper.i32ToFloat = function(i) {
	var sign = 1 - (i >>> 31 << 1);
	var exp = i >>> 23 & 255;
	var sig = i & 8388607;
	if(sig == 0 && exp == 0) return 0.0;
	return sign * (1 + Math.pow(2,-23) * sig) * Math.pow(2,exp - 127);
};
haxe_io_FPHelper.floatToI32 = function(f) {
	if(f == 0) return 0;
	var af;
	if(f < 0) af = -f; else af = f;
	var exp = Math.floor(Math.log(af) / 0.6931471805599453);
	if(exp < -127) exp = -127; else if(exp > 128) exp = 128;
	var sig = Math.round((af / Math.pow(2,exp) - 1) * 8388608) & 8388607;
	return (f < 0?-2147483648:0) | exp + 127 << 23 | sig;
};
haxe_io_FPHelper.i64ToDouble = function(low,high) {
	var sign = 1 - (high >>> 31 << 1);
	var exp = (high >> 20 & 2047) - 1023;
	var sig = (high & 1048575) * 4294967296. + (low >>> 31) * 2147483648. + (low & 2147483647);
	if(sig == 0 && exp == -1023) return 0.0;
	return sign * (1.0 + Math.pow(2,-52) * sig) * Math.pow(2,exp);
};
haxe_io_FPHelper.doubleToI64 = function(v) {
	var i64 = haxe_io_FPHelper.i64tmp;
	if(v == 0) {
		i64.low = 0;
		i64.high = 0;
	} else {
		var av;
		if(v < 0) av = -v; else av = v;
		var exp = Math.floor(Math.log(av) / 0.6931471805599453);
		var sig;
		var v1 = (av / Math.pow(2,exp) - 1) * 4503599627370496.;
		sig = Math.round(v1);
		var sig_l = sig | 0;
		var sig_h = sig / 4294967296.0 | 0;
		i64.low = sig_l;
		i64.high = (v < 0?-2147483648:0) | exp + 1023 << 20 | sig_h;
	}
	return i64;
};
var haxe_rtti_Meta = function() { };
$hxClasses["haxe.rtti.Meta"] = haxe_rtti_Meta;
haxe_rtti_Meta.__name__ = ["haxe","rtti","Meta"];
haxe_rtti_Meta.getType = function(t) {
	var meta = haxe_rtti_Meta.getMeta(t);
	if(meta == null || meta.obj == null) return { }; else return meta.obj;
};
haxe_rtti_Meta.getMeta = function(t) {
	return t.__meta__;
};
haxe_rtti_Meta.getFields = function(t) {
	var meta = haxe_rtti_Meta.getMeta(t);
	if(meta == null || meta.fields == null) return { }; else return meta.fields;
};
var haxe_web_MatchRule = $hxClasses["haxe.web.MatchRule"] = { __ename__ : true, __constructs__ : ["MRInt","MRBool","MRFloat","MRString","MRDate","MREnum","MRDispatch","MRSpod","MROpt"] };
haxe_web_MatchRule.MRInt = ["MRInt",0];
haxe_web_MatchRule.MRInt.toString = $estr;
haxe_web_MatchRule.MRInt.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MRBool = ["MRBool",1];
haxe_web_MatchRule.MRBool.toString = $estr;
haxe_web_MatchRule.MRBool.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MRFloat = ["MRFloat",2];
haxe_web_MatchRule.MRFloat.toString = $estr;
haxe_web_MatchRule.MRFloat.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MRString = ["MRString",3];
haxe_web_MatchRule.MRString.toString = $estr;
haxe_web_MatchRule.MRString.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MRDate = ["MRDate",4];
haxe_web_MatchRule.MRDate.toString = $estr;
haxe_web_MatchRule.MRDate.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MREnum = function(e) { var $x = ["MREnum",5,e]; $x.__enum__ = haxe_web_MatchRule; $x.toString = $estr; return $x; };
haxe_web_MatchRule.MRDispatch = ["MRDispatch",6];
haxe_web_MatchRule.MRDispatch.toString = $estr;
haxe_web_MatchRule.MRDispatch.__enum__ = haxe_web_MatchRule;
haxe_web_MatchRule.MRSpod = function(c,lock) { var $x = ["MRSpod",7,c,lock]; $x.__enum__ = haxe_web_MatchRule; $x.toString = $estr; return $x; };
haxe_web_MatchRule.MROpt = function(r) { var $x = ["MROpt",8,r]; $x.__enum__ = haxe_web_MatchRule; $x.toString = $estr; return $x; };
var haxe_web_DispatchRule = $hxClasses["haxe.web.DispatchRule"] = { __ename__ : true, __constructs__ : ["DRMatch","DRMult","DRArgs","DRMeta"] };
haxe_web_DispatchRule.DRMatch = function(r) { var $x = ["DRMatch",0,r]; $x.__enum__ = haxe_web_DispatchRule; $x.toString = $estr; return $x; };
haxe_web_DispatchRule.DRMult = function(r) { var $x = ["DRMult",1,r]; $x.__enum__ = haxe_web_DispatchRule; $x.toString = $estr; return $x; };
haxe_web_DispatchRule.DRArgs = function(r,args,opt) { var $x = ["DRArgs",2,r,args,opt]; $x.__enum__ = haxe_web_DispatchRule; $x.toString = $estr; return $x; };
haxe_web_DispatchRule.DRMeta = function(r) { var $x = ["DRMeta",3,r]; $x.__enum__ = haxe_web_DispatchRule; $x.toString = $estr; return $x; };
var haxe_web_DispatchError = $hxClasses["haxe.web.DispatchError"] = { __ename__ : true, __constructs__ : ["DENotFound","DEInvalidValue","DEMissing","DEMissingParam","DETooManyValues"] };
haxe_web_DispatchError.DENotFound = function(part) { var $x = ["DENotFound",0,part]; $x.__enum__ = haxe_web_DispatchError; $x.toString = $estr; return $x; };
haxe_web_DispatchError.DEInvalidValue = ["DEInvalidValue",1];
haxe_web_DispatchError.DEInvalidValue.toString = $estr;
haxe_web_DispatchError.DEInvalidValue.__enum__ = haxe_web_DispatchError;
haxe_web_DispatchError.DEMissing = ["DEMissing",2];
haxe_web_DispatchError.DEMissing.toString = $estr;
haxe_web_DispatchError.DEMissing.__enum__ = haxe_web_DispatchError;
haxe_web_DispatchError.DEMissingParam = function(p) { var $x = ["DEMissingParam",3,p]; $x.__enum__ = haxe_web_DispatchError; $x.toString = $estr; return $x; };
haxe_web_DispatchError.DETooManyValues = ["DETooManyValues",4];
haxe_web_DispatchError.DETooManyValues.toString = $estr;
haxe_web_DispatchError.DETooManyValues.__enum__ = haxe_web_DispatchError;
var haxe_web_Redirect = function() { };
$hxClasses["haxe.web.Redirect"] = haxe_web_Redirect;
haxe_web_Redirect.__name__ = ["haxe","web","Redirect"];
var haxe_web_Dispatch = function(url,params) {
	this.parts = url.split("/");
	if(this.parts[0] == "") this.parts.shift();
	this.params = params;
};
$hxClasses["haxe.web.Dispatch"] = haxe_web_Dispatch;
haxe_web_Dispatch.__name__ = ["haxe","web","Dispatch"];
haxe_web_Dispatch.extractConfig = function(obj) {
	var c = Type.getClass(obj);
	var dc = haxe_rtti_Meta.getType(c);
	var m = dc.dispatchConfig[0];
	if(typeof(m) == "string") {
		m = haxe_Unserializer.run(m);
		dc.dispatchConfig[0] = m;
	}
	return { obj : obj, rules : m};
};
haxe_web_Dispatch.prototype = {
	parts: null
	,params: null
	,name: null
	,cfg: null
	,subDispatch: null
	,onMeta: function(v,args) {
	}
	,resolveName: function(name) {
		return name;
	}
	,runtimeDispatch: function(cfg) {
		this.name = this.parts.shift();
		if(this.name == null) this.name = "default";
		this.name = this.resolveName(this.name);
		this.cfg = cfg;
		var r = Reflect.field(cfg.rules,this.name);
		if(r == null) {
			r = Reflect.field(cfg.rules,"default");
			if(r == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DENotFound(this.name));
			this.parts.unshift(this.name);
			this.name = "default";
		}
		this.name = "do" + this.name.charAt(0).toUpperCase() + HxOverrides.substr(this.name,1,null);
		var args = [];
		this.subDispatch = false;
		this.loop(args,r);
		if(this.parts.length > 0 && !this.subDispatch) {
			if(this.parts.length == 1 && this.parts[this.parts.length - 1] == "") this.parts.pop(); else throw new js__$Boot_HaxeError(haxe_web_DispatchError.DETooManyValues);
		}
		try {
			Reflect.callMethod(cfg.obj,Reflect.field(cfg.obj,this.name),args);
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			if( js_Boot.__instanceof(e,haxe_web_Redirect) ) {
				this.runtimeDispatch(cfg);
			} else throw(e);
		}
	}
	,match: function(v,r,opt) {
		switch(r[1]) {
		case 0:
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			if(opt && v == "") return null;
			var v1 = Std.parseInt(v);
			if(v1 == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEInvalidValue);
			return v1;
		case 2:
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			if(opt && v == "") return null;
			var v2 = parseFloat(v);
			if(isNaN(v2)) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEInvalidValue);
			return v2;
		case 3:
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			return v;
		case 1:
			return v != null && v != "0" && v != "false" && v != "null";
		case 4:
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			try {
				return HxOverrides.strDate(v);
			} catch( e ) {
				if (e instanceof js__$Boot_HaxeError) e = e.val;
				throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEInvalidValue);
			}
			break;
		case 5:
			var e1 = r[2];
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			if(opt && v == "") return null;
			if(v == "") throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			var en = Type.resolveEnum(e1);
			if(en == null) throw new js__$Boot_HaxeError("assert");
			var ev;
			if(HxOverrides.cca(v,0) >= 48 && HxOverrides.cca(v,0) <= 57) ev = Type.createEnumIndex(en,Std.parseInt(v)); else ev = Type.createEnum(en,v);
			return ev;
		case 6:
			if(v != null) this.parts.unshift(v);
			this.subDispatch = true;
			return this;
		case 7:
			var lock = r[3];
			var c = r[2];
			if(v == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissing);
			var v3 = Std.parseInt(v);
			if(v3 == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEInvalidValue);
			var cl = Type.resolveClass(c);
			if(cl == null) throw new js__$Boot_HaxeError("assert");
			var o;
			o = cl.manager.unsafeGet(v3,lock);
			if(o == null) throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEInvalidValue);
			return o;
		case 8:
			var r1 = r[2];
			if(v == null) return null;
			return this.match(v,r1,true);
		}
	}
	,checkParams: function(params,opt) {
		var po = { };
		var _g = 0;
		while(_g < params.length) {
			var p = params[_g];
			++_g;
			var v = this.params.get(p.name);
			if(v == null) {
				if(p.opt) continue;
				if(opt) return null;
				throw new js__$Boot_HaxeError(haxe_web_DispatchError.DEMissingParam(p.name));
			}
			Reflect.setField(po,p.name,this.match(v,p.rule,p.opt));
		}
		return po;
	}
	,loop: function(args,r) {
		switch(r[1]) {
		case 2:
			var opt = r[4];
			var params = r[3];
			var r1 = r[2];
			this.loop(args,r1);
			args.push(this.checkParams(params,opt));
			break;
		case 0:
			var r2 = r[2];
			args.push(this.match(this.parts.shift(),r2,false));
			break;
		case 1:
			var rl = r[2];
			var _g = 0;
			while(_g < rl.length) {
				var r3 = rl[_g];
				++_g;
				args.push(this.match(this.parts.shift(),r3,false));
			}
			break;
		case 3:
			var r4 = r[2];
			this.loop(args,r4);
			var c = Type.getClass(this.cfg.obj);
			var m;
			do {
				if(c == null) throw new js__$Boot_HaxeError("assert");
				m = Reflect.field(haxe_rtti_Meta.getFields(c),this.name);
				c = Type.getSuperClass(c);
			} while(m == null);
			var _g1 = 0;
			var _g11 = Reflect.fields(m);
			while(_g1 < _g11.length) {
				var mv = _g11[_g1];
				++_g1;
				this.onMeta(mv,Reflect.field(m,mv));
			}
			break;
		}
	}
	,__class__: haxe_web_Dispatch
};
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
$hxClasses["js._Boot.HaxeError"] = js__$Boot_HaxeError;
js__$Boot_HaxeError.__name__ = ["js","_Boot","HaxeError"];
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
	val: null
	,__class__: js__$Boot_HaxeError
});
var js_Boot = function() { };
$hxClasses["js.Boot"] = js_Boot;
js_Boot.__name__ = ["js","Boot"];
js_Boot.getClass = function(o) {
	if((o instanceof Array) && o.__enum__ == null) return Array; else {
		var cl = o.__class__;
		if(cl != null) return cl;
		var name = js_Boot.__nativeClassName(o);
		if(name != null) return js_Boot.__resolveNativeClass(name);
		return null;
	}
};
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
js_Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0;
		var _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js_Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js_Boot.__interfLoop(cc.__super__,cl);
};
js_Boot.__instanceof = function(o,cl) {
	if(cl == null) return false;
	switch(cl) {
	case Int:
		return (o|0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return typeof(o) == "boolean";
	case String:
		return typeof(o) == "string";
	case Array:
		return (o instanceof Array) && o.__enum__ == null;
	case Dynamic:
		return true;
	default:
		if(o != null) {
			if(typeof(cl) == "function") {
				if(o instanceof cl) return true;
				if(js_Boot.__interfLoop(js_Boot.getClass(o),cl)) return true;
			} else if(typeof(cl) == "object" && js_Boot.__isNativeObj(cl)) {
				if(o instanceof cl) return true;
			}
		} else return false;
		if(cl == Class && o.__name__ != null) return true;
		if(cl == Enum && o.__ename__ != null) return true;
		return o.__enum__ == cl;
	}
};
js_Boot.__nativeClassName = function(o) {
	var name = js_Boot.__toStr.call(o).slice(8,-1);
	if(name == "Object" || name == "Function" || name == "Math" || name == "JSON") return null;
	return name;
};
js_Boot.__isNativeObj = function(o) {
	return js_Boot.__nativeClassName(o) != null;
};
js_Boot.__resolveNativeClass = function(name) {
	return $global[name];
};
var js_html_compat_ArrayBuffer = function(a) {
	if((a instanceof Array) && a.__enum__ == null) {
		this.a = a;
		this.byteLength = a.length;
	} else {
		var len = a;
		this.a = [];
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			this.a[i] = 0;
		}
		this.byteLength = len;
	}
};
$hxClasses["js.html.compat.ArrayBuffer"] = js_html_compat_ArrayBuffer;
js_html_compat_ArrayBuffer.__name__ = ["js","html","compat","ArrayBuffer"];
js_html_compat_ArrayBuffer.sliceImpl = function(begin,end) {
	var u = new Uint8Array(this,begin,end == null?null:end - begin);
	var result = new ArrayBuffer(u.byteLength);
	var resultArray = new Uint8Array(result);
	resultArray.set(u);
	return result;
};
js_html_compat_ArrayBuffer.prototype = {
	byteLength: null
	,a: null
	,slice: function(begin,end) {
		return new js_html_compat_ArrayBuffer(this.a.slice(begin,end));
	}
	,__class__: js_html_compat_ArrayBuffer
};
var js_html_compat_DataView = function(buffer,byteOffset,byteLength) {
	this.buf = buffer;
	if(byteOffset == null) this.offset = 0; else this.offset = byteOffset;
	if(byteLength == null) this.length = buffer.byteLength - this.offset; else this.length = byteLength;
	if(this.offset < 0 || this.length < 0 || this.offset + this.length > buffer.byteLength) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
};
$hxClasses["js.html.compat.DataView"] = js_html_compat_DataView;
js_html_compat_DataView.__name__ = ["js","html","compat","DataView"];
js_html_compat_DataView.prototype = {
	buf: null
	,offset: null
	,length: null
	,getInt8: function(byteOffset) {
		var v = this.buf.a[this.offset + byteOffset];
		if(v >= 128) return v - 256; else return v;
	}
	,getUint8: function(byteOffset) {
		return this.buf.a[this.offset + byteOffset];
	}
	,getInt16: function(byteOffset,littleEndian) {
		var v = this.getUint16(byteOffset,littleEndian);
		if(v >= 32768) return v - 65536; else return v;
	}
	,getUint16: function(byteOffset,littleEndian) {
		if(littleEndian) return this.buf.a[this.offset + byteOffset] | this.buf.a[this.offset + byteOffset + 1] << 8; else return this.buf.a[this.offset + byteOffset] << 8 | this.buf.a[this.offset + byteOffset + 1];
	}
	,getInt32: function(byteOffset,littleEndian) {
		var p = this.offset + byteOffset;
		var a = this.buf.a[p++];
		var b = this.buf.a[p++];
		var c = this.buf.a[p++];
		var d = this.buf.a[p++];
		if(littleEndian) return a | b << 8 | c << 16 | d << 24; else return d | c << 8 | b << 16 | a << 24;
	}
	,getUint32: function(byteOffset,littleEndian) {
		var v = this.getInt32(byteOffset,littleEndian);
		if(v < 0) return v + 4294967296.; else return v;
	}
	,getFloat32: function(byteOffset,littleEndian) {
		return haxe_io_FPHelper.i32ToFloat(this.getInt32(byteOffset,littleEndian));
	}
	,getFloat64: function(byteOffset,littleEndian) {
		var a = this.getInt32(byteOffset,littleEndian);
		var b = this.getInt32(byteOffset + 4,littleEndian);
		return haxe_io_FPHelper.i64ToDouble(littleEndian?a:b,littleEndian?b:a);
	}
	,setInt8: function(byteOffset,value) {
		if(value < 0) this.buf.a[byteOffset + this.offset] = value + 128 & 255; else this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setUint8: function(byteOffset,value) {
		this.buf.a[byteOffset + this.offset] = value & 255;
	}
	,setInt16: function(byteOffset,value,littleEndian) {
		this.setUint16(byteOffset,value < 0?value + 65536:value,littleEndian);
	}
	,setUint16: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
		} else {
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p] = value & 255;
		}
	}
	,setInt32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,value,littleEndian);
	}
	,setUint32: function(byteOffset,value,littleEndian) {
		var p = byteOffset + this.offset;
		if(littleEndian) {
			this.buf.a[p++] = value & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >>> 24;
		} else {
			this.buf.a[p++] = value >>> 24;
			this.buf.a[p++] = value >> 16 & 255;
			this.buf.a[p++] = value >> 8 & 255;
			this.buf.a[p++] = value & 255;
		}
	}
	,setFloat32: function(byteOffset,value,littleEndian) {
		this.setUint32(byteOffset,haxe_io_FPHelper.floatToI32(value),littleEndian);
	}
	,setFloat64: function(byteOffset,value,littleEndian) {
		var i64 = haxe_io_FPHelper.doubleToI64(value);
		if(littleEndian) {
			this.setUint32(byteOffset,i64.low);
			this.setUint32(byteOffset,i64.high);
		} else {
			this.setUint32(byteOffset,i64.high);
			this.setUint32(byteOffset,i64.low);
		}
	}
	,__class__: js_html_compat_DataView
};
var js_html_compat_Uint8Array = function() { };
$hxClasses["js.html.compat.Uint8Array"] = js_html_compat_Uint8Array;
js_html_compat_Uint8Array.__name__ = ["js","html","compat","Uint8Array"];
js_html_compat_Uint8Array._new = function(arg1,offset,length) {
	var arr;
	if(typeof(arg1) == "number") {
		arr = [];
		var _g = 0;
		while(_g < arg1) {
			var i = _g++;
			arr[i] = 0;
		}
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else if(js_Boot.__instanceof(arg1,js_html_compat_ArrayBuffer)) {
		var buffer = arg1;
		if(offset == null) offset = 0;
		if(length == null) length = buffer.byteLength - offset;
		if(offset == 0) arr = buffer.a; else arr = buffer.a.slice(offset,offset + length);
		arr.byteLength = arr.length;
		arr.byteOffset = offset;
		arr.buffer = buffer;
	} else if((arg1 instanceof Array) && arg1.__enum__ == null) {
		arr = arg1.slice();
		arr.byteLength = arr.length;
		arr.byteOffset = 0;
		arr.buffer = new js_html_compat_ArrayBuffer(arr);
	} else throw new js__$Boot_HaxeError("TODO " + Std.string(arg1));
	arr.subarray = js_html_compat_Uint8Array._subarray;
	arr.set = js_html_compat_Uint8Array._set;
	return arr;
};
js_html_compat_Uint8Array._set = function(arg,offset) {
	var t = this;
	if(js_Boot.__instanceof(arg.buffer,js_html_compat_ArrayBuffer)) {
		var a = arg;
		if(arg.byteLength + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g1 = 0;
		var _g = arg.byteLength;
		while(_g1 < _g) {
			var i = _g1++;
			t[i + offset] = a[i];
		}
	} else if((arg instanceof Array) && arg.__enum__ == null) {
		var a1 = arg;
		if(a1.length + offset > t.byteLength) throw new js__$Boot_HaxeError("set() outside of range");
		var _g11 = 0;
		var _g2 = a1.length;
		while(_g11 < _g2) {
			var i1 = _g11++;
			t[i1 + offset] = a1[i1];
		}
	} else throw new js__$Boot_HaxeError("TODO");
};
js_html_compat_Uint8Array._subarray = function(start,end) {
	var t = this;
	var a = js_html_compat_Uint8Array._new(t.slice(start,end));
	a.byteOffset = start;
	return a;
};
var js_node_Fs = require("fs");
var js_node_Http = require("http");
var models_Author = function(firstname,lastname) {
	data_Object.call(this);
	this.firstname = firstname;
	this.lastname = lastname;
};
$hxClasses["models.Author"] = models_Author;
models_Author.__name__ = ["models","Author"];
models_Author.__super__ = data_Object;
models_Author.prototype = $extend(data_Object.prototype,{
	firstname: null
	,lastname: null
	,__class__: models_Author
});
var sys_FileSystem = function() { };
$hxClasses["sys.FileSystem"] = sys_FileSystem;
sys_FileSystem.__name__ = ["sys","FileSystem"];
sys_FileSystem.exists = function(path) {
	try {
		js_node_Fs.accessSync(path);
		return true;
	} catch( _ ) {
		if (_ instanceof js__$Boot_HaxeError) _ = _.val;
		return false;
	}
};
var tjson_TJSON = function() { };
$hxClasses["tjson.TJSON"] = tjson_TJSON;
tjson_TJSON.__name__ = ["tjson","TJSON"];
tjson_TJSON.parse = function(json,fileName,stringProcessor) {
	if(fileName == null) fileName = "JSON Data";
	var t = new tjson_TJSONParser(json,fileName,stringProcessor);
	return t.doParse();
};
tjson_TJSON.encode = function(obj,style,useCache) {
	if(useCache == null) useCache = true;
	var t = new tjson_TJSONEncoder(useCache);
	return t.doEncode(obj,style);
};
var tjson_TJSONParser = function(vjson,vfileName,stringProcessor) {
	if(vfileName == null) vfileName = "JSON Data";
	this.json = vjson;
	this.fileName = vfileName;
	this.currentLine = 1;
	this.lastSymbolQuoted = false;
	this.pos = 0;
	this.floatRegex = new EReg("^-?[0-9]*\\.[0-9]+$","");
	this.intRegex = new EReg("^-?[0-9]+$","");
	if(stringProcessor == null) this.strProcessor = $bind(this,this.defaultStringProcessor); else this.strProcessor = stringProcessor;
	this.cache = [];
};
$hxClasses["tjson.TJSONParser"] = tjson_TJSONParser;
tjson_TJSONParser.__name__ = ["tjson","TJSONParser"];
tjson_TJSONParser.prototype = {
	pos: null
	,json: null
	,lastSymbolQuoted: null
	,fileName: null
	,currentLine: null
	,cache: null
	,floatRegex: null
	,intRegex: null
	,strProcessor: null
	,doParse: function() {
		try {
			var _g = this.getNextSymbol();
			var s = _g;
			switch(_g) {
			case "{":
				return this.doObject();
			case "[":
				return this.doArray();
			default:
				return this.convertSymbolToProperType(s);
			}
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			if( js_Boot.__instanceof(e,String) ) {
				throw new js__$Boot_HaxeError(this.fileName + " on line " + this.currentLine + ": " + e);
			} else throw(e);
		}
	}
	,doObject: function() {
		var o = { };
		var val = "";
		var key;
		var isClassOb = false;
		this.cache.push(o);
		while(this.pos < this.json.length) {
			key = this.getNextSymbol();
			if(key == "," && !this.lastSymbolQuoted) continue;
			if(key == "}" && !this.lastSymbolQuoted) {
				if(isClassOb && o.TJ_unserialize != null) o.TJ_unserialize();
				return o;
			}
			var seperator = this.getNextSymbol();
			if(seperator != ":") throw new js__$Boot_HaxeError("Expected ':' but got '" + seperator + "' instead.");
			var v = this.getNextSymbol();
			if(key == "_hxcls") {
				var cls = Type.resolveClass(v);
				if(cls == null) throw new js__$Boot_HaxeError("Invalid class name - " + v);
				o = Type.createEmptyInstance(cls);
				this.cache.pop();
				this.cache.push(o);
				isClassOb = true;
				continue;
			}
			if(v == "{" && !this.lastSymbolQuoted) val = this.doObject(); else if(v == "[" && !this.lastSymbolQuoted) val = this.doArray(); else val = this.convertSymbolToProperType(v);
			o[key] = val;
		}
		throw new js__$Boot_HaxeError("Unexpected end of file. Expected '}'");
	}
	,doArray: function() {
		var a = [];
		var val;
		while(this.pos < this.json.length) {
			val = this.getNextSymbol();
			if(val == "," && !this.lastSymbolQuoted) continue; else if(val == "]" && !this.lastSymbolQuoted) return a; else if(val == "{" && !this.lastSymbolQuoted) val = this.doObject(); else if(val == "[" && !this.lastSymbolQuoted) val = this.doArray(); else val = this.convertSymbolToProperType(val);
			a.push(val);
		}
		throw new js__$Boot_HaxeError("Unexpected end of file. Expected ']'");
	}
	,convertSymbolToProperType: function(symbol) {
		if(this.lastSymbolQuoted) {
			if(StringTools.startsWith(symbol,tjson_TJSON.OBJECT_REFERENCE_PREFIX)) {
				var idx = Std.parseInt(HxOverrides.substr(symbol,tjson_TJSON.OBJECT_REFERENCE_PREFIX.length,null));
				return this.cache[idx];
			}
			return symbol;
		}
		if(this.looksLikeFloat(symbol)) return parseFloat(symbol);
		if(this.looksLikeInt(symbol)) return Std.parseInt(symbol);
		if(symbol.toLowerCase() == "true") return true;
		if(symbol.toLowerCase() == "false") return false;
		if(symbol.toLowerCase() == "null") return null;
		return symbol;
	}
	,looksLikeFloat: function(s) {
		return this.floatRegex.match(s) || this.intRegex.match(s) && (function($this) {
			var $r;
			var intStr = $this.intRegex.matched(0);
			$r = HxOverrides.cca(intStr,0) == 45?intStr > "-2147483648":intStr > "2147483647";
			return $r;
		}(this));
	}
	,looksLikeInt: function(s) {
		return this.intRegex.match(s);
	}
	,getNextSymbol: function() {
		this.lastSymbolQuoted = false;
		var c = "";
		var inQuote = false;
		var quoteType = "";
		var symbol = "";
		var inEscape = false;
		var inSymbol = false;
		var inLineComment = false;
		var inBlockComment = false;
		while(this.pos < this.json.length) {
			c = this.json.charAt(this.pos++);
			if(c == "\n" && !inSymbol) this.currentLine++;
			if(inLineComment) {
				if(c == "\n" || c == "\r") {
					inLineComment = false;
					this.pos++;
				}
				continue;
			}
			if(inBlockComment) {
				if(c == "*" && this.json.charAt(this.pos) == "/") {
					inBlockComment = false;
					this.pos++;
				}
				continue;
			}
			if(inQuote) {
				if(inEscape) {
					inEscape = false;
					if(c == "'" || c == "\"") {
						symbol += c;
						continue;
					}
					if(c == "t") {
						symbol += "\t";
						continue;
					}
					if(c == "n") {
						symbol += "\n";
						continue;
					}
					if(c == "\\") {
						symbol += "\\";
						continue;
					}
					if(c == "r") {
						symbol += "\r";
						continue;
					}
					if(c == "/") {
						symbol += "/";
						continue;
					}
					if(c == "u") {
						var hexValue = 0;
						var _g = 0;
						while(_g < 4) {
							var i = _g++;
							if(this.pos >= this.json.length) throw new js__$Boot_HaxeError("Unfinished UTF8 character");
							var nc;
							var index = this.pos++;
							nc = HxOverrides.cca(this.json,index);
							hexValue = hexValue << 4;
							if(nc >= 48 && nc <= 57) hexValue += nc - 48; else if(nc >= 65 && nc <= 70) hexValue += 10 + nc - 65; else if(nc >= 97 && nc <= 102) hexValue += 10 + nc - 95; else throw new js__$Boot_HaxeError("Not a hex digit");
						}
						var utf = new haxe_Utf8();
						utf.__b += String.fromCharCode(hexValue);
						symbol += utf.__b;
						continue;
					}
					throw new js__$Boot_HaxeError("Invalid escape sequence '\\" + c + "'");
				} else {
					if(c == "\\") {
						inEscape = true;
						continue;
					}
					if(c == quoteType) return symbol;
					symbol += c;
					continue;
				}
			} else if(c == "/") {
				var c2 = this.json.charAt(this.pos);
				if(c2 == "/") {
					inLineComment = true;
					this.pos++;
					continue;
				} else if(c2 == "*") {
					inBlockComment = true;
					this.pos++;
					continue;
				}
			}
			if(inSymbol) {
				if(c == " " || c == "\n" || c == "\r" || c == "\t" || c == "," || c == ":" || c == "}" || c == "]") {
					this.pos--;
					return symbol;
				} else {
					symbol += c;
					continue;
				}
			} else {
				if(c == " " || c == "\t" || c == "\n" || c == "\r") continue;
				if(c == "{" || c == "}" || c == "[" || c == "]" || c == "," || c == ":") return c;
				if(c == "'" || c == "\"") {
					inQuote = true;
					quoteType = c;
					this.lastSymbolQuoted = true;
					continue;
				} else {
					inSymbol = true;
					symbol = c;
					continue;
				}
			}
		}
		if(inQuote) throw new js__$Boot_HaxeError("Unexpected end of data. Expected ( " + quoteType + " )");
		return symbol;
	}
	,defaultStringProcessor: function(str) {
		return str;
	}
	,__class__: tjson_TJSONParser
};
var tjson_TJSONEncoder = function(useCache) {
	if(useCache == null) useCache = true;
	this.uCache = useCache;
	if(this.uCache) this.cache = [];
};
$hxClasses["tjson.TJSONEncoder"] = tjson_TJSONEncoder;
tjson_TJSONEncoder.__name__ = ["tjson","TJSONEncoder"];
tjson_TJSONEncoder.prototype = {
	cache: null
	,uCache: null
	,doEncode: function(obj,style) {
		if(!Reflect.isObject(obj)) throw new js__$Boot_HaxeError("Provided object is not an object.");
		var st;
		if(js_Boot.__instanceof(style,tjson_EncodeStyle)) st = style; else if(style == "fancy") st = new tjson_FancyStyle(); else st = new tjson_SimpleStyle();
		var buffer = new StringBuf();
		if((obj instanceof Array) && obj.__enum__ == null || js_Boot.__instanceof(obj,List)) buffer.add(this.encodeIterable(obj,st,0)); else if(js_Boot.__instanceof(obj,haxe_ds_StringMap)) buffer.add(this.encodeMap(obj,st,0)); else {
			this.cacheEncode(obj);
			buffer.add(this.encodeObject(obj,st,0));
		}
		return buffer.b;
	}
	,encodeObject: function(obj,style,depth) {
		var buffer = new StringBuf();
		buffer.add(style.beginObject(depth));
		var fieldCount = 0;
		var fields;
		var dontEncodeFields = null;
		var cls = Type.getClass(obj);
		if(cls != null) fields = Type.getInstanceFields(cls); else fields = Reflect.fields(obj);
		{
			var _g = Type["typeof"](obj);
			switch(_g[1]) {
			case 6:
				var c = _g[2];
				if(fieldCount++ > 0) buffer.add(style.entrySeperator(depth)); else buffer.add(style.firstEntry(depth));
				buffer.add("\"_hxcls\"" + style.keyValueSeperator(depth));
				buffer.add(this.encodeValue(Type.getClassName(c),style,depth));
				if(obj.TJ_noEncode != null) dontEncodeFields = obj.TJ_noEncode();
				break;
			default:
			}
		}
		var _g1 = 0;
		while(_g1 < fields.length) {
			var field = fields[_g1];
			++_g1;
			if(dontEncodeFields != null && HxOverrides.indexOf(dontEncodeFields,field,0) >= 0) continue;
			var value = Reflect.field(obj,field);
			var vStr = this.encodeValue(value,style,depth);
			if(vStr != null) {
				if(fieldCount++ > 0) buffer.add(style.entrySeperator(depth)); else buffer.add(style.firstEntry(depth));
				buffer.add("\"" + field + "\"" + style.keyValueSeperator(depth) + vStr);
			}
		}
		buffer.add(style.endObject(depth));
		return buffer.b;
	}
	,encodeMap: function(obj,style,depth) {
		var buffer = new StringBuf();
		buffer.add(style.beginObject(depth));
		var fieldCount = 0;
		var $it0 = obj.keys();
		while( $it0.hasNext() ) {
			var field = $it0.next();
			if(fieldCount++ > 0) buffer.add(style.entrySeperator(depth)); else buffer.add(style.firstEntry(depth));
			var value = obj.get(field);
			buffer.add("\"" + field + "\"" + style.keyValueSeperator(depth));
			buffer.add(this.encodeValue(value,style,depth));
		}
		buffer.add(style.endObject(depth));
		return buffer.b;
	}
	,encodeIterable: function(obj,style,depth) {
		var buffer = new StringBuf();
		buffer.add(style.beginArray(depth));
		var fieldCount = 0;
		var $it0 = $iterator(obj)();
		while( $it0.hasNext() ) {
			var value = $it0.next();
			if(fieldCount++ > 0) buffer.add(style.entrySeperator(depth)); else buffer.add(style.firstEntry(depth));
			buffer.add(this.encodeValue(value,style,depth));
		}
		buffer.add(style.endArray(depth));
		return buffer.b;
	}
	,cacheEncode: function(value) {
		if(!this.uCache) return null;
		var _g1 = 0;
		var _g = this.cache.length;
		while(_g1 < _g) {
			var c = _g1++;
			if(this.cache[c] == value) return "\"" + tjson_TJSON.OBJECT_REFERENCE_PREFIX + c + "\"";
		}
		this.cache.push(value);
		return null;
	}
	,encodeValue: function(value,style,depth) {
		if(((value | 0) === value) || typeof(value) == "number") return value; else if((value instanceof Array) && value.__enum__ == null || js_Boot.__instanceof(value,List)) {
			var v = value;
			return this.encodeIterable(v,style,depth + 1);
		} else if(js_Boot.__instanceof(value,List)) {
			var v1 = value;
			return this.encodeIterable(v1,style,depth + 1);
		} else if(js_Boot.__instanceof(value,haxe_ds_StringMap)) return this.encodeMap(value,style,depth + 1); else if(typeof(value) == "string") return "\"" + StringTools.replace(StringTools.replace(StringTools.replace(StringTools.replace(Std.string(value),"\\","\\\\"),"\n","\\n"),"\r","\\r"),"\"","\\\"") + "\""; else if(typeof(value) == "boolean") return value; else if(Reflect.isObject(value)) {
			var ret = this.cacheEncode(value);
			if(ret != null) return ret;
			return this.encodeObject(value,style,depth + 1);
		} else if(value == null) return "null"; else return null;
	}
	,__class__: tjson_TJSONEncoder
};
var tjson_EncodeStyle = function() { };
$hxClasses["tjson.EncodeStyle"] = tjson_EncodeStyle;
tjson_EncodeStyle.__name__ = ["tjson","EncodeStyle"];
tjson_EncodeStyle.prototype = {
	beginObject: null
	,endObject: null
	,beginArray: null
	,endArray: null
	,firstEntry: null
	,entrySeperator: null
	,keyValueSeperator: null
	,__class__: tjson_EncodeStyle
};
var tjson_SimpleStyle = function() {
};
$hxClasses["tjson.SimpleStyle"] = tjson_SimpleStyle;
tjson_SimpleStyle.__name__ = ["tjson","SimpleStyle"];
tjson_SimpleStyle.__interfaces__ = [tjson_EncodeStyle];
tjson_SimpleStyle.prototype = {
	beginObject: function(depth) {
		return "{";
	}
	,endObject: function(depth) {
		return "}";
	}
	,beginArray: function(depth) {
		return "[";
	}
	,endArray: function(depth) {
		return "]";
	}
	,firstEntry: function(depth) {
		return "";
	}
	,entrySeperator: function(depth) {
		return ",";
	}
	,keyValueSeperator: function(depth) {
		return ":";
	}
	,__class__: tjson_SimpleStyle
};
var tjson_FancyStyle = function(tab) {
	if(tab == null) tab = "    ";
	this.tab = tab;
	this.charTimesNCache = [""];
};
$hxClasses["tjson.FancyStyle"] = tjson_FancyStyle;
tjson_FancyStyle.__name__ = ["tjson","FancyStyle"];
tjson_FancyStyle.__interfaces__ = [tjson_EncodeStyle];
tjson_FancyStyle.prototype = {
	tab: null
	,beginObject: function(depth) {
		return "{\n";
	}
	,endObject: function(depth) {
		return "\n" + this.charTimesN(depth) + "}";
	}
	,beginArray: function(depth) {
		return "[\n";
	}
	,endArray: function(depth) {
		return "\n" + this.charTimesN(depth) + "]";
	}
	,firstEntry: function(depth) {
		return this.charTimesN(depth + 1) + " ";
	}
	,entrySeperator: function(depth) {
		return "\n" + this.charTimesN(depth + 1) + ",";
	}
	,keyValueSeperator: function(depth) {
		return " : ";
	}
	,charTimesNCache: null
	,charTimesN: function(n) {
		if(n < this.charTimesNCache.length) return this.charTimesNCache[n]; else return this.charTimesNCache[n] = this.charTimesN(n - 1) + this.tab;
	}
	,__class__: tjson_FancyStyle
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.indexOf) HxOverrides.indexOf = function(a,o,i) {
	return Array.prototype.indexOf.call(a,o,i);
};
$hxClasses.Math = Math;
String.prototype.__class__ = $hxClasses.String = String;
String.__name__ = ["String"];
$hxClasses.Array = Array;
Array.__name__ = ["Array"];
Date.prototype.__class__ = $hxClasses.Date = Date;
Date.__name__ = ["Date"];
var Int = $hxClasses.Int = { __name__ : ["Int"]};
var Dynamic = $hxClasses.Dynamic = { __name__ : ["Dynamic"]};
var Float = $hxClasses.Float = Number;
Float.__name__ = ["Float"];
var Bool = $hxClasses.Bool = Boolean;
Bool.__ename__ = ["Bool"];
var Class = $hxClasses.Class = { __name__ : ["Class"]};
var Enum = { };
haxe_Resource.content = [{ name : "part-index", data : "CTxkaXYgaWQ9ImhlYWRlciI+PGgxPk1lbnU8L2gxPjwvZGl2PgoJPGRpdiBpZD0iY29udGVudCI+CgkJPHVsIGNsYXNzPSJ2Ym94Ij4KCQkJPGxpPjxhIGhyZWY9Ii9hdXRob3IiPkxlcyBhdXRldXJzPC9hPjwvbGk+CgkJCTxsaT48YSBocmVmPSIvYm9vayI+TGVzIGxpdnJlczwvYT48L2xpPgoJCTwvdWw+Cgk8L2Rpdj4K"},{ name : "index", data : "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImZyIj48aGVhZD4KCTx0aXRsZT5CaWJsaW90aMOocXVlIEhheGUgLyBOb2RlLmpzPC90aXRsZT4KCTxtZXRhIGNoYXJzZXQ9IlVURi04Ii8+Cgk8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBoZWlnaHQ9ZGV2aWNlLWhlaWdodCIvPgoJPGxpbmsgcmVsPSJzdHlsZXNoZWV0IiB0eXBlPSJ0ZXh0L2NzcyIgaHJlZj0iL3N0YXRpYy9zdHlsZXMuY3NzIi8+Cgk8bGluayByZWw9InN0eWxlc2hlZXQiIHR5cGU9InRleHQvY3NzIiBocmVmPSIvc3RhdGljL3RoZW1lLWNsZWFyLmNzcyIvPgo8L2hlYWQ+PGJvZHk+PGRpdiBpZD0icGFnZSI+Cjo6cGFydDo6CjwvZGl2PjwvYm9keT48L2h0bWw+Cg"},{ name : "part-author-list", data : "CTxkaXYgaWQ9ImhlYWRlciI+PGgxPkxpc3RlIGRlcyBhdXRldXJzPC9oMT48L2Rpdj4KCTxkaXYgaWQ9ImNvbnRlbnQiPgoJCTx0YWJsZT48dGhlYWQ+PHRyPjx0aD5QcsOpbm9tPC90aD48dGg+Tm9tPC90aD48dGg+PC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PgoJCQk6OmZvcmVhY2ggYXV0aG9yczo6CgkJCTx0cj4KCQkJCTx0ZD48aW5wdXQgZm9ybT0idXBkYXRlQXV0aG9yLTo6aWQ6OiIgdHlwZT0idGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIiBuYW1lPSJmaXJzdG5hbWUiIHZhbHVlPSI6OmZpcnN0bmFtZTo6Ii8+PC90ZD4KCQkJCTx0ZD48aW5wdXQgZm9ybT0idXBkYXRlQXV0aG9yLTo6aWQ6OiIgdHlwZT0idGV4dCIgcmVxdWlyZWQ9InJlcXVpcmVkIiBuYW1lPSJsYXN0bmFtZSIgdmFsdWU9Ijo6bGFzdG5hbWU6OiIvPjwvdGQ+CgkJCQk8dGQ+PHVsIGNsYXNzPSJoYm94Ij4KCQkJCQk8bGk+PGZvcm0gaWQ9InVwZGF0ZUF1dGhvci06OmlkOjoiIG1ldGhvZD0icG9zdCIgYWN0aW9uPSIvYXV0aG9yLzo6aWQ6OiIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9mb3JtPgoJCQkJCQk8YnV0dG9uIGZvcm09InVwZGF0ZUF1dGhvci06OmlkOjoiIHR5cGU9InN1Ym1pdCIgY2xhc3M9Imljb25fcmVjb3JkIj48L2J1dHRvbj48L2xpPgoJCQkJCTxsaT48Zm9ybSBpZD0iZGVsZXRlQXV0aG9yLTo6aWQ6OiIgbWV0aG9kPSJwb3N0IiBhY3Rpb249Ii9hdXRob3IvOjppZDo6IiBzdHlsZT0iZGlzcGxheTpub25lIj48L2Zvcm0+CgkJCQkJCTxidXR0b24gZm9ybT0iZGVsZXRlQXV0aG9yLTo6aWQ6OiIgdHlwZT0ic3VibWl0IiBjbGFzcz0iaWNvbl9yZW1vdmUiPjwvYnV0dG9uPjwvbGk+CgkJCQk8L3VsPjwvdGQ+CgkJCTwvdHI+CgkJCTo6ZW5kOjoKCQkJPHRyPgoJCQkJPHRkPjxpbnB1dCBmb3JtPSJjcmVhdGVBdXRob3IiIHR5cGU9InRleHQiIHJlcXVpcmVkPSJyZXF1aXJlZCIgbmFtZT0iZmlyc3RuYW1lIi8+PC90ZD4KCQkJCTx0ZD48aW5wdXQgZm9ybT0iY3JlYXRlQXV0aG9yIiB0eXBlPSJ0ZXh0IiByZXF1aXJlZD0icmVxdWlyZWQiIG5hbWU9Imxhc3RuYW1lIi8+PC90ZD4KCQkJCTx0ZD48Zm9ybSBpZD0iY3JlYXRlQXV0aG9yIiBtZXRob2Q9InBvc3QiIGFjdGlvbj0iL2F1dGhvciIgc3R5bGU9ImRpc3BsYXk6bm9uZSI+PC9mb3JtPgoJCQkJCTxidXR0b24gZm9ybT0iY3JlYXRlQXV0aG9yIiB0eXBlPSJzdWJtaXQiIGNsYXNzPSJpY29uX2FkZCI+PC9idXR0b24+PC90ZD4KCQkJPC90cj4KCQk8L3Rib2R5PjwvdGFibGU+Cgk8L2Rpdj4KCTxkaXYgaWQ9ImZvb3RlciI+CgkJPGEgY2xhc3M9ImJ1dHRvbiBpY29uX2JhY2siIGhyZWY9Ii8iPjwvYT4KCTwvZGl2Pgo"}];
var __map_reserved = {}
var ArrayBuffer = $global.ArrayBuffer || js_html_compat_ArrayBuffer;
if(ArrayBuffer.prototype.slice == null) ArrayBuffer.prototype.slice = js_html_compat_ArrayBuffer.sliceImpl;
var DataView = $global.DataView || js_html_compat_DataView;
var Uint8Array = $global.Uint8Array || js_html_compat_Uint8Array._new;
Index.__meta__ = { obj : { dispatchConfig : ["oy6:authorjy21:haxe.web.DispatchRule:0:1jy18:haxe.web.MatchRule:8:1jR2:3:0y7:defaultjR1:1:1ahg"]}};
Index.changesCount = 0;
haxe_Template.splitter = new EReg("(::[A-Za-z0-9_ ()&|!+=/><*.\"-]+::|\\$\\$([A-Za-z0-9_-]+)\\()","");
haxe_Template.expr_splitter = new EReg("(\\(|\\)|[ \r\n\t]*\"[^\"]*\"[ \r\n\t]*|[!+=/><*.&|-]+)","");
haxe_Template.expr_trim = new EReg("^[ ]*([^ ]+)[ ]*$","");
haxe_Template.expr_int = new EReg("^[0-9]+$","");
haxe_Template.expr_float = new EReg("^([+-]?)(?=\\d|,\\d)\\d*(,\\d*)?([Ee]([+-]?\\d+))?$","");
haxe_Template.globals = { };
haxe_Unserializer.DEFAULT_RESOLVER = Type;
haxe_Unserializer.BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";
haxe_crypto_Base64.CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
haxe_crypto_Base64.BYTES = haxe_io_Bytes.ofString(haxe_crypto_Base64.CHARS);
haxe_ds_ObjectMap.count = 0;
haxe_io_FPHelper.i64tmp = (function($this) {
	var $r;
	var x = new haxe__$Int64__$_$_$Int64(0,0);
	$r = x;
	return $r;
}(this));
js_Boot.__toStr = {}.toString;
js_html_compat_Uint8Array.BYTES_PER_ELEMENT = 1;
models_Author.manager = new data_Manager("models.Author");
tjson_TJSON.OBJECT_REFERENCE_PREFIX = "@~obRef#";
Index.main();
})(typeof console != "undefined" ? console : {log:function(){}}, typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : this);
