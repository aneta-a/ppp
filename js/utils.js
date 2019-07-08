const GoldenRatio = 0.5*(Math.sqrt(5)-1)
const EPSILON = 1e-10;

function parseQueryString(){
	var queryString = window.location.search;
	var res = {};
	if (queryString) {
		queryString = queryString.substring(1);
		var params = queryString.split("&");
		for (var i = 0; i < params.length; i++){
			var keyValue = params[i].split("=");
			var val = Number(keyValue[1]);
			res[keyValue[0]] = !Number.isNaN(val) ? val : keyValue[1];
		}
			
	}
	return res;
}


function copyObject(source, res = {}) {
	for (var f in source) {
		if (source.hasOwnProperty(f)) res[f] = source[f];
	}
	return res
}

function getBool(val) {
	if (val) {
		if (!val) return false
		if (!isNaN(val)) return val != 0;
		if (val.toLowerCase().charAt(0) == "n") return false
		if (val.toLowerCase() == "false") return false
		if (val == 0) return false
		return true
	} 
	return false
}

function transformPoint(p, a, z0) {
	if (checkXY(p) && checkXY(a) && checkXY(z0)) {
		return {x: p.x*a.x - p.y*a.y + z0.x, y: p.y*a.x + p.x*a.y + z0.y}
	}
	else console.warn("Invalid transform", p, a, z0);
	return null

}

function getTransform (p1in, p2in, p1out, p2out) {
	if (checkXY(p1in) && checkXY(p2in) && checkXY(p2out) && checkXY(p1out)) {
		var dx = p1in.x - p2in.x;
		var dy = p1in.y - p2in.y;
		var denom = dx*dx + dy*dy;
		if (denom < EPSILON) {
			console.warn("Invalid transform base", p1in, p2in);
			return null
		}
		var dx_ = p1out.x - p2out.x;
		var dy_ = p1out.y - p2out.y;
		var a = {x: (dx_*dx + dy_*dy)/denom, y: (dy_*dx - dx_*dy)/denom}
		var z = {x: p1out.x - a.x*p1in.x + a.y*p1in.y, y: p1out.y - a.y*p1in.x - a.x*p1in.y}
		return {a: a, z0: z}

	} 
	else console.warn("Invalid transform base", p1in, p2in, p1out, p2out);
	return null;
}

function transformArrays (p1in, p2in, p1out, p2out, xsin, ysin) {
	var t = getTransform(p1in, p2in, p1out, p2out);
	if (t) {
		var res = transformData(t, {xs: xsin, ys: ysin});
		
		return res;
	}
	return null;
}

function transformData(t, data, res) {
	if (!res) res = {};
	if (!res.hasOwnProperty("xs")) res.xs = [];
	if (!res.hasOwnProperty("ys")) res.ys = [];
	for (var i = 0; i < data.xs.length; i++) {
		var p = transformPoint({x: data.xs[i], y: data.ys[i]}, t.a, t.z0);
		if (p) {
			res.xs.push(p.x);
			res.ys.push(p.y);
		}
	}
	return res;
}

function rotateData(angle, data, res) {
	if (!res) res = {}
	res = transformData({a: {x: Math.cos(angle), y: Math.sin(angle)}, z0: {x: 0, y: 0}}, data, res);
	return res;

}

function shiftData(dx, dy, data, res) {
	if (!res) res = {}
	res = transformData({a: {x: 1, y: 0}, z0: {x: dx, y: dy}}, data, res);
	return res;
}

function checkXY (p) {
	if (p && p.hasOwnProperty("x") && p.hasOwnProperty("y") && !isNaN(p.x) && !isNaN(p.y)) return true;
	return false
}
