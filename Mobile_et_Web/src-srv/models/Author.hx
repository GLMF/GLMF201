package models;
import data.Object;

class Author extends Object {
	public var firstname : String;
	public var lastname : String;
	
	public function new(firstname : String, lastname : String) {
		super();
		this.firstname = firstname;
		this.lastname = lastname;
	}
}
