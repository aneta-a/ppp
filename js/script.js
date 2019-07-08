var Ns = [3, 4, 5, 6, /*7,*/ 8,/* 9,*/ 10, 20, 50, 100, 200, 500, 10000]
var colors = ["darkgreen", "blue", "red" , "magenta", "#00ccff", "#ffaa00", "#cccccc", "#aaaaaa", "#999999", "#666666", "#333333", "black"]
var DefaultGetTau = "metallic";

var cs, ctx, qs;
var polyData;
var curPoly = "Cuboctahedron";
var curVF = "";
var curTemplates = "";
var edge = 300;
var defaultDPI = 96;

function pixelsToCm (arg, dpi = defaultDPI) {
	return arg/dpi*2.54;
}
function cmToPixels (arg, dpi = defaultDPI) {
	return arg/2.54*dpi;
}

function pageInit() {
	qs = parseQueryString();
	//var p = document.createElement("p");
	//p.innerHTML = "Test paragraph";
	//document.body.appendChild(p);
	//var psvg = new PlotSVG({id: "testtemplate"});
	
	
	if (qs.hasOwnProperty("size")) edge = qs.size;
	if (qs.hasOwnProperty("edge")) edge = qs.edge;
	var type = "s35";
	if (qs.hasOwnProperty("type")) type = qs.type;
	if (qs.hasOwnProperty("polyhedron")) curPoly = qs.polyhedron;
	
	//drawSpiralTemplate(psvg, type, edge);
	console.log("before data reading");
	readCSVData("templates.csv");
	document.body.appendChild(document.createElement("p"));
	var b = document.createElement("button");
	b.innerHTML = "Save";
	b.onclick = function (e) {
		psvg.saveAsFile(type + "_" + edge + "_template.svg");
	}
	//document.body.appendChild(b);
	

	
}

function readCSVData (name) {

	var txt = '';
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
	    txt = xmlhttp.responseText;
		onCSVRead(txt);
	  }
	};
	xmlhttp.open("GET",name,true);
	xmlhttp.send();
}

function onCSVRead (text) {
	console.log("oncsvread");

	polyData = text.split("\n");
	for (var i = 0; i < polyData.length; i++) {
		polyData[i] = polyData[i].split(",");
	}
	
	var nameInd = polyData[0].indexOf("Name");
	var vfInd = polyData[0].indexOf("Vertex figure");
	var templInd = polyData[0].indexOf("Templates");
	var dInd = polyData[0].indexOf("Diameter");
	var curPolyInd = -1;
	
	if (qs.hasOwnProperty("vf")) {
		for (var i = 1; i < polyData.length; i++) {
			if (polyData[i][vfInd] == qs.vf) {
				curPolyInd = i;
			}
				
		}
	} else {
		for (var i = 1; i < polyData.length; i++) {
			console.log(i, polyData[i][nameInd]);
			if (polyData[i][nameInd] && polyData[i][nameInd].toLowerCase() == curPoly.toLowerCase()) {
				curPolyInd = i;
				
			}
				
		}
	}
	
	if (curPolyInd > 0) {	
		curPoly = polyData[curPolyInd][nameInd];
		curTemplates = polyData[curPolyInd][templInd];
		curVF = polyData[curPolyInd][vfInd];
		var d = document.createElement("div");
		curPoly = curPoly.charAt(0).toUpperCase() + curPoly.slice(1);
		d.innerHTML = "<h1>" + curPoly + "</h1><p>Vertex figure: " + curVF + "</p>";
		d.innerHTML += "<p>Edge length: " + (Math.round(pixelsToCm(edge)*100)/100) + " cm</p>";
		d.innerHTML += "<p>Approximate diameter: " + (Math.round(pixelsToCm(edge*polyData[curPolyInd][dInd])*100)/100) + " cm</p>";
		//d.innerHTML += "<p>Templates: " + curTemplates + "</p>";
		document.body.appendChild(d);
		
		drawTemplates(curTemplates);
	}
}

