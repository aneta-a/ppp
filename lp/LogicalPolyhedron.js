/**
* @author Anna Alekseeva
*/


//vertices - array of THREE.Vector3
//faces - array of arrays of integer, inidices in 'vertices'
var LogicalPolyhedron = function(vertices, faces, edges = null, getUV = null) {
	this.dim = 3;
	this.vertices = vertices;

	this.getFaceCenter = function (face) {
		return LogicalPolyhedron.getCenter(this.vertices, face);
	}
	
	this.setGetUVFunction = function (getUV_) {
		if (getUV_ && (getUV_ instanceof Function))
			this.getUV = getUV_.bind(this);
	}
	
	if (getUV) this.setGetUVFunction(getUV);
	else this.getUV = this.getDefaultUV;

	this.arrangeFace = function(face) {
		var c = this.getFaceCenter(face);
		var flatVertices = [];
		for (var i = 0; i < face.length; i++) {
			var b = this.vertices[face[i]].clone().sub(c);
			flatVertices.push({b: b, index: face[i]});
		}
		var b0 = flatVertices[0].b;
		flatVertices[0].phi = 0;
		var testDot = 0; 
		if (b0.isVector3) {
			var testCross = new THREE.Vector3();
			var ii = 1;
			while (testCross.length() < 1e-10 && ii < flatVertices.length) {
				testCross.crossVectors ( flatVertices[ii++].b, b0 );
			}
			testDot = c.dot(testCross);
		}
		if (c.length() > 0 && b0 instanceof THREE.Vector3 && Math.abs(testDot) > 1e-10) {
			//in 3d using cross product of the edges and its projection to the center to orient face		
			for (var j = 1; j < flatVertices.length; j++) {
				var cross = new THREE.Vector3().crossVectors ( flatVertices[j].b, b0 );
				var dotc = cross.dot(c);
				flatVertices[j].phi = Math.atan2(dotc == 0 ? 0 : dotc/Math.abs(dotc)*cross.length(),  flatVertices[j].b.dot(b0))
				
			}
			flatVertices.sort(function(a1, a2) {return a1.phi - a2.phi});
		} else if (flatVertices.length > 3) {
			//arranging vertices by the angle relative to the center, orientation is orbitrary
			var qsin = 0;
			var d0 = b0.lengthSq();
			var b1, d1, d01;
			var ii = 1;
			//finding two vertices not lying in one line with the center, to make a basis
			while (qsin < 1e-10 && ii < flatVertices.length) {
				b1 = flatVertices[ii++].b.clone();
				d1 = b1.lengthSq();
				d01 = b0.dot(b1);
				qsin = d0*d1 - d01*d01;
			}
			if (qsin > 1e-10) {
				qsin = Math.sqrt(qsin);
				b1 = b1.multiplyScalar(d0).sub(b0.clone().multiplyScalar(d01)).multiplyScalar(1/qsin);
				for (var j = 1; j < flatVertices.length; j++) {
					flatVertices[j].phi = Math.atan2(b1.dot(flatVertices[j].b), b0.dot(flatVertices[j].b));
				}
				flatVertices.sort(function(a1, a2) {return a1.phi - a2.phi});
			}
		}
		var res = [];
		for (var i = 0; i < flatVertices.length; i++) {
			res.push(flatVertices[i].index)
		}
		return res;
		
	}
	this.getFaces = function(faces) {
		this.faces = [];
		for (var i = 0; i < faces.length; i++) 
			this.faces.push(this.arrangeFace(faces[i]));
		return this.faces;
	}
	this.getFaces(faces);
	if (edges) {
		this.edges = edges;
	} else 
		this.edges = getEdges(this.faces);

	function getEdges(faces) {
		res = [];
		function exists(i1, i2) {
			for (var k = 0; k < res.length; k++) {
				if (res[k][0] == i1 && res[k][1] == i2) return true;
				if (res[k][0] == i2 && res[k][1] == i1) return true;
			}
			return false
		}
		for (var i = 0; i < faces.length; i++){
			for (var j = 0; j < faces[i].length; j++) {
				var i1 = faces[i][j];
				var i2 = faces[i][(j + 1) % faces[i].length];
				if (!exists(i1, i2)) res.push([i1, i2])
			}
		}
		return res
	}
	
	this.findAdjasentFaces = function(edge) {
		var res = [];
		for (var i = 0; i < this.faces.length; i++) {
			if (this.faces[i].indexOf(edge[0]) >= 0 && this.faces[i].indexOf(edge[1]) >= 0)
				res.push(i);
		}
		return res;
	}
	
	this.getVertexFigure = function (vertInd = 0) {
		var res = [];
		for (var i = 0; i< this.faces.length; i++) {
			if (this.faces[i].indexOf(verInd) >=0) res.push(this.faces[i].length);
		}
		return res;
	}
	this.findAdjasentEdges = function (face) {
		var res = [];
		for (var i = 0; i < face.length; i++) {
			for (var e = 0; e < this.edges.length; e++) {
				var ei = this.edges[e].indexOf(face[i]);
				if (ei >= 0) {
					if (face.indexOf(this.edges[e][(ei+1)%2])>=0 && res.indexOf(e) < 0) res.push(e);
				}
			}
		}
		return res;
	}
}

