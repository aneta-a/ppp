function getTau(N) {
	var qs = parseQueryString();
	if (qs.hasOwnProperty("tau" + N)) return qs["tau"+N];
	var gettau = DefaultGetTau;
	if (qs.hasOwnProperty("gettau")) gettau = qs.gettau;
	switch (gettau) {
		case "sqrt": 
			return 0.5*(Math.sqrt(N) - 1);
		case "bisect":
			return 1/(1+2*Math.sin(Math.PI/N));
		case "const": 
			if (qs.hasOwnProperty("tau")) return qs.tau
			return GoldenRatio
		case "endconst": 
			var a = (qs.hasOwnProperty("tau")) ? qs.tau : 1/3;
			return Math.pow(a, 1/(N-2))
		case "normal":
			return getTauAngle(N, 0.5*Math.PI);
		case "minus1": 
			return getTauAngle(N, Math.PI*((N-3)/(N-1)));
		case "h":
			return Math.cos(2*Math.PI/N)
		case "metallic": 
			if (N == 4) return 1/Math.sqrt(3);//.5;
			if (N == 3) return (Math.sqrt(3) - 1)/2;
			return (N-6 + Math.sqrt((N-4)*(N-4)+4))/2/(N-4)
			
			
	}
		
	
	return 0.5*(Math.sqrt(N) - 1)
}

function getTauAngle(N, angle) {
		return Math.cos(angle + Math.PI/N)/Math.cos(angle + 3*Math.PI/N)
}

function getSpiralArrays(res, fullSteps, tau=1, steps = -1, startStep = 0, startr = 1) {
	if (!res.hasOwnProperty("xs")) res.xs = [];
	if (!res.hasOwnProperty("ys")) res.ys = [];
	var r = startr;
	var N = fullSteps;
	var dPhi = 2*Math.PI/N;
	var phi = dPhi*startStep;
	res.xs.push(r*Math.cos(phi));
	res.ys.push(r*Math.sin(phi));
	if (steps < 1) steps = N;
	for (var i = 0; i < steps; i++) {
		phi += dPhi;
		r*=tau;		
		res.xs.push(r*Math.cos(phi));
		res.ys.push(r*Math.sin(phi));
	}
	return r;
	
}

function getFacePolygonArray (N, tau, start = 0, close=true, res=null) {
	if (!res) res = {};
	var r = getSpiralArrays(res, N, tau, N-2, start);
	var dPhi = 2*Math.PI/N;
	var phi = dPhi*(start + N - 1);
	res.xs.push(r*Math.cos(phi));
	res.ys.push(r*Math.sin(phi));
	if (close) {
		if (close == "half") {
			res.xs.push(Math.cos(phi), Math.cos(phi+dPhi/2), res.xs[0]);
			res.ys.push(Math.sin(phi), Math.sin(phi+dPhi/2), res.ys[0]);
			
		} else {
			res.xs.push(Math.cos(phi), res.xs[0]);
			res.ys.push(Math.sin(phi), res.ys[0]);
		}
	} else {
		res.xs.push(0, Math.cos(phi));
		res.ys.push(0, Math.sin(phi));
	}
	return res;
}

function getTemplateData(p1, p2, N) {
	var data = getFacePolygonArray(N, getTau(N), 0, false);
	var lastInd = data.xs.length - 1;
	var dataT = transformArrays ({x: data.xs[lastInd], y: data.ys[lastInd]}, {x: data.xs[0], y: data.ys[0]}, p1, p2, data.xs, data.ys);
	return dataT;

}