function drawTemplates(templates) {
	
	var templSets = templates.split(" ");
	console.log("draw templates", templSets);
	for (var i = 0; i < templSets.length; i++) {
		var d = document.createElement("div");
		document.body.appendChild(d);
		var p = document.createElement("h2");
		p.innerHTML = "Type " + (i+1);//templSets[i];
		d.appendChild(p);
		var singleTemplates = templSets[i].split("+");
		//function drawFacesPreview(parent, color, templatesArray) {
		p = document.createElement("h3");
		p.innerHTML= "Faces preview";
		d.appendChild(p);
		drawFacesPreview(d, "#ffaa00", singleTemplates);
		d = document.createElement("div");
		document.body.appendChild(d);
		p = document.createElement("h3");
		p.innerHTML= "Templates";
		d.appendChild(p);

		for (var j = 0; j < singleTemplates.length; j++) {
			var psvg = new PlotSVG ({id: singleTemplates[j] + "_" + i+ "_" + edge, saveButton: true, saveButtonName: "Save page " + (j+1), saveFileName: curPoly.split(" ").join("_") + "_type" + (i+1) + "_page" + (j+1) + "of" + singleTemplates.length + "_edge" + edge + "px_dpi" + defaultDPI}, d);
			drawSpiralTemplate(psvg, singleTemplates[j], edge);
			
			
		}
		
	}
}

function getFacesTypes(templatesArray) {
	var res = {spiral: [], halfSpiral: [], flat: []};
	function addFace(type, N) {
		if (res[type].indexOf(N) < 0) res[type].push(N);
	}
	for (var i = 0; i < templatesArray.length; i++) {
		var tObj = parseType(templatesArray[i]);
		switch (tObj.letters) {
			case "s":
				for (var ii = 0; ii < tObj.numbers.length; ii++)
					addFace("spiral", tObj.numbers[ii]);
				break;
			case "f":
				addFace("flat", tObj.numbers[0]);
				for (var ii = 1; ii < tObj.numbers.length; ii++)
					addFace("spiral", tObj.numbers[ii]);
				break;
				
			case "hs":
				addFace("halfSpiral", tObj.numbers[0]);
				addFace("spiral", tObj.numbers[1]);
				if (tObj.numbers.length == 4) {
					addFace("halfSpiral", tObj.numbers[2]);
					addFace("spiral", tObj.numbers[3]);
				} else if (tObj.numbers.length == 3) {
					addFace("spiral", tObj.numbers[2]);
				}
				break;
			case "sf":
				addFace("flat", 3);
				addFace("spiral", 3);
				addFace("spiral", tObj.numbers[0]);
				break;
 
		}		
	}
	return res;
}

function drawFacesPreview(parent, color, templatesArray) {
	console.log("drawFacesPreview", parent);
	var types = getFacesTypes(templatesArray);
	var maxN = 0;
	for (var f in types)
		if (Array.isArray(types[f]))
			for (var i = 0; i < types[f].length; i++)
				if (types[f][i] > maxN) maxN = types[f][i];
	function getScale(N) {
		return Math.sin(Math.PI/maxN)/Math.sin(Math.PI/N);
	}
	var maxSize = edge/Math.sin(Math.PI/maxN);
	function getCanvas(scale) {
		var w = maxSize * scale;
		var cs = new PlotCanvas({width: w, height: w, minX: -scale, maxX: scale, minY: -scale, maxY: scale}, parent);
		return cs;  
	}
	for (var i = 0; i < types.flat.length; i++) {
		var n = Number(types.flat[i]);
		var s = getScale(n);
		drawEmptyFace(getCanvas(s), n, color, s);
	}
	for (var i = 0; i < types.halfSpiral.length; i++) {
		var n = Number(types.halfSpiral[i]);
		var s = getScale(n);
		drawFacePolygonHalf(getCanvas(s), n, getTau(n/2),  color, s);
	}
	for (var i = 0; i < types.spiral.length; i++) {
		
		var n = Number(types.spiral[i]);
		var s = getScale(n);
		drawFacePolygon(getCanvas(s), n, getTau(n),  color, s);
	}
}