LogicalPolyhedron.prototype = {
	constructor: LogicalPolyhedron,
	getOptimizedGeometry: function (r = 1, normalized = true){
	//Returns a buffer geometry with indexed (reused) vertices. 
	//Not good for polyhedra with small number of faces, because the faces are not "flat", 
	//each vertex has its own normal.
	//TODO it has no uv
		var posBuffer = new Array(this.vertices.length*3);
		var maxR = normalized ? 0 :1;
		
		for (var i = 0; i < this.vertices.length; i++) {
			posBuffer[3*i] = this.vertices[i].x;
			posBuffer[3*i+1] = this.vertices[i].y;
			posBuffer[3*i+2] = this.vertices[i].z;
			if (normalized && this.vertices[i].lengthSq() > maxR) maxR = this.vertices[i].lengthSq();
		}
		

		var scale = r/Math.sqrt(maxR);

		var center = LogicalPolyhedron.getCenter(this);
		var normalBuffer = [];
		for (var i = 0; i < this.vertices.length; i++) {
			var n = this.vertices[i].clone().sub(center);
			normalBuffer[3*i] = n.x;
			normalBuffer[3*i+1] = n.y;
			normalBuffer[3*i+2] = n.z;
		}
		//triangulation
		var faceCount = 0; 
		for (var i = 0; i < this.faces.length; i++) {
			faceCount += this.faces[i].length - 2;
		}
		var faceBuffer = new Array(faceCount*3);
		var fbInd = 0;
		for (var i = 0; i < this.faces.length; i++) {
			for (var j = 2; j < this.faces[i].length; j++) {
				faceBuffer[fbInd++] = this.faces[i][j];
				faceBuffer[fbInd++] = this.faces[i][j-1];
				faceBuffer[fbInd++] = this.faces[i][0];
			}
		}
		var geom = new THREE.BufferGeometry();
		geom.addAttribute( 'position', new THREE.Float32BufferAttribute( posBuffer, 3 ) );
		geom.setIndex(new THREE.Uint16BufferAttribute( faceBuffer, 1 ) );
		geom.addAttribute( 'normal', new THREE.Float32BufferAttribute( normalBuffer, 3 ) );
		geom.normalizeNormals();
		geom.scale(scale, scale, scale);
		return geom;
		

	},
	getGeometry: function (r = 1, normalized = true){
	//Returns not indexed BufferGeometry. For each face all vertices have the same normal. 
	//Could be slow for polyhedra with a large number of faces.
	
		//triangulation
		var faceCount = 0; 
		for (var i = 0; i < this.faces.length; i++) {
			faceCount += this.faces[i].length - 2;
		}
		var faceBuffer = new Array(faceCount*3);
		var faceUVBuffer = new Array(faceCount*3);
		var fbInd = 0;
		this.geomFaces = [];
		for (var i = 0; i < this.faces.length; i++) {
			for (var j = 2; j < this.faces[i].length; j++) {
				faceUVBuffer[fbInd] = this.getUV(i, j);
				faceBuffer[fbInd++] = this.faces[i][j];
				faceUVBuffer[fbInd] = this.getUV(i, j-1);
				faceBuffer[fbInd++] = this.faces[i][j-1];
				faceUVBuffer[fbInd] = this.getUV(i, 0);
				faceBuffer[fbInd++] = this.faces[i][0];
				this.geomFaces.push(i);
			}
		} 

		var posBuffer = new Array(faceBuffer.length*3);
		var uvBuffer = new Array(faceUVBuffer.length*2);
		var maxR = normalized ? 0 :1;
		if (normalized) {
			for (var i = 0; i < this.vertices.length; i++) {
				if (this.vertices[i].lengthSq() > maxR) maxR = this.vertices[i].lengthSq();
			}
		}
		
		for (var i = 0; i < faceBuffer.length; i++) {
			posBuffer[3*i] = this.vertices[faceBuffer[i]].x;
			posBuffer[3*i+1] = this.vertices[faceBuffer[i]].y;
			posBuffer[3*i+2] = this.vertices[faceBuffer[i]].z;
			uvBuffer[2*i] = faceUVBuffer[i].x;
			uvBuffer[2*i+1] = faceUVBuffer[i].y;
		}
		

		var scale = r/Math.sqrt(maxR);

		var center = LogicalPolyhedron.getCenter(this);
		var normalBuffer = [];
		for (var i = 0; i < faceBuffer.length; i+=3) {
			var v0 = this.vertices[faceBuffer[i]].clone();
			var v1 = this.vertices[faceBuffer[i+1]].clone();
			var v2 = this.vertices[faceBuffer[i+2]].clone();
			
			var n = new THREE.Vector3().crossVectors ( new THREE.Vector3().subVectors(v1, v0), new THREE.Vector3().subVectors(v2, v0) );
			if (n.dot(v0.sub(center)) < 0) n.negate();
			for (var j = 0; j < 3; j++) {
				normalBuffer[3*(i+j)] = n.x;
				normalBuffer[3*(i+j)+1] = n.y;
				normalBuffer[3*(i+j)+2] = n.z;
			}
		}
		var geom = new THREE.BufferGeometry();
		geom.addAttribute( 'position', new THREE.Float32BufferAttribute( posBuffer, 3 ) );
		geom.addAttribute( 'normal', new THREE.Float32BufferAttribute( normalBuffer, 3 ) );
		geom.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvBuffer, 2 ) );
		geom.normalizeNormals();
		geom.scale(scale, scale, scale);
		return geom;
		

	},
	getDefaultUV: function (faceIndex, vertIndex) {
		var v3 = this.vertices[this.faces[faceIndex][vertIndex]];
		/*vectorToDir: function (vector) {
		var res = {
			phi: Math.atan2(vector.y, vector.x),
			theta: Math.atan2(Math.sqrt(vector.x*vector.x + vector.y*vector.y), vector.z)
		}*/
		var dir = Utils.vectorToDir(v3);
		//if (dir.phi < 0) dir.phi += 2*Math.PI;
		return new THREE.Vector2(0.5*(dir.phi + Math.PI)/Math.PI, 1-dir.theta/Math.PI);
		
	}, 
	geomFaceIndexToFace: function (index, indexed = false){
		if (!this.geomFaces) this.getGeometry();
		return this.geomFaces[index];
	},
	getEdgeGeometries: function(r = 1, normalized = true) {
		var res = [];
		var newR;
		if (normalized) {
			var maxR = 0;
			for (var i = 0; i < this.vertices.length; i++) {
				if (this.vertices[i].lengthSq() > maxR)
					maxR = this.vertices[i].lengthSq();
			}
			newR = r/Math.sqrt(maxR);
		} else {
			newR = r;
		}
		for (var i = 0; i < this.edges.length; i++) {
			var geometry = new THREE.Geometry();
			geometry.vertices.push(this.vertices[this.edges[i][0]].clone().multiplyScalar(newR),
				this.vertices[this.edges[i][1]].clone().multiplyScalar(newR));
			res.push(geometry);
		}
		return res;
	},
	getSectionObject: function(hp, testSets) {
		//returns the object with following fields:
		//values - array of all vertices of the section
		//edges - array of the vertices of the section, coming from edges of initial polyhedron
		//       value: - vertex of the section (Vector3 of Vector4), index: index of the edge in this.edges
		//verts - array of the vertices of the polyhedron, lying exactly on the section
		//       value: - vertex (Vector3 or Vector4), index: index of the vertex in this.vertices
		var vector, dir, h;
		h = hp.h;
		dir = hp.dir;
		vector = hp.orthoCenter;
		var mat = Utils.dirToMatrix(dir);
		var newVerts = [];
		for (var i = 0; i < this.vertices.length; i++) {
			if (mat.isMatrix4) {
				newVerts.push(this.vertices[i].clone().sub(vector).applyMatrix4(mat))
			} else {
				newVerts.push(this.vertices[i].clone().sub(vector).applyMatrix3(mat))
			}
		}
		var res = {edges: [], verts: [], values: []}
		var zeroVertices = [];
		var dim = mat.isMatrix4 ? 3 : 2;
		for (var j = 0; j < newVerts.length; j++) {
			if (Math.abs(newVerts[j].getComponent(dim))<1e-3) {
				zeroVertices.push(j);
				res.verts.push({index: j, value: newVerts[j]});
				res.values.push(newVerts[j]);
			}
		}
		for (var i = 0; i < this.edges.length; i++) {
			if (zeroVertices.indexOf(this.edges[i][0]) < 0 && zeroVertices.indexOf(this.edges[i][1]) < 0){
				var v1 = newVerts[this.edges[i][0]];
				var v2 = newVerts[this.edges[i][1]];
				var h1 = v1.getComponent(dim), h2 = v2.getComponent(dim); 
				if (h1 * h2 < 0) {
					var v = v1.isVector4 ? new THREE.Vector4() : new THREE.Vector3();
					v.lerpVectors ( v1 , v2, h1/(h1-h2) );
					res.edges.push({index: i, value: v});
					res.values.push(v);
				}
			}
		}
		return res;
	},
	getSection2D: function (){
		var hp = new HyperPlane(...arguments);
		var sectionObject = this.getSectionObject(hp, this.faces);//.apply(this,arguments);
		var sectionVertices = sectionObject.values;
		sectionVertices.sort(function (a, b) { return Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x) });
		return new LogicalPolygon(sectionVertices);

	},
	getSection3D: function (){
		sectionPolygon = LogicalPolyhedron.prototype.getSection2D.apply(this,arguments);
		var flatVertices = sectionPolygon.vertices.slice();
		if (flatVertices.length > 0) {
			var vector, dir, h;
			if (arguments[0].isHyperPlane) {
				var hp = arguments[0];
				h = hp.h;
				dir = hp.dir;
				vector = hp.orthoCenter;
			} else if (arguments[0].isVector3) {
				vector = arguments[0].clone();
				dir = Utils.vectorToDir(vector);
				if (arguments.length > 1) {
					h = arguments[1];
					vector.setLength(h);
				}
				else h = vector.length();
			} else {
				dir = arguments[0];
				h = arguments[1];
				vector = Utils.dirToVector(dir).setLength(h);
			}
			var mat = Utils.dirToMatrix(dir);
			var invMat = new THREE.Matrix3().getInverse(mat);
			var newVerts = [];
			for (var i = 0; i < flatVertices.length; i++) {
				newVerts.push(new THREE.Vector3(flatVertices[i].x, flatVertices[i].y, 0).applyMatrix3(invMat).add(vector));
			}
			return new LogicalPolyhedron(newVerts, [Utils.intArray(newVerts.length)]);
		} else return new LogicalPolyhedron([], []);
		
	},
	getProjection: function (direction){
		//direction: {theta: angle around y, phi: angel around new z}
		var mat = Utils.dirToMatrix(direction);
		var newVerts = [];
		for (var i = 0; i < this.vertices.length; i++) {
			newVerts.push(this.vertices[i].clone().applyMatrix3(mat))
		}
		return new LogicalPolygon(newVerts, this.edges)
	},
	getStereoProjection: function (direction){
		//Returns stereographic projection
		//If direction is given (in form of a vector or angles) the center of projection is on intersection of the direction vector 
		//and the minimal full-sphere containig all vertices. If direction is not given, the center of the first face is used instead
		var vector, dir;
		if (direction && direction.isVector3) {
			vector = direction;
			dir = Utils.vectorToDir(vector);
		} else if (direction && direction.hasOwnProperty("theta")) {
			dir = direction;
			vector = Utils.dirToVector(dir);
		} else {
			vector = LogicalPolyhedron.getCenter(this.vertices, this.faces[0]);
			dir = Utils.vectorToDir(vector);
		}
		
		var mat = Utils.dirToMatrix(dir);
		var newVerts = [];
		var RMax = 0;
		for (var i = 0; i < this.vertices.length; i++) {
			if (this.vertices[i].length() > RMax) RMax = this.vertices[i].length();
			newVerts.push(this.vertices[i].clone().applyMatrix3(mat));
		}
		var flatVerts = [];
		for (var i = 0; i < newVerts.length; i++) {
			flatVerts.push(new THREE.Vector2(newVerts[i].x/(RMax - newVerts[i].z), newVerts[i].y/(RMax - newVerts[i].z)));
		}
		
		return new LogicalPolygon(flatVerts, this.edges);
	}, 
	
	//----------new Polyhedra---------------------------
	getDual: function (normalized = true) {
	//returns dual polyhedron
		var l = this.vertices[0].length();
		var newVertices = [];
		var newFaces = new Array(this.vertices.length);
		for (var i = 0; i < this.faces.length; i++) {
			var c = this.getFaceCenter(this.faces[i]);
			if (normalized) c.setLength(l);
			newVertices.push(c);
			for (var j = 0; j < this.faces[i].length; j++) {
				if (!Array.isArray(newFaces[this.faces[i][j]])) newFaces[this.faces[i][j]] = [];
				newFaces[this.faces[i][j]].push(i);
			}
		}
		return new LogicalPolyhedron(newVertices, newFaces);
		
	},
	
	truncate: function (part = 0, normalized = true) {
		if (part == 0) {
			var n = this.faces[0].length;
			part = 0.5/(1+Math.cos(Math.PI/n));
		}
		var l = this.vertices[0].length();
		var newVertices = new Array(this.edges.length*2);
		var fFaces = new Array(this.faces.length);
		var vFaces = new Array(this.vertices.length);
		for (var i = 0; i < this.edges.length; i++) {
			var v1Ind = this.edges[i][0];
			var v2Ind = this.edges[i][1];
			var v1 = this.vertices[v1Ind];
			var v2 = this.vertices[v2Ind];
			var v1New = v1.clone().lerp(v2, part);
			var v2New = v2.clone().lerp(v1, part);
			if (normalized) {
				v1New.setLength(l);
				v2New.setLength(l);
			}
			newVertices[2*i] = v1New;
			newVertices[2*i+1] = v2New;
			if (!Array.isArray(vFaces[v1Ind])) vFaces[v1Ind] = [];
			vFaces[v1Ind].push(2*i);
			if (!Array.isArray(vFaces[v2Ind])) vFaces[v2Ind] = [];
			vFaces[v2Ind].push(2*i+1);
			
			var ff = this.findAdjasentFaces(this.edges[i]);
			for (var j = 0; j < ff.length; j++) {
				if (!Array.isArray(fFaces[ff[j]])) fFaces[ff[j]] = [];
				fFaces[ff[j]].push(2*i);
				fFaces[ff[j]].push(2*i+1);
			}
		}
		return new LogicalPolyhedron(newVertices, fFaces.concat(vFaces));
	},
	
	rectify: function (normalized = true) {
		var l = this.vertices[0].length();

		var newVertices = new Array(this.edges.length);
		var fFaces = new Array(this.faces.length);
		var vFaces = new Array(this.vertices.length);
		for (var i = 0; i < this.edges.length; i++) {
			var v1Ind = this.edges[i][0];
			var v2Ind = this.edges[i][1];
			var v1 = this.vertices[v1Ind];
			var v2 = this.vertices[v2Ind];
			var vNew = v1.clone().lerp(v2, 0.5);
			if (normalized) {
				vNew.setLength(l);
			}
			newVertices[i] = vNew;
			if (!Array.isArray(vFaces[v1Ind])) vFaces[v1Ind] = [];
			vFaces[v1Ind].push(i);
			if (!Array.isArray(vFaces[v2Ind])) vFaces[v2Ind] = [];
			vFaces[v2Ind].push(i);
			
			var ff = this.findAdjasentFaces(this.edges[i]);
			for (var j = 0; j < ff.length; j++) {
				if (!Array.isArray(fFaces[ff[j]])) fFaces[ff[j]] = [];
				fFaces[ff[j]].push(i);
			}
		}
		return new LogicalPolyhedron(newVertices, fFaces.concat(vFaces));
	},
	
	cantellate: function (semiregular = true, normalized = true) {
		var l = this.vertices[0].length();

		var rectPoly = this.rectify();
		var newVertices = new Array(rectPoly.edges.length);
		var fFaces = new Array(rectPoly.faces.length);
		var vFaces = new Array(rectPoly.vertices.length);
		for (var i = 0; i < rectPoly.edges.length; i++) {
			var v1Ind = rectPoly.edges[i][0];
			var v2Ind = rectPoly.edges[i][1];
			var v1 = rectPoly.vertices[v1Ind];
			var v2 = rectPoly.vertices[v2Ind];
			var ff = rectPoly.findAdjasentFaces(rectPoly.edges[i]);
			var f1 = rectPoly.getFaceCenter(rectPoly.faces[ff[0]]);
			var f2 = rectPoly.getFaceCenter(rectPoly.faces[ff[1]]);
			var vNew = LogicalPolyhedron.getCantiVertex([v1, f1, f2], [4, rectPoly.faces[ff[0]].length, rectPoly.faces[ff[1]].length]); 
			if (normalized) vNew.setLength(l);
			newVertices[i] = vNew;
			for (var j = 0; j < ff.length; j++) {
				if (!Array.isArray(fFaces[ff[j]])) fFaces[ff[j]] = [];
				fFaces[ff[j]].push(i);
			}
			if (!Array.isArray(vFaces[v1Ind])) vFaces[v1Ind] = [];
			vFaces[v1Ind].push(i);
			if (!Array.isArray(vFaces[v2Ind])) vFaces[v2Ind] = [];
			vFaces[v2Ind].push(i);
			
		}
		return new LogicalPolyhedron(newVertices, fFaces.concat(vFaces));
	}, 
	
	cantitruncate: function (semiregular = true, normalized = true) {
		var l = this.vertices[0].length();

		var rectPoly = this.rectify();
		var newVertices = new Array(2*rectPoly.edges.length);
		var fFaces = new Array(rectPoly.faces.length);
		var vFaces = new Array(rectPoly.vertices.length);
		for (var i = 0; i < rectPoly.edges.length; i++) {
			var v1Ind = rectPoly.edges[i][0];
			var v2Ind = rectPoly.edges[i][1];
			var v1 = rectPoly.vertices[v1Ind];
			var v2 = rectPoly.vertices[v2Ind];
			var ff = rectPoly.findAdjasentFaces(rectPoly.edges[i]);
			var f1 = rectPoly.getFaceCenter(rectPoly.faces[ff[0]]);
			var f2 = rectPoly.getFaceCenter(rectPoly.faces[ff[1]]);
			var v1New = LogicalPolyhedron.getCantiVertex([v1, f1, f2], [4, rectPoly.faces[ff[0]].length*2, rectPoly.faces[ff[1]].length*2]); 
			var v2New = LogicalPolyhedron.getCantiVertex([v2, f1, f2], [4, rectPoly.faces[ff[0]].length*2, rectPoly.faces[ff[1]].length*2]);  
			if (normalized) {
				v1New.setLength(l);
				v2New.setLength(l);
			}
			newVertices[2*i] = v1New;
			newVertices[2*i+1] = v2New;
			for (var j = 0; j < ff.length; j++) {
				if (!Array.isArray(fFaces[ff[j]])) fFaces[ff[j]] = [];
				fFaces[ff[j]].push(2*i);
				fFaces[ff[j]].push(2*i+1);
			}
			if (!Array.isArray(vFaces[v1Ind])) vFaces[v1Ind] = [];
			vFaces[v1Ind].push(2*i);
			if (!Array.isArray(vFaces[v2Ind])) vFaces[v2Ind] = [];
			vFaces[v2Ind].push(2*i+1);
			
		}
		return new LogicalPolyhedron(newVertices, fFaces.concat(vFaces));

	}, 
	snub: function (phi = 0, sh = 1, normalized = true) {
		var l = this.vertices[0].length();
		var newVertices = new Array();
		var fFaces = new Array(this.faces.length);
		var vFaces = new Array(this.vertices.length);
		var eFacesRaw = new Array(this.edges.length);
		function rotShiftVector (vector, axis, angle, dist) {
			if (axis.lengthSq() != 1) axis.normalize();
			var R = axis.dot(vector);
			return vector.clone().multiplyScalar(Math.cos(angle))
					.add(axis.clone().multiplyScalar(R*(dist-Math.cos(angle))))
					.add(new THREE.Vector3().crossVectors(vector, axis).multiplyScalar(Math.sin(angle)));
			
		}
		
		for (var i = 0; i < this.faces.length; i++) {
			var c = this.getFaceCenter(this.faces[i]);
			for (var j = 0; j < this.faces[i].length; j++) {
				var vNew = rotShiftVector(this.vertices[this.faces[i][j]], c, phi, sh);
				if (normalized) vNew.setLength(l);
				newVertices.push(vNew);
				var vertInd = newVertices.length - 1;
				if (!Array.isArray(fFaces[i])) fFaces[i] = [];
				fFaces[i].push(vertInd);
				if (!Array.isArray(vFaces[this.faces[i][j]])) vFaces[this.faces[i][j]] = [];
				vFaces[this.faces[i][j]].push(vertInd);
				var ffEdges = this.findAdjasentEdges(this.faces[i]);
				for (var e = 0; e < ffEdges.length; e++) {
					if (this.edges[ffEdges[e]].indexOf(this.faces[i][j])>=0){
						if (!Array.isArray(eFacesRaw[ffEdges[e]])) eFacesRaw[ffEdges[e]] = [];
						eFacesRaw[ffEdges[e]].push(vertInd);
					}
				}
			}
		}
		
		var eFaces = new Array();
		for (var i = 0; i < eFacesRaw.length; i++) {
			var maxDist = 0; 
			var maxDistVerts = [-1, -1];
			for (var j = 0; j < 3; j++)
				for (var k = j+1; k < 4; k++){
					var l = newVertices[eFacesRaw[i][j]].distanceTo(newVertices[eFacesRaw[i][k]]);
					if (l > maxDist) {
						maxDist = l;
						maxDistVerts = [j, k];
					}
				}
			
			for (var j = 0; j < 2; j++) {
				eFaces[2*i + j] = [];
				for (var k = 0; k < 4; k++) 
					if (k != maxDistVerts[j]) eFaces[2*i + j].push(eFacesRaw[i][k]);
			}
		}
		return new LogicalPolyhedron(newVertices, fFaces.concat(vFaces).concat(eFaces));
		

	},
	//----------------------------------------------------------------
	
	
	projectToEdge: function (p, index) {
		return Utils.projectToVector(p, this.vertices[this.edges[index][0]], this.vertices[this.edges[index][1]]);
	},
	getPointOnEdge: function (index, alpha) {
		return this.vertices[this.edges[index][0]].clone().lerp(this.vertices[this.edges[index][1]], alpha);
	}, 
	getFaceHP: function (index) {
		var vertsArr = [];
		for (var i = 0; i < this.faces[index].length; i++) {
			vertsArr.push(this.vertices[this.faces[index][i]]);
		}
		return new HyperPlane(vertsArr);
	}, 
	
	projectToFace: function (p, index) {
		var hp = this.getFaceHP(index);
		return hp.project(p);
	}, 
	clone: function() {
		var newVerts = [];
		for (var i = 0; i < this.vertices.length; i ++) {
			newVerts.push(this.vertices[i].clone());
		}
		var newFaces = [];
		for (var i = 0; i < this.faces.length; i++){
			newFaces.push(this.faces[i].slice(0));
		}
		var newEdges = [];
		for (var i = 0; i < this.edges.length; i++) {
			newEdges.push(this.edges[i].slice(0));
		}
		return new LogicalPolyhedron(newVerts, newFaces, newEdges, this.getUV);
	}

}

