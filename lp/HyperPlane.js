
var HyperPlane = function () {
	var argsPtr = arguments;
	this.setDefault = function(d, error=0){
		this.dim = d;
		this.dir = {theta: 0, phi: 0}
		if (d == 4) this.dir.chi = 0;
		this.h = 0;
		this.normal = d == 4 ? new THREE.Vector4() : new THREE.Vector3(0, 0, 1);
		this.orthoCenter = this.normal.clone().setLength(this.h);
		if (error) console.warn("Invalid HyperPlane arguments", error, argsPtr);
		this.error = error;
	}
	this.isHyperPlane = true;
	if (arguments[0]) {
		var d = Utils.isDir(arguments[0]);
		if (d) {
			this.dir = arguments[0];
			this.dim = d;
			if (arguments[1]) {
				this.h = arguments[1];
			} else {
				this.h = 0;
			}
			this.normal = Utils.dirToVector(this.dir).normalize();
			this.orthoCenter = this.normal.clone().multiplyScalar(this.h);
		} 
		else if (arguments[0].isVector3 || arguments[0].isVector4) {
			this.dim = arguments[0].isVector4 ? 4 : 3;
			
			this.normal = arguments[0].clone().normalize();
			if (arguments.length > 1) {
				this.h = arguments[1];
				this.orthoCenter = this.normal.clone().multiplyScalar(this.h);
			} else {
				this.orthoCenter = arguments[0].clone();
				this.h = this.orthoCenter.length();
			}
			this.dir = Utils.vectorToDir(this.normal);
		}
		else if (Array.isArray(arguments[0]) && arguments[0][0]) {
			var a = arguments[0];
			if (a[0].isVector3 && a.length >= 3) {
				var n2 = 0, i = 1, n = new THREE.Vector3(), b1 = new THREE.Vector3(), b2 = new THREE.Vector3();
				while (i < a.length && b1.lengthSq() < 1e-10) {
					b1.subVectors(a[i], a[0]);
					i ++;
				}
				while (i < a.length && n2 < 1e-10) {
					b2.subVectors(a[i], a[0]);
					n.crossVectors(b2, b1);
					n2 = n.lengthSq();
					i++;
				}
				if (n2 < 1e-10) {
					this.setDefault(3, HyperPlane.ERRORS.DEG_POINTS);
				} else {
					this.dim = 3;
					this.normal = n.normalize();
					this.h = n.dot(a[0]);
					if (arguments[1] && arguments[1].isVector3) {
						if (this.normal.dot(arguments[1]) < 0) {
							this.normal.negate();
							this.h = - this.h;
						}
					} else if (false) {// (this.h < 0) {
						this.normal.negate();
						this.h = - this.h;
					}
					this.dir = Utils.vectorToDir(this.normal);
					this.orthoCenter = this.normal.clone().multiplyScalar(this.h);
				}
			} 
			else if (a[0].isVector4 && a.length >= 4) {
				this.dim = 4;
				var m = Utils.vectorsToMatrix(a);
				if (Math.abs(m.determinant()) > 1e-6) {
					
					var right = new THREE.Vector4(1, 1, 1, 1);
					this.normal = HyperPlane.linSolve(m, right);
					this.normal.normalize();
					if (arguments[1] && arguments[1].isVector4) {
						if (this.normal.dot(arguments[1]) < 0) {
							this.normal.negate();
						}
					}
					this.h = this.normal.dot(a[0]);					
					this.orthoCenter = this.normal.clone().multiplyScalar(this.h);
					
					this.dir = Utils.vectorToDir(this.normal);
				} else {
					var shft = new THREE.Vector4(1, 1, 1, 1);
					console.log("shift");
					for (var i = 0; i < a.length; i++) {
						a[i].sub(shft);
					}
					m = Utils.vectorsToMatrix(a);
					if (Math.abs(m.determinant()) > 1e-10) {
						var right = new THREE.Vector4(1, 1, 1, 1);
						this.normal = HyperPlane.linSolve(m, right);
						this.normal.normalize();
						this.h = 0;
						this.orthoCenter = new THREE.Vector4(0, 0, 0, 0);
						if (arguments[1] && arguments[1].isVector4) {
							if (this.normal.dot(arguments[1]) < 0) {
								this.normal.negate();
							}
						}
						this.dir = Utils.vectorToDir(this.normal);
					}
					else {
						this.setDefault(4, HyperPlane.ERRORS.DEG_POINTS);
					}
				}
			}
			else {
				this.setDefault(a[0].isVector4 ? 4:3, HyperPlane.ERRORS.INSUF_POINTS);
			}
		} else if (arguments[0] == 4) {
			this.setDefault(4, 0);
		} else if (arguments[0] == 3) { 
			this.setDefault(3, 0);	
		} else {
			this.setDefault(3, HyperPlane.ERRORS.INVALID_ARGS);
		}	
	} else 
		this.setDefault(3, HyperPlane.ERRORS.NO_ARGS);
		
	this.matrix = Utils.dirToMatrix(this.dir);
	this.invMatrix = this.dim == 4 ? new THREE.Matrix4() : new THREE.Matrix3();
	this.invMatrix.getInverse(this.matrix);
}

