var Ns = [3, 4, 5, 6, /*7,*/ 8,/* 9,*/ 10, 20, 50, 100, 200, 500, 10000]
var colors = ["darkgreen", "blue", "red" , "magenta", "#00ccff", "#ffaa00", "#cccccc", "#aaaaaa", "#999999", "#666666", "#333333", "black"]
var DefaultGetTau = "metallic";

var cs, ctx, qs;
function dfPageInit() {
	qs = parseQueryString();
	var p = document.createElement("p");
	/** /
	cs = new PlotCanvas(qs);
	ctx = cs.ctx;
	cs.drawCross();
	p.innerHTML = "&phi;<sub>n</sub>=2&pi;n/N; r<sub>n</sub>=1/(1+2*sin(&pi;/N))<sup>n</sup>";
	document.body.appendChild(p);
	for (var i = 0; i < Ns.length; i++) {
		var r= plotSpiral(cs, Ns[i], colors[i]);
		plotPolygon(cs, Ns[i], colors[i]);
		fillPolygon(cs, Ns[i], colors[i], r)
	}
	var p = document.createElement("p");
	p.innerHTML = "N=∞; r=" + Math.exp(-2*Math.PI);
	document.body.appendChild(p);
	/**/
	var faces = [];
	if ( qs.hasOwnProperty("faces")) {
		if (qs.faces.indexOf("-") > 0) {
			var minMax = qs.faces.split("-");
			for (var j = Number(minMax[0]); j <= Number(minMax[1]); j++) {
				faces.push(j);
			}
		} else if (qs.faces.indexOf(",") > 0) {
			var facesStrs = qs.faces.split(",");
			for (var j = 0; j < facesStrs.length; j ++) {
				faces.push(Number(facesStrs[j]));
			}
		} else {
			faces.push(qs.faces);
		}
	} else {
		faces = Ns.slice(0, 6);
	}
	for (var i = 0; i < faces.length; i ++) {
		var cs = new PlotCanvas(qs);
		var N = faces[i];
		cs.drawCross();
		if (!(qs.hasOwnProperty("templates") && Number(qs.templates) != 0 && qs.templates != "no")) {
			if (N >= 6 && N%2 == 0) {
				drawFacePolygonHalf(cs, N, getTau(N/2), colors[i]);
			} else {
				drawFacePolygon(cs, N, getTau(N), colors[i], 0.8);
				//drawEmptyFace(cs, N, color, scale=1);
				//drawEmptyFace(cs, N, colors[i], 0.5);
			}
		}
		else {
			drawFaceTemplate(cs, N, getTau(N), colors[i]);
		}
	}
	
}




function drawFacePolygonPart(cs, N, tau, color, start = 0, close=true, scale=1) {
	var data = getFacePolygonArray(N, tau, start, close);
	if (scale != 1) {
		for (var i = 0; i < data.xs.length; i++) {
			data.xs[i]*=scale;
			data.ys[i]*=scale;
		}
	}
	cs.drawPolygon(data.xs, data.ys, color, 2, true);
}
function drawFaceTemplate(cs, N, tau, color, start = 0) {
	var dataT = getTemplateData({x: - 0.25, y: -0.1}, {x: 0.25, y: 0.1}, N);
	cs.drawPolygon(dataT.xs, dataT.ys, color, 2, false);
	
	dataT = getTemplateData({x: 0.25, y: 0.1}, {x: -0.25, y: -0.1}, N);
	
	cs.drawPolygon(dataT.xs, dataT.ys, color, 2, false);
}

function drawFacePolygon(cs, N, tau, color, scale=1) {
	
	for (var i = 0; i < N; i++)
		drawFacePolygonPart(cs, N, tau, color, i, true, scale);
}

function drawFacePolygonHalf(cs, N, tau, color, scale=1) {
	for (var i = 0; i < N/2; i++)
		drawFacePolygonPart(cs, N/2, tau, color, i, "half", scale);
}

function drawEmptyFace(cs, N, color, scale=1) {
	//getSpiralArrays(res, fullSteps, tau=1, steps = -1, startStep = 0, startr = 1)
	var data = {};
	getSpiralArrays(data, N);
	
	if (scale != 1) {
		for (var i = 0; i < data.xs.length; i++) {
			data.xs[i]*=scale;
			data.ys[i]*=scale;
		}
	}
	cs.drawPolygon(data.xs, data.ys, color, 2, true);
}

function plotSpiralCommon (cs, fullSteps, color = "black", tau=1, steps = -1, linewidth = 2, startStep = 0, startr = 1, fill = false ) {
	var data = {};
	var r = getSpiralArrays(data, fullSteps, tau, steps, startStep, startr);
	//	this.drawPolygon = function (xs, ys, color, lineWidth = 2, fill = false, fillColor = null, fillAlpha = "66") {

	cs.drawPolygon(data.xs, data.ys, color, linewidth, fill);
	return r;
}

function plotSpiral (cs, N, color) {
	var r = plotSpiralCommon(cs, N, color, 1/(1+2*Math.sin(Math.PI/N)));
	var p = document.createElement("p");
	p.setAttribute("style", "color:" + color );
	p.innerHTML = "N=" + N + "; r<sub>" + N + "</sub>=" + r;
	document.body.appendChild(p);
	return r;
}
function fillSpiral (cs, N, color) {
	var r = plotSpiralCommon(cs, N, color, 1/(1+2*Math.sin(Math.PI/N)), N, 2, 0, 1, true);
	var p = document.createElement("p");
	p.setAttribute("style", "color:" + color );
	p.innerHTML = "N=" + N + "; r<sub>" + N + "</sub>=" + r;
	document.body.appendChild(p);
	return r;
}

function plotPolygon (cs, N, color, scale = 1) {
	plotSpiralCommon (cs, N, color, 1, N, 0.5, 0, scale);
}

function fillPolygon(cs, N, color, scale = 1) {
	plotSpiralCommon (cs, N, color, 1, N, 0.5, 0, scale, true);
}

function fillPolygonSpiral(cs, N, color, tau) {
}