LogicalPolyhedron.getCenter = function () {
	var verts;
	if (arguments[0] instanceof LogicalPolyhedron || arguments[0] instanceof LogicalPolygon) {
		verts = arguments[0].vertices;
	} else {
		if (Array.isArray(arguments[1])) {
			verts = [];
			for (var i = 0; i < arguments[1].length; i++) {
				verts.push(arguments[0][arguments[1][i]]);
			}
		}
		else 
			verts = arguments[0];
	}
	var c; 
	if (verts[0] instanceof THREE.Vector4) {
		c = new THREE.Vector4(0, 0, 0, 0);
	} else {
		c = new THREE.Vector3();
	}
	for (var i = 0; i < verts.length; i++) {
		c.add(verts[i]);
	}
	c.multiplyScalar(1/verts.length);
	return c;

	
}

LogicalPolyhedron.getCantiVertex= function(vectors, degrees) {
	var normVectors = [];
	for (var i = 0; i < vectors.length; i++) {
		normVectors.push(vectors[i].clone().normalize());
	}
	//console.log("getCantiVertex", normVectors, degrees);
	var c01 = normVectors[0].dot(normVectors[1]);
	var c02 = normVectors[0].dot(normVectors[2]);
	var s01 = Math.sqrt(1-c01*c01);
	var s02 = Math.sqrt(1-c02*c02);
	var t001 = s01/(Math.tan(Math.PI/degrees[0])/Math.tan(Math.PI/degrees[1])+c01);
	var t002 = s02/(Math.tan(Math.PI/degrees[0])/Math.tan(Math.PI/degrees[2])+c02);
	var v01 = new THREE.Vector3().lerpVectors(normVectors[0], normVectors[1], t001/(t001*(1-c01)+s01)).normalize();
	var v02 = new THREE.Vector3().lerpVectors(normVectors[0], normVectors[2], t002/(t002*(1-c02)+s02)).normalize();
	//console.log(v01.x, v01.y, v01.z, v02.x, v02.y, v02.z);
	var res = new THREE.Vector3().crossVectors(
				v01.cross(normVectors[1].clone().cross(normVectors[0])), 
				v02.cross(normVectors[2].clone().cross(normVectors[0]))).normalize();
	if (res.dot(normVectors[0]) < 0) res.negate();
	return res;
}