HyperPlane.prototype = {
	constructor: HyperPlane,
	project: function (p) {
		var p_ = this.normal.clone().multiplyScalar(p.dot(this.normal) - this.h)
		return p.clone().sub(p_);
	}, 
	belongs: function (p, eps = 1e-10) {
		if (Math.abs(p.dot(this.normal) - this.h) < eps) return true;
		return false;
	},
	projectFlat: function (p) {
		var p_ = this.project(p);
		if (this.dim == 3) {
			p_.applyMatrix3(this.matrix);
			return new THREE.Vector2(p_.x, p_.y);
		} else if (this.dim == 4) {
			p_.applyMatrix4(this.matrix);
			return new THREE.Vector3(p_.x, p_.y, p_.z);
		} else {
			console.warn("This should never happen", this);
			return null
		}
	},
	unproject: function (p) {
		var p_;
		if (this.dim == 4) {
			p_ = new THREE.Vector4(p.x, p.y, p.z, 0);
			p_.applyMatrix4(this.invMatrix);
		} else if (this.dim == 3) {
			p_ = new THREE.Vector3(p.x, p.y, 0);
			p_.applyMatrix3(this.invMatrix);
		} else {
			console.warn("This should never happen", this);
			return null
		}
		return p_.add(this.orthoCenter);
	}

};

HyperPlane.linSolve = function (mat, vect) {
	var dim = mat.isMatrix4 ? 4 : 3;
	var d = mat.determinant();
	if (Math.abs(d) < 1e-10) {
		console.warn("linSolve: Degenerate matrix", mat);
		return null;
	} 
	var res = dim == 4 ? new THREE.Vector4() : new THREE.Vector3();
	var newMat = dim == 4 ? new THREE.Matrix4() : new THREE.Matrix3();
	var arr = [];
	for (var i = 0; i < dim; i++) {
		arr = mat.toArray();
		for (var j = 0; j < dim; j++) {
			arr[j + i*dim] = vect.getComponent(j);		
		}
		newMat.fromArray(arr);
		res.setComponent(i, newMat.determinant()/d);
	}
	return res;
	
}

HyperPlane.ERRORS = {NO_ARGS: "No arguments", 
					DEG_POINTS: "Given points are degenerate", 
					INSUF_POINTS: "Not enough points", 
					INVALID_ARGS: "Invalid arguments"}

//---------------------tests----------------
/*var mmm = new THREE.Matrix3();
var v1 = new THREE.Vector3(1, 2, 3);
var v2 = new THREE.Vector3(2, 4, 7);
var v3 = new THREE.Vector3(3, 7, 9);

Utils.vectorsToMatrix([v1, v2, v3], mmm);

var testHP = new HyperPlane(3);
console.log(testHP);

console.log(HyperPlane);

console.log("linSolve", HyperPlane.linSolve(mmm, new THREE.Vector3(10, 21, 18+14)));
*/
//------------------------------------------

console.log("HyperPlane loaded");