function drawSpiralTemplate(psvg, type, size = 100, options = {}) {

	var tObj = parseType(type);
	var cutData = {xs:[], ys:[]};
	var etchData = {xs:[], ys:[]};
	
	switch (tObj.letters) {
		case "s":
			if (tObj.numbers.length == 1)
				tObj.numbers.push(tObj.numbers[0]);
		
			var p1 = {x: 0, y: 0};
			var p2 = {x: size, y: 0};
			cutData = getTemplateData(p1, p2, tObj.numbers[0]);
			var cutDataInv = getTemplateData(p2, p1, tObj.numbers[1]);
			cutData = concatPolyData(cutData, cutDataInv);
			etchData = {xs: [p1.x, p2.x], ys: [p1.y, p2.y]};
			break;
		case "f":
			var N = tObj.numbers[0];
			if (tObj.numbers.length == 2) tObj.numbers.push(tObj.numbers[1]);
			var R = size*0.5/Math.sin(Math.PI/N);
			var p0 = {x:R, y:0};
			etchData.xs.push(p0.x);
			etchData.ys.push(p0.y);
			var phi = 0;
			var p1 = {x:R, y:0};
			for (var i = 0; i < N; i++) {
				p0 = {x: p1.x, y: p1.y}
				phi += 2*Math.PI/N;
				p1 = {x: R*Math.cos(phi), y: R*Math.sin(phi)};
				etchData.xs.push(p1.x);
				etchData.ys.push(p1.y);
				var curCutData = getTemplateData(p1, p0, tObj.numbers[1+i%2]);
				cutData = concatPolyData(cutData, curCutData);
			}
			break;
			
		case "hs":
			var inds = []; 
			var curCutData = {};
			switch (tObj.numbers.length){
				case 2: 
					tObj.numbers.push(tObj.numbers[0]);
					tObj.numbers.push(tObj.numbers[1]);
				case 4:
					etchData.xs[0] = -size*Math.cos(2*Math.PI/tObj.numbers[2]); 
					etchData.ys[0] = -size*Math.sin(2*Math.PI/tObj.numbers[2]); 
					etchData.xs[1] = 0; 
					etchData.ys[1] = 0; 
					etchData.xs[2] = size; 
					etchData.ys[2] = 0; 
					etchData.xs[3] = size*(1+Math.cos(2*Math.PI/tObj.numbers[0])); 
					etchData.ys[3] = size*Math.sin(2*Math.PI/tObj.numbers[0]);
					inds = [[1, 3, tObj.numbers[0]/2],[0, 1, tObj.numbers[3]], [2,0, tObj.numbers[2]/2],[3,2, tObj.numbers[1]],]; 
					break;
				case 3:
					etchData.xs[0] = 0; 
					etchData.ys[0] = 0; 
					etchData.xs[1] = size; 
					etchData.ys[1] = 0; 
					etchData.xs[2] = size*(1+Math.cos(2*Math.PI/tObj.numbers[0])); 
					etchData.ys[2] = size*Math.sin(2*Math.PI/tObj.numbers[0]);
					inds = [[0, 2, tObj.numbers[0]/2],[1,0, tObj.numbers[2]],[2,1, tObj.numbers[1]]]; 
			}
			for (var i = 0; i < inds.length; i++) {
				curCutData = getTemplateData({x: etchData.xs[inds[i][0]], y: etchData.ys[inds[i][0]]},
											 {x: etchData.xs[inds[i][1]], y: etchData.ys[inds[i][1]]}, 
											 inds[i][2]);
				cutData = concatPolyData(cutData, curCutData);
			}
			break;
					

		case "sf": 
			etchData.xs[0] = 0; 
			etchData.ys[0] = 0; 
			etchData.xs[1] = size; 
			etchData.ys[1] = 0; 
			etchData.xs[2] = size*0.5; 
			etchData.ys[2] = size*Math.sqrt(3)*0.5;
			etchData.xs[3] = 0; 
			etchData.ys[3] = 0;
			etchData.xs[4] = size*0.5; 
			etchData.ys[4] = -size*Math.sqrt(3)*0.5;
			etchData.xs[5] = size; 
			etchData.ys[5] = 0;
			for (var i = 1; i < 5; i++) {
				var curCutData = getTemplateData({x: etchData.xs[i+1], y: etchData.ys[i+1]}, 
													{x: etchData.xs[i], y: etchData.ys[i]}, 
													i%2 ? 3 : tObj.numbers[0]);
				cutData = concatPolyData(cutData, curCutData);
			}
	}
	
	var angle = getMinAreaAngle(cutData, Math.sqrt(2));
	cutData = rotateData(angle, cutData);
	etchData = rotateData(angle, etchData);
	
	var shft = psvg.setSizeByArrays(cutData.xs, cutData.ys);
	//function shiftData(dx, dy, data, res) //utils.js
	cutData = shiftData(-shft.xMin, -shft.yMin, cutData);
	etchData = shiftData(-shft.xMin, -shft.yMin, etchData);
	
	//this.drawPolygon = function (xs, ys, style) { //plotsvg.js
	var cutStyle = "stroke:rgb(0,0,0);stroke-width:1.5;fill:none";
	var etchStyle = "stroke:rgb(0,0,0);stroke-width:.5;fill:none";
	psvg.drawPolygon(cutData.xs, cutData.ys, cutStyle);
	psvg.drawPolygon(etchData.xs, etchData.ys, etchStyle);
	
	

}