//vertices - array of THREE.Vector3 or THREE.Vector2
//edges - array of pairs of integer, inidices in 'vertices'
var LogicalPolygon = function (vertices, edges) {
	this.vertices = vertices;
	this.edges = edges;
	this.dim = 2;

}
LogicalPolygon.prototype = {
	constructor: LogicalPolygon
}

//vertices - array of THREE.Vector4
//faces - array of arrays of indices in 'vertices'
//cells - array of indices in 'vertices'
var LogicalPolytope = function (vertices, faces, cells) {
	LogicalPolyhedron.call(this, vertices, faces);
	this.dim = 4;
	this.cellsVertices = cells;
	this.cellsFaces = [];
	for (var j = 0; j < this.cellsVertices.length; j++) {
		this.cellsFaces[j] = [];
		for (var m = 0; m < this.faces.length; m++) {
			var present = true;
			for (var n = 0; n < this.faces[m].length; n++) {
				if (this.cellsVertices[j].indexOf(this.faces[m][n]) < 0)
					present = false;
			}
			if (present) this.cellsFaces[j].push(m);
		}

	}
}


LogicalPolytope.prototype = Object.create(LogicalPolyhedron.prototype);
var lppp = LogicalPolytope.prototype;

lppp.constructor = LogicalPolytope;

