

function drawFacePolygonPart(cs, N, tau, color, start = 0, close=true, scale=1) {
	var data = getFacePolygonArray(N, tau, start, close);
	if (scale != 1) {
		for (var i = 0; i < data.xs.length; i++) {
			data.xs[i]*=scale;
			data.ys[i]*=scale;
		}
	}
	cs.drawPolygon(data.xs, data.ys, color, .5, true);
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
	cs.drawPolygon(data.xs, data.ys, color, 1, true);
}

function plotSpiralCommon (cs, fullSteps, color = "black", tau=1, steps = -1, linewidth = 1, startStep = 0, startr = 1, fill = false ) {
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
	var r = plotSpiralCommon(cs, N, color, 1/(1+2*Math.sin(Math.PI/N)), N, 1, 0, 1, true);
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