function parseType (arg) {
	arg = arg.toLowerCase();
	var matches = /([a-z]+)(\d*)/g.exec(arg);
	matches[2] = matches[2].replace(/10/g, "1");
	var numbers = matches[2].split("");
	for (var i = 0; i < numbers.length; i++)
		if (numbers[i] == 1) numbers[i] = 10;
	return {letters: matches[1], numbers: numbers};
}

function concatPolyData (d1, d2) {
	return {xs: d1.xs.concat(d2.xs), ys: d1.ys.concat(d2.ys)}
}

function getRectArea(data, rot = 0, aspect=0) {
	var xMin = Number.POSITIVE_INFINITY;
	var xMax = Number.NEGATIVE_INFINITY;
	var yMin = Number.POSITIVE_INFINITY;
	var yMax = Number.NEGATIVE_INFINITY;
	var c = Math.cos(rot);
	var s = Math.sin(rot);
	for (var i = 0; i < data.xs.length; i++) {
		var x_ = data.xs[i]*c - data.ys[i]*s;
		var y_ = data.ys[i]*c + data.xs[i]*s;
		if (x_ < xMin) xMin = x_;
		if (y_ < yMin) yMin = y_;
		if (x_ > xMax) xMax = x_;
		if (y_ > yMax) yMax = y_;
	}
	
	var w = xMax - xMin;
	var h = yMax - yMin;
	if (aspect > 0) {
		if (w/h > aspect) return w*w/aspect;
		else return h*h*aspect;
	}
	return w*h;
}

function getMinAreaAngle(data, aspect=0) {
	var minA = getRectArea(data, 0, aspect);
	var angle = 0;
	for (var i = 0; i < 360; i++) {
		var a = Math.PI/180*i;
		var A = getRectArea(data, a, aspect);
		if (A < minA) {
			minA = A;
			angle = a;
		}
		
	}
	var a0 = angle;
	for (var i = 1; i < 120; i++) {
		var a = a0 - Math.PI/180*(1 - i/60.);
		var A = getRectArea(data, a, aspect);
		if (A < minA) {
			minA = A;
			angle = a;
		}
	}
	return angle;
}