lppp.getProjection = function (direction){
	//direction: {theta: angle around y, phi: angel around new z}
	var mat = Utils.dirToMatrix(direction);
	var newVerts = [];
	for (var i = 0; i < this.vertices.length; i++) {
		var v4 = this.vertices[i].clone().applyMatrix4(mat);
		newVerts.push(new THREE.Vector3(v4.x, v4.y, v4.z));
	}
	return new LogicalPolyhedron(newVerts, this.faces, this.edges)
}
lppp.getDual = function(normalized = true) {
//returns dual polytope (vertices = centers of 3d cells)
	var radius = this.vertices[0].length();
	var newVerts = new Array(this.cellsVertices.length);
	var newFaces = new Array(this.edges.length);
	var newCells = new Array(this.vertices.length);
	for (var i = 0; i < newVerts.length; i++){
		newVerts[i] = LogicalPolyhedron.getCenter(this.vertices, this.cellsVertices[i]);
		if (normalized) newVerts[i].setLength(radius);
	}
	for (var i = 0; i < newFaces.length; i++) {
		newFaces[i] = Utils.findAdjacentElements (this.edges[i], this.cellsVertices);
	}
	for (var i = 0; i < newCells.length; i++) {
		newCells[i] = [];
		for (var j = 0; j < this.cellsVertices.length; j++) {
			if (this.cellsVertices[j].indexOf(i) >= 0)
				newCells[i].push(j);
		}
	}
	
	return new LogicalPolytope(newVerts, newFaces, newCells);

}

lppp.birectify = function (normalized = true) {
//returns birectified polytope (vertices = centers of 2d faces)
	var radius = this.vertices[0].length();
	var newVerts = new Array(this.faces.length);
	var newFaces = new Array();//?
	var newCells = new Array(this.vertices.length + this.cellsVertices.length);
	for (var i = 0; i < newVerts.length; i++){
		newVerts[i] = LogicalPolyhedron.getCenter(this.vertices, this.faces[i]);
		if (normalized) newVerts[i].setLength(radius);
		for (var j = 0; j < this.faces[i].length; j++) {
			if (!Array.isArray(newCells[this.faces[i][j]])) newCells[this.faces[i][j]] = [];
			newCells[this.faces[i][j]].push(i);
		}
	}
	for (var i = 0; i < this.cellsFaces.length; i ++) {
		newCells[this.vertices.length + i] = this.cellsFaces[i].slice();
	}
	for (var i = 0; i < this.cellsVertices.length; i ++) {
		for (var j = 0; j < this.cellsVertices[i].length; j++) {
			var newFace = [];
			for (var k = 0; k < this.cellsFaces[i].length; k++) {
				if (this.faces[this.cellsFaces[i][k]].indexOf(this.cellsVertices[i][j]) >= 0){
					newFace.push(this.cellsFaces[i][k]);
				}
			}
			newFaces.push(newFace);
		}
	}
	for (var i = 0; i < this.vertices.length - 1; i++) {
		for (var j = i+1; j < this.vertices.length; j++) {
			var newFace = [];
			for (var k = 0; k < this.faces.length; k++) {
				if (this.faces[k].indexOf(i) >=0 && this.faces[k].indexOf(j) >=0) {
					newFace.push(k);
				}
			}
			if (newFace.length > 2) newFaces.push(newFace);
		}
	}
	return new LogicalPolytope(newVerts, newFaces, newCells);
}


