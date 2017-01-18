class APIError {
	public var code(default, null) : Int; //propriétés lisibles (cf default)
	public var reason(default, null) : String; //mais non modifiables (cf null)
	
	public function new(code : Int, reason : String) {
		this.code = code;
		this.reason = reason;
	}
} 