lppp.getSection = function () {
	//returns the section of the given polytope by 3d-space normal to given direction, intersection it in a given distance from the center
	//Direction is given as a normal vector or angles (the first argument). The second argument is a distance. 
	//If distance is not given and the first argument is vector, its length is used instead.
	var hp = new HyperPlane(...arguments);
	var sectionObject = this.getSectionObject(hp, this.cells);//.apply(this,arguments);
	var sectionVertices = sectionObject.values;
	var sectionFaces = new Array(this.cellsVertices.length);
	for (var i = 0; i < sectionObject.verts.length; i++) {
		for (var j = 0; j < this.cellsVertices.length; j++) {
			if (this.cellsVertices[j].indexOf (sectionObject.verts[i].index) >= 0) {
				if (!Array.isArray(sectionFaces[j])) sectionFaces[j] = [];
				sectionFaces[j].push(i);
			}
		}
	}
	for (var i = 0; i < sectionObject.edges.length; i++) {
		var cells = Utils.findAdjacentElements(this.edges[sectionObject.edges[i].index], this.cellsVertices);
		for (var j = 0; j < cells.length; j++) {
			if (!Array.isArray(sectionFaces[cells[j]])) sectionFaces[cells[j]] = [];
			sectionFaces[cells[j]].push(i + sectionObject.verts.length);
		}
	}
	var i = 0;
	while (i < sectionFaces.length) {
		if (Array.isArray(sectionFaces[i])) i++ 
		else sectionFaces.splice(i, 1);
	}
	var verts3d = new Array();
	for (var i = 0; i < sectionObject.values.length; i++) {
		var v = sectionObject.values[i];
		verts3d.push(new THREE.Vector3(v.x, v.y, v.z))
	}
	return new LogicalPolyhedron(verts3d, sectionFaces);

}

lppp.getStereoProjection = function (direction){
//Returns stereographic projection
//If direction is given (in form of a vector or angles) the center of projection is on intersection of the direction vector 
//and the minimal full-sphere containig all vertices. If direction is not given, the center of the first 3d cell is used instead
	var vector, dir;
	if (direction && direction.isVector4) {
		vector = direction;
		dir = Utils.vectorToDir(vector);
	} else if (direction && direction.hasOwnProperty("chi")) {
		dir = direction;
		vector = Utils.dirToVector(dir);
	} else {
		vector = LogicalPolyhedron.getCenter(this.vertices, this.cellsVertices[0]);
		dir = Utils.vectorToDir(vector);
	}
	
	var mat = Utils.dirToMatrix(dir);
	var newVerts = [];
	var RMax = 0;
	for (var i = 0; i < this.vertices.length; i++) {
		if (this.vertices[i].length() > RMax) RMax = this.vertices[i].length();
		newVerts.push(this.vertices[i].clone().applyMatrix4(mat));
	}
	var flatVerts = [];
	for (var i = 0; i < newVerts.length; i++) {
		flatVerts.push(new THREE.Vector3(newVerts[i].x/(RMax - newVerts[i].w), 
										 newVerts[i].y/(RMax - newVerts[i].w), 
										 newVerts[i].z/(RMax - newVerts[i].w)));
	}
	
	return new LogicalPolyhedron(flatVerts, this.faces);
}; 

 
//console.log(HyperPlane);

var Utils = {
	dirToVector: function (dir) {
		var x = Math.sin(dir.theta)*Math.cos(dir.phi);
		var y = Math.sin(dir.theta)*Math.sin(dir.phi);
		var z = Math.cos(dir.theta);
		if (dir.hasOwnProperty("chi")) {
			var sc = Math.sin(dir.chi);
			x*=sc;
			y*=sc;
			z*=sc;
			w = Math.cos(dir.chi);
			return new THREE.Vector4(x, y, z, w);
		} else
			return new THREE.Vector3(x, y, z);
	},
	vectorToDir: function (vector) {
		var res = {
			phi: Math.atan2(vector.y, vector.x),
			theta: Math.atan2(Math.sqrt(vector.x*vector.x + vector.y*vector.y), vector.z)
		}
		if (vector instanceof THREE.Vector4)
			res.chi = Math.atan2(Math.sqrt(vector.x*vector.x+vector.y*vector.y+vector.z*vector.z), vector.w);
		return res;
	},
	dirToMatrix: function (dir) {
		var ct = Math.cos(dir.theta);
		var st = Math.sin(dir.theta);
		var cp = Math.cos(dir.phi);
		var sp = Math.sin(dir.phi);
		if (dir.hasOwnProperty("chi")) {
			var cc = Math.cos(dir.chi);
			var sc = Math.sin(dir.chi);
			var res = new THREE.Matrix4();
			res.set(
				  ct*cp,     ct*sp,   -st,    0,
					-sp,        cp,     0,    0, 
				cc*st*cp, cc*st*sp,  cc*ct, -sc,
				sc*st*cp, sc*st*sp,  sc*ct,  cc);
		} else {
			res =  new THREE.Matrix3();
			res.set(ct*cp, ct*sp, -st,
			  	      -sp,    cp,   0,
			        st*cp, st*sp,  ct);
		}
		return res
	},
	intArray: function (n) {
		var res = [];
		for (var i = 0; i < n; i++)
			res.push(i);
		return res;
	},
	getCombinations: function (k, arr) {
	//returns all k-element sub-arrays of a given array (arr)
		if (k == arr.length) {
			var res = [];
			res[0] = arr.slice();
			return res;
		}
		if (k == 1) {
			var res = [];
			for (var iii = 0; iii < arr.length; iii++) {
				res.push([arr[iii]])
			}
			return res;
		}
		var res = [];
		for (var j = 0; j <= arr.length-k; j++) {
			var tempRes = Utils.getCombinations(k-1, arr.slice(j+1));
			for (var m = 0; m < tempRes.length; m++) {
				tempRes[m].unshift(arr[j]);
				res.push(tempRes[m]);
			}
		}
		return res;
	},
	getCombIndex2: function (n, i, j ) {
	//returns index of a pair of ith and jth element in a list of all unordered pairs of n elements
		return (n-1)*i + j - 1 - i*(i+1)/2
	},
	findAdjacentElements: function (center, elements) {
		var res = [];
		for (var i = 0; i < elements.length; i++) {	
			var allFound = true;
			for (var j = 0; j < center.length; j++) {
				if (elements[i].indexOf(center[j]) < 0) allFound = false;		
			}
			if (allFound) res.push(i);
		}
		return res;
	},
	edgeTransformMatrix: function (v1, v2, scale=1) {
	//return matrix to transform an Object3 with a CylinderGeometry to a stick between the given points
		var v0 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
		var dv = new THREE.Vector3().subVectors(v2, v1);
		
		var q = new THREE.Quaternion(dv.z, 0, -dv.x, dv.length() + dv.y);
		q.normalize();
		var mat = new THREE.Matrix4();
		mat.compose(v0.multiplyScalar(scale), q, new THREE.Vector3(1, dv.length()*scale, 1));
		
		return mat;
	},
	vectorsToMatrix: function (vectors, mat) {
		var dim = vectors[0].isVector4 ? 4 : 3;
		if (vectors.length < dim) {
			console.warn("vectorsToMatrix: Insuffisient vectors number" + vectros.length + ", need " + dim);
		}
		var arr = [];
		for (var i = 0; i < dim; i++) {
			for (var j = 0; j < dim; j++) {
				arr.push(vectors[j].getComponent(i));
			}
		}
		if (!mat) mat = dim == 4 ? new THREE.Matrix4() : new THREE.Matrix3();
		mat.fromArray(arr);
		return mat;
	}, 
	tripleProduct: function (v1, v2, v3) {
		var m = new THREE.Matrix3();
		if (Array.isArray(v1)) m = Utils.vectorsToMatrix(v1, m);
		else m = Utils.vectorsToMatrix([v1, v2, v3]);
		return m.determinant();
	},
	projectToPlane: function (p, planePoints) {
		var hp = new HyperPlane(planePoints);
		return hp.project(p);
	},
	projectToVector: function (p, v1, v2) {
	
		var dp = p.isVector4 ? new THREE.Vector4() : new THREE.Vector3();
		var dv = p.isVector4 ? new THREE.Vector4() : new THREE.Vector3();
		dp.subVectors(p, v1);
		dv.subVectors(v2, v1);
		return v1.clone().add(dv.multiplyScalar(dp.dot(dv)/dv.lengthSq()));
		
		
	},
	linesDistance: function (p1, p2, q1, q2) {
	//returns distance between two lines, given by points (p1, p2) and (q1, q2)
		if (!(p1 instanceof THREE.Vector3) 
			|| !(p2 instanceof THREE.Vector3) 
			|| !(q1 instanceof THREE.Vector3) 
			|| !(q1 instanceof THREE.Vector3) 
			|| p1.equals(p2) || q1.equals(q2)  ) {
			console.warn("Invalid arguments for linesDistance", p1, p2, q1, q2);
			return null;
		}
		if (p1.equals(q1) || p2.equals(q1) || p2.equals(q2) || p1.equals(q2)) return 0;
		var p = p2.clone().sub(p1);
		var q = q2.clone().sub(q1);
		var d = q1.clone().sub(p1);
		var s = new THREE.Vector3().crossVectors(p, q).length();
		if (s == 0) {
			return d.lengthSq() - Math.pow(d.dot(p1),2)/p1.lengthSq();
		}
		return Math.abs(Utils.tripleProduct(d, p, q))/s;
	},
	isDir: function (object) {
		if (object.hasOwnProperty("theta") && object.hasOwnProperty("phi")) {
			return object.hasOwnProperty("chi") ? 4 : 3;
		} 
		return false;
	},
	goldenRatio: 0.5*(Math.sqrt(5) - 1),
	dirIdentical3 : {theta: 0, phi: 0}, 
	dirIdentical4 : {theta: 0, phi: 0, chi: 0} 
}

//---------Platonic Solids-----------------------------
var PlatonicSolids = {};
(function () {
	this.tetrahedron = new LogicalPolyhedron(
	[new THREE.Vector3(1, 1, 1),
	new THREE.Vector3(-1, -1, 1),
	new THREE.Vector3(-1, 1, -1),
	new THREE.Vector3(1, -1, -1)], 
	[[0, 1, 2], [1, 0, 3], [3, 2, 1], [0, 2, 3]]
	)


	var cubeVertices = [];
	var curVertex = new THREE.Vector3();
	var cubeFaces = new Array(6);
	for (var k = 0; k < 8; k++) {
		for (var i = 0; i < 3; i++) {
			curVertex.setComponent(i, ((k>>i)%2)*2-1);
			if (!Array.isArray(cubeFaces[2*i + (k>>i)%2])) cubeFaces[2*i + (k>>i)%2]=[];
			cubeFaces[2*i + (k>>i)%2].push(k);
		}
		cubeVertices.push(curVertex.clone());
	}
	this.cube = new LogicalPolyhedron( cubeVertices, cubeFaces);
	this.octahedron = this.cube.getDual();

	var gr = Utils.goldenRatio;
	var gr1 = gr + 1;

	var dodeVertices = this.cube.vertices.slice();
	for (var k = 0; k < 3; k++){
		var v1 = new THREE.Vector3();
		v1.setComponent(k, 0);
		for (var m = 0; m < 4; m++) {
			v1.setComponent((k+1)%3, ((m>>1)*2-1)*gr1);
			v1.setComponent((k+2)%3, ((m%2)*2-1)*gr);
			dodeVertices.push(v1.clone());
		}
	}
	var dodeFaces = new Array(12);
	for (var i = 0; i < 12; i++) {
		var c = new THREE.Vector3().addVectors(this.cube.vertices[this.cube.edges[i][0]], this.cube.vertices[this.cube.edges[i][1]]);
		var k0 = -1;
		for (var k = 0; k < 3; k++) {
			if (Math.abs(c.getComponent(k)) < 1e-10) k0 = k;
		}
		var m = (2*c.getComponent((k0+1)%3)+c.getComponent((k0+2)%3)+6)/4;
		dodeFaces[i] = [this.cube.edges[i][0], 8+4*k0+m, this.cube.edges[i][1], 8+4*((k0+1)%3)+2*(m%2), 8+4*((k0+1)%3)+2*(m%2)+1]

	}

	this.dodecahedron = new LogicalPolyhedron(dodeVertices, dodeFaces);
	this.icosahedron = this.dodecahedron.getDual();

}).apply(PlatonicSolids);

var ArchimedeanSolids = {};
(function(){
	this.cuboctahedron = PlatonicSolids.cube.rectify();
	this.icosidodecahedron = PlatonicSolids.dodecahedron.rectify();
	this.great_rhombicuboctahedron = PlatonicSolids.cube.cantitruncate();
	this.great_rhombicosidodecahedron = PlatonicSolids.dodecahedron.cantitruncate();
	this.small_rhombicuboctahedron = PlatonicSolids.cube.cantellate();
	this.small_rhombicosidodecahedron = PlatonicSolids.dodecahedron.cantellate();

	this.tribonacci = 0.54369901269207; //t^3+t^2+t-1=0, Wikipedia
	var t = this.tribonacci;
	this.snub_cube = PlatonicSolids.cube.snub(Math.atan(t*t), Math.sqrt(2/(t*t+1))/t);
	
	for (var f in PlatonicSolids) {
		this["truncated_" + f] = PlatonicSolids[f].truncate();
	}
	
	//http://dmccooey.com/polyhedra/LsnubDodecahedron.html
	var phi = 1+Utils.goldenRatio;
	var cbrt = function (arg) {
		if (arg == 0) return 0;
		if (arg > 0) return Math.pow(arg, 1/3);
		return -Math.pow(-arg, 1.3);
	}
	var sqrt = Math.sqrt;
	var x = cbrt((phi+sqrt(phi-5/27))/2)+cbrt((phi-sqrt(phi-5/27))/2);
	var snubDodeR5 = sqrt(20*(5*(x+(1/x))*(1+2*phi)+(12+11*phi)))/20;
	var snubDodeR3 = x*phi*sqrt(3*(x*(x+phi)+1))/6;
	var dodeR = Math.sqrt((7+11*phi)/20);
	//---------------------------
	var snubDodeShift = snubDodeR5/dodeR;
	var c35 = sqrt((3+4*phi)/15);
	var s35 = sqrt(1-c35*c35);
	var cosSh = (snubDodeR3-snubDodeR5*c35)/(0.5*s35/Math.sin(Math.PI/5));
	this.snub_dodecahedron = PlatonicSolids.dodecahedron.snub(Math.acos(cosSh), snubDodeShift);
	
}).apply(ArchimedeanSolids);

//------------------Regular polytopes---------------------------------------------------
var w5 = -1/Math.sqrt(5);
var simplexVertices = [
	new THREE.Vector4(1, 1, 1, w5),
	new THREE.Vector4(1, -1, -1, w5),
	new THREE.Vector4(-1, 1, -1, w5),
	new THREE.Vector4(-1, -1, 1, w5),
	new THREE.Vector4(0, 0, 0, Math.sqrt(5)+w5),
];
/*var simplexVertices = [
	new THREE.Vector4(2, 0, 0, 0),
	new THREE.Vector4(0, 2, 0, 0),
	new THREE.Vector4(0, 0, 2, 0),
	new THREE.Vector4(0, 0, 0, 2),
	new THREE.Vector4(gr, gr, gr, gr),
];*/
var simplexFaces = Utils.getCombinations(3, Utils.intArray(5));
var simplexCellsVertices = Utils.getCombinations(4, Utils.intArray(5));

var simplex = new LogicalPolytope(simplexVertices, simplexFaces, simplexCellsVertices);

var dualSimplex = simplex.getDual();

var tesseractVertices = [];
var curVertex = new THREE.Vector4(0, 0, 0, 0);
var tesseractFaces = new Array(24);
var tesseractCells = new Array(8);
for (var k = 0; k < 16; k++) {
	for (var i = 0; i < 4; i++) {
		curVertex.setComponent(i, ((k>>i)%2)*2-1);
		if (!Array.isArray(tesseractCells[2*i + (k>>i)%2])) tesseractCells[2*i + (k>>i)%2]=[];
		tesseractCells[2*i + (k>>i)%2].push(k);
	}
	for (var i = 0; i < 3; i++){
		for (var j = i+1; j < 4; j++) {
			var curInd = 4*(Utils.getCombIndex2(4, i, j)) + ((k>>i)%2)*2+((k>>j)%2);
			if (!Array.isArray(tesseractFaces[curInd])) tesseractFaces[curInd]  = [];
			tesseractFaces[curInd].push(k);
		}
	}
	tesseractVertices.push(curVertex.clone());
}
var tesseract = new LogicalPolytope( tesseractVertices, tesseractFaces, tesseractCells);
var hyperoctahedron = tesseract.getDual();

var cells24 = tesseract.birectify(false);
//var cells24dual = cells24.getDual();


var s2 = Math.sqrt(2)
var s_2 = 1/s2;
var s3 = Math.sqrt(3);
var s_3 = 1/s3;
var s_5 = Math.sqrt(0.2);
var s_6 = s_2*s_3;
var c10Verts = [
	new THREE.Vector4( s_2,     s_6, 0.5*s_3, -1.5*s_5),//1 0 0 0 1 //17
	new THREE.Vector4(-s_2,     s_6, 0.5*s_3, -1.5*s_5),//0 1 0 0 1 //18
	new THREE.Vector4(   0, -s2*s_3, 0.5*s_3, -1.5*s_5),//0 0 1 0 1 //20
	new THREE.Vector4(   0,       0, -0.5*s3, -1.5*s_5),//0 0 0 1 1 //24
	new THREE.Vector4(   0,  s2*s_3,     s_3,      s_5),//1 1 0 0 0 //3
	new THREE.Vector4( s_2,    -s_6,     s_3,      s_5),//1 0 1 0 0 //5
	new THREE.Vector4( s_2,     s_6,    -s_3,      s_5),//1 0 0 1 0 //9
	new THREE.Vector4(-s_2,    -s_6,     s_3,      s_5),//0 1 1 0 0 //6
	new THREE.Vector4(-s_2,     s_6,    -s_3,      s_5),//0 1 0 1 0 //10
	new THREE.Vector4(   0, -s2*s_3,    -s_3,      s_5) //0 0 1 1 0 //12
];
for (var i = 0; i < c10Verts.length; i++) 
	c10Verts[i].multiplyScalar(Math.sqrt(5));
var c10Indices = [17, 18, 20, 24, 3, 5, 9, 6, 10, 12];

var tess5Cells = [];
var tess5Faces = [];

for (var l = 0; l < c10Indices.length; l++) {
	var k = c10Indices[l];
	for (var i = 0; i < 5; i++) {
		if (!Array.isArray(tess5Cells[2*i + (k>>i)%2])) tess5Cells[2*i + (k>>i)%2]=[];
		tess5Cells[2*i + (k>>i)%2].push(l);
	}
	for (var i = 0; i < 4; i++){
		for (var j = i+1; j < 5; j++) {
			var curInd = 4*(Utils.getCombIndex2(5, i, j)) + ((k>>i)%2)*2+((k>>j)%2);
			if (!Array.isArray(tess5Faces[curInd])) tess5Faces[curInd]  = [];
			tess5Faces[curInd].push(l);
		}
	}
}
var ii = 0;
while (ii < tess5Faces.length) {
	if (!Array.isArray(tess5Faces[ii]) || tess5Faces[ii].length < 3) {
		tess5Faces.splice(ii, 1);
	} else ii++;
}

var c10 = new LogicalPolytope(c10Verts, tess5Faces, tess5Cells);




//console.log(tesseract);
var testEdges = [];
var testEdgesLengths = [];
for (var i = 0; i < tesseract.edges.length; i++) {
	var c = new THREE.Vector4().subVectors(tesseract.vertices[tesseract.edges[i][1]], tesseract.vertices[tesseract.edges[i][0]]);
	testEdges.push(c);
	testEdgesLengths.push(c.length());

}
//console.log(testEdges, testEdgesLengths);

var testFace2D = [new THREE.Vector4(1, 0, 0, 0),
				new THREE.Vector4(1, -0.5, 0, 0),
				new THREE.Vector4(0, 1, 0, 0),
				new THREE.Vector4(-0.5, -1, 0, 0)
		
	];
	
var testC = new THREE.Vector4(0.5, -2, 1.5, -0.8)
var testRotM = new THREE.Matrix4();
testRotM.set(1, 0, 0, 0,
			 0, 0.5, 0, 0.866025404,
			 0, 0,  1, 0,
			 0, -0.866025404, 0, 0.5);

for (var i = 0; i < testFace2D.length; i++) {
	testFace2D[i].add(testC).applyMatrix4(testRotM);
}

//var testPoly = new LogicalPolyhedron(testFace2D, [[0, 1, 2, 3]]);
//console.log(testPoly);

//----------------------------------------------


