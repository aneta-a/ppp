var colors = ["red", "green", "blue" , "magenta", "orange", "#00ccff", "#ffaa00", "#cccccc", "#aaaaaa", "#999999", "#666666", "#333333", "black"]
var DefaultGetTau = "metallic";
var wireHolePreferences = ["s4", "s3", "h6", "s5", "h8", "h10", "s6", "s8", "s10"];


var qs;
var polyData;
var curPoly = "Cuboctahedron";
var curVF = "";
var relativeDiameter = 0;//Diameter of the polyhedron with unit edge, data from the table
var curTemplates = "";
var templatePageSizes = [];
var edge = 300;
var defaultDPI = 96;
var thickness = 0.5;//mm
var previews3d = [];
var previewColor = colors[1];
var showWire = false;
var wireSize = 6.0; //mm
var sideMenu, mainPage;

function pixelsToCm (arg, dpi = defaultDPI) {
	return arg/dpi*2.54;
}
function cmToPixels (arg, dpi = defaultDPI) {
	return arg/2.54*dpi;
}

function pageInit() {
	qs = parseQueryString();
	setGlobalVars(qs);
	
	//console.log("log colors " + qs.color + " " + previewColor);
	readTemplateStyle();
	
	if (qs.hasOwnProperty("showSideMenu") && qs.showSideMenu && qs.showSideMenu.toLowerCase() != "no" && qs.showSideMenu.toLowerCase() != "false")
		showSideMenu();
	
	sideMenu = document.getElementById("list");
	mainPage = document.getElementById("main");
	readCSVData("templates.csv");
	animate();
	
}

function setGlobalVars (qs) {
	if (qs.hasOwnProperty("size")) edge = qs.size;
	if (qs.hasOwnProperty("edge")) edge = qs.edge;
	var type = "s35";
	if (qs.hasOwnProperty("type")) type = qs.type;
	if (qs.hasOwnProperty("polyhedron")) curPoly = qs.polyhedron;
	if (qs.hasOwnProperty("thickness")) thickness = qs.thickness;
	if (qs.hasOwnProperty("color")) {
		if (/^(?:[0-9a-fA-F]{3}){1,2}$/.exec(qs.color))
			previewColor = "#" + qs.color;
		else previewColor = qs.color;
	}
	if (qs.hasOwnProperty("showWire")) showWire = getBool(qs.showWire);
	if (qs.hasOwnProperty("wireSize")) wireSize = parseFloat(qs.wireSize);

}

//-----------Layout-------------------------
function hideSideMenu() {
	document.getElementById('list').style.width = '0';
  	document.getElementById('main').style.marginLeft = '0';
  	document.getElementById('menuButton').style.display='inline-block';
  	document.getElementById('hideMenuButton').style.display='none';
}

function showSideMenu() {
	document.getElementById('list').style.width = '250px';
  	document.getElementById('main').style.marginLeft = '250px'; 
  	document.getElementById('menuButton').style.display='none'
  	document.getElementById('hideMenuButton').style.display='inline-block'
}

//-----------------------------------------------

//----------reading external data------------------------
function readTemplateStyle() {
	var styleToSave = document.getElementById("templateStyle");
	if (styleToSave) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function(){
		  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
			txt = xmlhttp.responseText;
			
			PlotSVG.CommonStyle = txt;
		  }
		};
		xmlhttp.open("GET",styleToSave.getAttribute("href"),true);
		xmlhttp.send();	
	}
}

function readCSVData (name) {

	var txt = '';
	console.log("Reading data...");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function(){
	  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
	    txt = xmlhttp.responseText;
	    console.log("Done");
		onCSVRead(txt);
	  }
	};
	xmlhttp.open("GET",name,true);
	xmlhttp.send();
}
//---------------------------------------------

function onCSVRead (text) {
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
			if (polyData[i][nameInd] && polyData[i][nameInd].toLowerCase() == curPoly.toLowerCase()) {
				curPolyInd = i;
				
			}
				
		}
	}
		createLinksList(polyData);
		var d = createDiv("description", mainPage);
		
	
	if (curPolyInd > 0) {	
		curPoly = polyData[curPolyInd][nameInd];
		curTemplates = polyData[curPolyInd][templInd];
		curVF = polyData[curPolyInd][vfInd];
		relativeDiameter = polyData[curPolyInd][dInd];
		curPoly = curPoly.charAt(0).toUpperCase() + curPoly.slice(1);
		fillDescription(d);
		//d.innerHTML += "<p>Templates: " + curTemplates + "</p>";
		
		
		var templatesNode = drawTemplates(curTemplates, curVF, curPoly);
	} else {
		var warnStr = "Invalid polyhedron name or vertex figure " + qs.polyhedron + " " + qs.vf;
		console.warn(warnStr);
		addP(d, warnStr);
		addP(d, "Pleas, choose one from the list");
		showSideMenu();
		
	}

	

}

function fillDescription(d) {
		addP(d, curPoly, "h1");
		addP(d,"Vertex figure: " + curVF + "");
		addP(d,"Edge length: " + pixelsToCm(edge).toFixed(2) + " cm");
		addP(d,"Approximate diameter: " + pixelsToCm(edge*relativeDiameter).toFixed(1) + " cm");

}

function updateMainDescription() {
	var d = document.getElementsByClassName("description")[0];
	while(d.firstChild) d.removeChild(d.firstChild);
	fillDescription(d);
}

//----------Controls--------------------------------------------------------------------
function createLinksList (polyData) {
	var list = createDiv("linksList", sideMenu);
	list.setAttribute("id", "polyhedraList");
	var newQS = copyObject(qs);
	if (newQS.hasOwnProperty("polyhedron")) delete newQS.polyhedron;
	if (!newQS.hasOwnProperty("showSideMenu")) newQS.showSideMenu = true;
	newQS.showList = true;
	var nameInd = polyData[0].indexOf("Name");
	var vfInd = polyData[0].indexOf("Vertex figure");
	addP(list, "Polyhedra", "h2");
	
	for (var i = 1; i < polyData.length; i++) {
		if (polyData[i][nameInd]) {
			var name = polyData[i][nameInd].charAt(0).toUpperCase() + polyData[i][nameInd].slice(1);
			newQS.vf = polyData[i][vfInd];
			var a = addP(addP(list, ""), name, "a");
			a.setAttribute("class", "polyhedronLink");
			a.setAttribute("href", location.href.split("?")[0] + "?" + createQueryString(newQS));
		}
	}
	//addHideButton(node, showLabel = "show", hideLabel = "hide", showByDefault = true, parent = null)
	addHideButton(list, "Polyhedra", "^", qs.hasOwnProperty("showList") ? getBool(qs.showList) : true);
	addOptionsBlock(sideMenu);
}

function updateLinks(qs) {
	var links = document.getElementsByClassName("polyhedronLink");
	for (var i = 0; i < links.length; i++) {
		var href = links[i].getAttribute("href");
		var vfArr = /&vf=((\d+\.)+\d+)(&|$)/.exec(href);
		
		var vf = vfArr ? vfArr[1] : "";
		var newQS = copyObject(qs);
		if (newQS.hasOwnProperty("polyhedron")) delete newQS.polyhedron;
		if (!newQS.hasOwnProperty("showSideMenu")) newQS.showSideMenu = true;
		newQS.showList = true;
		if (vf) 
			newQS.vf = vf;
		else delete newQS.vf;
		links[i].setAttribute("href", location.href.split("?")[0] + "?" + createQueryString(newQS));
	}
}

function addOptionsBlock (parent) {
	var d = createDiv("optionsBlock", parent);
	addP(d, "Options", "h2");
	addOption(d, "color", "Color&nbsp;", previewColor);
	addOption(d, "size", "Edge length in pixels", edge);
	addOption(d, "thickness", "Thickness of the material, mm", thickness);
	var showWireChb = document.createElement("input");
	showWireChb.setAttribute("type", "checkbox");
	if (showWire) showWireChb.setAttribute("checked", "checked");
	d.appendChild(showWireChb);
	addP(d, "Generate templates with a hole for wire", "span");
	var vs = addOption(d, "wireSize", "Diameter of the wire, mm", wireSize);
	showElement(document.getElementById("wireSize_option"), showWire);
	
	showWireChb.onchange = function () {
		
		onOptionChanged("showWire", showWireChb.checked);
		showElement(document.getElementById("wireSize_option"), showWireChb.checked);
	}
	
	
	addHideButton(d, "Options", "^", qs.hasOwnProperty("showOptions") ? getBool(qs.showOptions) : false);
	
}

function addOption (parent, name, description, defaultValue) {
	var validNumberRegEx = "-?((\d*\.\d+)|(\d+))((e|E)-?\d+)?";
	if (!defaultValue) defaultVaule = qs[name];
	var d = createDiv("optionBlock", parent);
	d.setAttribute("id", name+"_option");
	var p =addP(d, "");
	var pp = addP(p, description, "span");
	var input = addP(p,"", "input");
	if (name == "color") {
		input.setAttribute("type", "color");
		//TODO check browser support
	} else {
		input.setAttribute("type", "text");
		//TODO pattern doesn't work
		//input.setAttribute("pattern", validNumberRegEx);
	}
	input.setAttribute("value", defaultValue);
	input.setAttribute("id", name + "_ui");
	input.onchange = function () {
		onOptionChanged(name, input.value);
	}
	return input;
	
}

function onOptionChanged(name, value) {
	if (name == "color") {
		if (value.charAt(0) == "#") qs.color = value.slice(1)
		else qs.color = value;
		for (var i = 0; i < previews3d.length; i++) {
			updateMaterial(previews3d[i], {color: value});
		}
		updateFacesPreview({color: value});
		previewColor = value;
		console.log(qs.color);
		updateLinks(qs);
	} else if (name == "thickness" || name == "showWire" || name == "wireSize") {
		qs[name] = value; 
		setGlobalVars(qs);
		updateTemplatePages();
		updateLinks(qs);
	} else if (name == "size") {
		qs.size = value;
		delete qs.edge;
		setGlobalVars(qs);
		updateFacesPreview({color: previewColor});
		updateTemplatePages();
		updateDescriptions();
		updateLinks(qs);
	} else {
		console.log("option changed", name, qs, qs.color);
		var newQS = copyObject(qs);
		if (name == "color" && value.charAt(0) == "#") 
			newQS.color = value.slice(1);
		else 
			newQS[name] = value;
		newQS.showOptions = true; 
		newQS.showList = isVisible(document.getElementById("polyhedraList"));
		newQS.showSideMenu = true;
		location.assign(location.href.split("?")[0] + "?" + createQueryString(newQS));
	}
}
//-----------------------------------------------------------------------------------------


//--------------------------Data--------------------------------------------------------
function processVF (vfString) {
	var vfArray = vfString.split(".");
	var vfObjArray = [];
	var finalStrings = [];
	for (var i = 0; i < vfArray.length; i++) {
		vfObjArray.push({face: vfArray[i], nexts: [vfArray[(i-1 + vfArray.length)%vfArray.length], vfArray[(i+1)%vfArray.length]]});
		var finalString = vfObjArray[i].face + ":" + vfObjArray[i].nexts.sort().join("_");
		if (finalStrings.indexOf(finalString) < 0) 
			finalStrings.push(finalString);
	}
	return finalStrings;//.join(".");
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

function getSortedFacesTypes(templatesArray, vertexFigure) {
		var advansedFaces = processVF (vertexFigure);
		var facesObjs = [];
		for (var i = 0; i < advansedFaces.length; i++) {
			var a = advansedFaces[i].split(":")
			facesObjs.push({n: a[0], nexts: a[1].split("_")});
		}
		var faces = [];
		var tObjs = [];
		for (var j = 0; j < templatesArray.length; j++) {
			tObjs.push(parseType(templatesArray[j]));
		}
		function checkTType (type) {
			var res = [];
			for (var ii = 0; ii < tObjs.length; ii++) {
				if (tObjs[ii].letters == type) {
					res.push(tObjs[ii]);
				}
			}
			return res;
		}
		for (var i = 0; i < facesObjs.length; i++) {
			var f = facesObjs[i];
			var set = false;
			if (f.n > 5) {
				var hs = checkTType("hs");
				
				if (hs.length > 0) {
					for (var iii=0; iii<hs.length; iii++) {
						if (hs[iii].numbers[0] == f.n || (hs[iii].numbers.length == 4 && hs[iii].numbers[2] == f.n)) {
							faces.push("h" + f.n);
							set = true;
						}
						
					}
				}
			}
			if (!set) {
				var flats = checkTType("f");
				if (flats.length > 0) {
					for (var iii=0; iii < flats.length; iii++) {
						var fn = flats[iii].numbers;
						if (fn.length == 2) fn.push(fn[1]);
						if (fn[0] == f.n && ((fn[1] == f.nexts[0] && fn[2] == f.nexts[1]) || (fn[1] == f.nexts[1] && fn[2] == f.nexts[0]))){
							faces.push("f" + f.n);
							set = true;
						}
					}
				}
			}
			if (!set) {
				var snub = checkTType("sf");
				if (snub.length > 0) {
					if (f.n == 3 && f.nexts[0] == 3 && f.nexts[1] != 3) {
						faces.push("f3");
						set = true;
											
					}
				}
			}
			if (!set) {
				faces.push("s" + f.n);
			}
		}
		return faces;
}

function getSpiralTemplateData(type, size = 100, options = {}){
	var tObj = parseType(type);
	var cutData = {xs:[], ys:[]};
	var etchData = {xs:[], ys:[]};
	var circlesData = {xs: [], ys: []};
	var circlesRadii = [];
	var circlesDelta = cmToPixels(thickness/20);
	
	var pinRadius = cmToPixels(0.3/10);
	var wireRadius = cmToPixels(3/10);
	if (options.hasOwnProperty("wireRadius")) wireRadius = options.wireRadius;
	
	
	function addCircle(data, N, wire=false) {
		circlesData.xs.push(data.xs[N]);
		circlesData.ys.push(data.ys[N]);
		if (wire) {
			circlesRadii.push(wireRadius);
			addPinCircles(data, N);
		} else {
			circlesRadii.push(circlesDelta*(N-1));
		}
	}
	
	function addPinCircles(data, N) {
		var tau = getTau(N);
		var t = getTransform ({x: 0, y:0 }, {x:1, y:0}, {x: data.xs[N], y: data.ys[N]}, {x: data.xs[0], y: data.ys[0]});
		var p0 = getPinPoint(N, tau)
		var p = transformPoint(p0, t.a, t.z0);
		circlesData.xs.push(p.x);
		circlesData.ys.push(p.y);
		circlesRadii.push(pinRadius);
		t = getTransform ({x: 0, y:0 }, {x:1, y:0}, {x: data.xs[N], y: data.ys[N]}, {x: data.xs[N+1], y: data.ys[N+1]});
		p = transformPoint(p0, t.a, t.z0);
		circlesData.xs.push(p.x);
		circlesData.ys.push(p.y);
		circlesRadii.push(pinRadius);
		
	}
	function getPinPoint(N, tau) {
		var s = Math.sin(2*Math.PI/N);
		var c = Math.cos(2*Math.PI/N);
		var t_2 = tau*s/(1-tau*c);
		//var t_2 = tanPhi;//(Math.sqrt(tanPhi*tanPhi + 1) - 1)/tanPhi;
		var c_2 = 1/Math.sqrt(t_2*t_2 + 1);
		var s_2 = t_2*c_2;
		return {x: 0.5*(1+tau - (1-tau)*c_2), y: 0.5*(1-tau)*s_2}
	}
	var wirePart = -1;
	var addWire = options.hasOwnProperty("wire");
	
	switch (tObj.letters) {
		case "s":
			if (tObj.numbers.length == 1)
				tObj.numbers.push(tObj.numbers[0]);
		
			var p1 = {x: 0, y: 0};
			var p2 = {x: size, y: 0};
			cutData = getTemplateData(p1, p2, tObj.numbers[0]);
			var cutDataInv = getTemplateData(p2, p1, tObj.numbers[1]);
			if (addWire && options.wire == tObj.numbers[0]) {
				wirePart = 0;
			}
			if (addWire && options.wire == tObj.numbers[1] && wirePart == -1) {
				wirePart = 1;
			}
			
			addCircle(cutData, tObj.numbers[0], wirePart == 0);
			addCircle(cutDataInv, tObj.numbers[1], wirePart == 1);
			cutData = concatPolyData(cutData, cutDataInv);
			etchData = {xs: [p1.x, p2.x], ys: [p1.y, p2.y]};
			break;
		case "f":
			var N = tObj.numbers[0];
			if (tObj.numbers.length == 2) tObj.numbers.push(tObj.numbers[1]);
			if (addWire && options.wire == tObj.numbers[1]) {
				wirePart = 0;
			}
			if (addWire && options.wire == tObj.numbers[2] && wirePart == -1) {
				wirePart = 1;
			}
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
				
				addCircle(curCutData, tObj.numbers[1+i%2], wirePart == i);
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
					if (addWire) {
						if (options.wire == tObj.numbers[0]) {
							wirePart = 0;
						} else if (options.wire == tObj.numbers[1]) {
							wirePart = 3;
						} else if (options.wire == tObj.numbers[2]) {
							wirePart = 2;
						} else if (options.wire == tObj.numbers[3]) {
							wirePart = 1;
						}
					}
					inds = [[1, 3, tObj.numbers[0]/2],[0, 1, tObj.numbers[3]], [2,0, tObj.numbers[2]/2],[3,2, tObj.numbers[1]],]; 
					break;
				case 3:
					etchData.xs[0] = 0; 
					etchData.ys[0] = 0; 
					etchData.xs[1] = size; 
					etchData.ys[1] = 0; 
					etchData.xs[2] = size*(1+Math.cos(2*Math.PI/tObj.numbers[0])); 
					etchData.ys[2] = size*Math.sin(2*Math.PI/tObj.numbers[0]);
					if (addWire) {
						if (options.wire == tObj.numbers[0]) {
							wirePart = 0;
						} else if (options.wire == tObj.numbers[1]) {
							wirePart = 2;
						} else if (options.wire == tObj.numbers[2]) {
							wirePart = 1;
						} 
					}

					inds = [[0, 2, tObj.numbers[0]/2],[1,0, tObj.numbers[2]],[2,1, tObj.numbers[1]]]; 
			}
			for (var i = 0; i < inds.length; i++) {
				curCutData = getTemplateData({x: etchData.xs[inds[i][0]], y: etchData.ys[inds[i][0]]},
											 {x: etchData.xs[inds[i][1]], y: etchData.ys[inds[i][1]]}, 
											 inds[i][2]);
				addCircle(curCutData, inds[i][2], wirePart == i);

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
			if (addWire) {
				if (options.wire == 3) wirePart = 0
				else if (options.wire == tObj.numbers[0]) wirePart = 1;
			}
			for (var i = 1; i < 5; i++) {
				var curN = i%2 ? 3 : tObj.numbers[0];
				var curCutData = getTemplateData({x: etchData.xs[i+1], y: etchData.ys[i+1]}, 
													{x: etchData.xs[i], y: etchData.ys[i]}, 
													curN);
				
				addCircle(curCutData, curN, wirePart == i);
				cutData = concatPolyData(cutData, curCutData);
			}
	}
	
	if (!(addWire && wirePart == -1))
		return {cutData: cutData, etchData: etchData, circlesData: circlesData, circlesRadii: circlesRadii}
	
	

}

function parseType (arg) {
	arg = arg.toLowerCase();
	var matches = /([a-z]+)(\d*)/g.exec(arg);
	matches[2] = matches[2].replace(/10/g, "1");
	var numbers = matches[2].split("");
	for (var i = 0; i < numbers.length; i++){
		if (numbers[i] == 1) numbers[i] = 10;
		numbers[i] = parseInt(numbers[i]);
	}
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


//--------------------------------------------------------------------------------------

//--------------------------Display------------------------------------------------------
function drawTemplates(templates, vf, polyName) {
	
	var templSets = templates.split(" ");
	var d0 = createDiv("typeBlocksContainer", mainPage);
	for (var i = 0; i < templSets.length; i++) {
		var d = createDiv("typeBlock", d0);
		if (templSets.length > 1) {
			addP(d, "Type " + (i+1), "h2");
		}
		var singleTemplates = templSets[i].split("+");
		//function drawFacesPreview(parent, color, templatesArray) {
		//addP(d, "3D preview", "h3");

		var dd = createDiv("preview3dBlock", d);
		
		var ctx3d = create3DPreview(dd, previewColor, singleTemplates, vf, polyName);
			
		dd = createDiv("templatesPreviewBlockContainer", d);
		addP(dd, "Templates","h3");
		ddd = createDiv("templatesPreviewBlock", dd);
		ddd.templates = singleTemplates.slice(0);
		ddd.typeNum = i+1;
		ddd.multiTypes = (templSets.length > 1);
		// = [];
		// generateTemplates(parent, options = {}, resObj = [])
		var psvgData = generateTemplates(ddd)
		createTemplatesInfo(d, psvgData, i+1);
		if (showWire) {
			
			var fTypes = getSortedFacesTypes(singleTemplates, vf);
			
			var minIndex = 100;
			var prefType = "";
			for (var it = 0; it < fTypes.length; it ++) {
				var indInPrefs = wireHolePreferences.indexOf(fTypes[it]);
				if (indInPrefs>=0 && indInPrefs < minIndex) {
					minIndex = indInPrefs;
					prefType = fTypes[it];
				}
			}
			var wireFaceType = prefType ? parseInt(prefType.slice(1)) : vf.split(".")[0];
			ddd.wireFaceType = wireFaceType; 
			psvgData = generateTemplates(ddd, {showWire: true}, psvgData);
		}
		
		addHideButton(dd, "Show templates", "Hide templates", false);
		dd = createDiv("facesPreviewBlockContainer", d);
		addP(dd, "Faces preview", "h3");
		var ddd = createDiv("facesPreviewBlock", dd);
		ddd.templates = singleTemplates.slice(0);
		drawFacesPreview(ddd, previewColor, singleTemplates);
		addHideButton(dd, "Show faces preview", "Hide faces preview", false);
		
		
			
	}
	return d0;
}

function generateTemplates(parent, options = {}, resObj = []) {
	var ddd = parent;
	var singleTemplates = ddd.templates;
	if (options.showWire) {
		for (var j = 0; j < singleTemplates.length; j++) {
		
			var wireTemplateData = getSpiralTemplateData( singleTemplates[j], edge, {wire:  ddd.wireFaceType, wireRadius: cmToPixels(wireSize/20)});
			if (wireTemplateData) {
				var s = createDiv("templatePage", ddd); 
				var psvg = new PlotSVG ({
					id: singleTemplates[j] + "_" + ddd.typeNum+ "_" + edge + "_wire", 
					saveButton: true, 
					saveButtonName: "Save" +  (singleTemplates.length > 1 ? " page " + (j+1) + " (wire)": " wire face template"), 
					saveFileName: "ppp_" + curPoly.split(" ").join("_") +
					 (ddd.multiTypes ? "_type" + ddd.typeNum : "") + 
					 (singleTemplates.length > 1 ? "_page" + (j+1) + "of" + singleTemplates.length : "") + 
					 "_edge" + edge + "px_dpi" + defaultDPI + "_wire"}, s);
				resObj.push(drawSpiralTemplateImpl(psvg, wireTemplateData));
			}
		
		
		}
	} else {
		templatePageSizes[ddd.typeNum] = [];
		for (var j = 0; j < singleTemplates.length; j++) {
			var s = createDiv("templatePage", ddd);
			var psvg = new PlotSVG ({
				id: singleTemplates[j] + "_" + ddd.typeNum + "_" + edge, 
				saveButton: true, 
				saveButtonName: "Save" +  (singleTemplates.length > 1 ? " page " + (j+1) : ""), 
				saveFileName: "ppp_" + curPoly.split(" ").join("_") +
				 (ddd.multiTypes ? "_type" + ddd.typeNum : "") + 
				 (singleTemplates.length > 1 ? "_page" + (j+1) + "of" + singleTemplates.length : "") + 
				 "_edge" + edge + "px_dpi" + defaultDPI}, s);
			resObj.push(drawSpiralTemplate(psvg, singleTemplates[j], edge));
			templatePageSizes[ddd.typeNum].push({w: psvg.svg.getAttribute("width"), h: psvg.svg.getAttribute("height")});
			
			
		}
	}
	return resObj;

}
function updateTemplatePages() {
	var blocks = document.getElementsByClassName("templatesPreviewBlock");
	for (var i = 0; i < blocks.length; i++) {
		while (blocks[i].firstChild) blocks[i].removeChild(blocks[i].firstChild);
		generateTemplates(blocks[i]);
		if (showWire)
			generateTemplates(blocks[i], {showWire: true});
	}
}

function createTemplatesInfo(parent, templatesData, ind) {
	var numberOfTemplatePages = templatesData.length;
	/*var sizes = [];
	for (var i = 0; i < templatesData.length; i++) {
		
		sizes.push({w: pixelsToCm(templatesData[i].svg.getAttribute("width")), 
					h: pixelsToCm(templatesData[i].svg.getAttribute("height"))});
	}*/
	var sizes = templatePageSizes[ind].slice(0);
	var d = createDiv("templatesInfo", parent);
	d.pagesNum = numberOfTemplatePages;
	d.typeNum = ind;
	fillTemplateInfo(d);
	var fitButton = document.createElement("button");
		fitButton.innerHTML = "Fit in A4";
		fitButton.sizesData = sizes.slice();
		fitButton.setAttribute("id", "fitButton" + ind);
		fitButton.onclick = function () {
			var A4 = {w: 29.7, h: 21};
			var maxFactor = 0;
			for (var ii = 0; ii < fitButton.sizesData.length; ii++) {
				
				var factor = Math.max(pixelsToCm(Number(templatePageSizes[ind][ii].w))/A4.w, pixelsToCm(Number(templatePageSizes[ind][ii].h))/A4.h);
				if (factor > maxFactor) maxFactor = factor;
			}
			
			var newSize = Math.floor(edge/maxFactor);
			//console.log(edge, maxFactor, newSize, fitButton.getAttribute("id"));
			document.getElementById("size_ui").value= newSize;
			onOptionChanged("size", newSize);
			
		}
		
		parent.appendChild(fitButton);
}

function fillTemplateInfo(d) {
	var sizes = templatePageSizes[d.typeNum].slice(0);

	addP(d, "Templates pages:&nbsp;" + d.pagesNum +" ", "span");
	for (var i = 0; i < sizes.length; i++) {
		addP(d, "&nbsp;" + pixelsToCm(Number(sizes[i].w)).toFixed(1) + "&nbsp;x&nbsp;" + pixelsToCm(Number(sizes[i].h)).toFixed(1) + "&nbsp;cm ", "span");
	}
}

function updateDescriptions(){
	updateMainDescription();
	var blocks = document.getElementsByClassName("templatesInfo");
	for (var i = 0; i < blocks.length; i++) {
		clearNode(blocks[i]);
		fillTemplateInfo(blocks[i]);
	}
	
};


function create3DPreview(parent, color, templatesArray, vf, polyName){
	var lp = null;
	if (PlatonicSolids.hasOwnProperty(polyName.toLowerCase())) 
		lp = PlatonicSolids[polyName.toLowerCase()].clone();
	else if (ArchimedeanSolids.hasOwnProperty(polyName.toLowerCase().split(" ").join("_"))) 
		lp = ArchimedeanSolids[polyName.toLowerCase().split(" ").join("_")];

	if (lp) {
		var cs3d = document.createElement("canvas");
		cs3d.setAttribute("class", "preview3d");
		var ctx3d = createThreeContext(cs3d);
		//return {renderer: renderer, scene: scene, camera: camera, controls: controls};
		parent.appendChild(ctx3d.renderer.domElement);
		
		ctx3d.templates = templatesArray.slice(0);
		ctx3d.vf = vf;

		var textureCanvas = getTextureCanvas(null, color, templatesArray, vf).canvas;
		var texture = new THREE.CanvasTexture(textureCanvas);
		var mat = new  THREE.MeshLambertMaterial({map: texture, transparent: true});
		
		var vfArr = processVF(vf);
		var aspect = textureCanvas.width/textureCanvas.height;
		if (vf == "3.4.4.4") {
			lp.setGetUVFunction (function (faceInd, verInd){
				var n = this.faces[faceInd].length;
				var sh = n == 3 ? 0 : (faceInd < 14 ? 2 : 1);
				return new THREE.Vector2((0.5*(1+Math.cos(verInd*Math.PI*2/n))+sh)/aspect, 0.5*(1+Math.sin(verInd*Math.PI*2/n)));
			});
		} else if (vf == "3.3.3.3.4") {
			lp.setGetUVFunction (function (faceInd, verInd){
				var n = this.faces[faceInd].length;
				var sh = n == 4 ? 2 : (faceInd < 14 ? 1 : 0);
				return new THREE.Vector2((0.5*(1+Math.cos(verInd*Math.PI*2/n))+sh)/aspect, 0.5*(1+Math.sin(verInd*Math.PI*2/n)));
			});
		}else if (vf == "3.3.3.3.5") {
			lp.setGetUVFunction (function (faceInd, verInd){
				var n = this.faces[faceInd].length;
				var sh = n == 5 ? 2 : (faceInd < 32 ? 1 : 0);
				return new THREE.Vector2((0.5*(1+Math.cos(verInd*Math.PI*2/n))+sh)/aspect, 0.5*(1+Math.sin(verInd*Math.PI*2/n)));
			});
		} else {
			lp.setGetUVFunction (function (faceInd, verInd){
				var n = this.faces[faceInd].length;
				var sh = 0;
				for (var i = 0; i < vfArr.length; i++) {
					if (Number(vfArr[i].split(":")[0]) == n) sh = i;
				}
				return new THREE.Vector2((0.5*(1+Math.cos(verInd*Math.PI*2/n))+sh)/aspect, 0.5*(1+Math.sin(verInd*Math.PI*2/n)));
			});
		}
		var geom = lp.getGeometry();
		var poly3D = new THREE.Mesh(geom, mat);
		ctx3d.scene.add(poly3D);
		ctx3d.poly3D = poly3D;
		updateThreeContext (ctx3d);
		previews3d.push(ctx3d);
	
	}
}

function updateMaterial (ctx3d, options) {
	if (options.hasOwnProperty("color")) {
		var textureCanvas = getTextureCanvas(null, options.color, ctx3d.templates, ctx3d.vf).canvas;
		var texture = new THREE.CanvasTexture(textureCanvas);
		ctx3d.poly3D.material.map = texture;
		ctx3d.poly3D.material.needsUpdate = true;
		updateThreeContext(ctx3d);
		//var mat = new  THREE.MeshLambertMaterial({map: texture, transparent: true});
	}
}

function updateFacesPreview(options) {
	//drawFacesPreview(parent, color, templatesArray)
	
	/* 
			var ddd = createDiv("facesPreviewBlock", dd);
		ddd.templates = singleTemplates.slice(0);
		drawFacesPreview(ddd, previewColor, singleTemplates);

	*/
	if (options.hasOwnProperty("color")) {
		var blocks = document.getElementsByClassName("facesPreviewBlock");
		for (var i = 0; i < blocks.length; i++) {
			while (blocks[i].firstChild) blocks[i].removeChild(blocks[i].firstChild);
			drawFacesPreview(blocks[i], options.color, blocks[i].templates);
		}
	}
}


function drawFacesPreview(parent, color, templatesArray) {
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
		cs.canvas.setAttribute("class", "facePreview");
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

function getTextureCanvas(parent, color, templatesArray, vertexFigure ) {
	var types = getSortedFacesTypes(templatesArray, vertexFigure);
	var typesHomo = types;
	if (typesHomo.length > 0) {
		var cHeight = 512;
		var aspect = (typesHomo.length == 1 ? 1: (typesHomo.length == 2 ? 2 : 4));
		var cWidth = aspect*cHeight;
		var resCs = new PlotCanvas({width: cWidth, height: cHeight}, parent);
		for (var i = 0; i < typesHomo.length; i++) {
			resCs.setScale({minX: -1-2*i, maxX: 2*(aspect-i)-1});
			var n = Number(typesHomo[i].slice(1));
			switch (typesHomo[i].charAt(0)) {
				case "s":
					drawFacePolygon(resCs, n, getTau(n),  color, 1);
					break;
				case "f":
					drawEmptyFace(resCs, n, color, 1);
					break;
				case "h":
					drawFacePolygonHalf(resCs, n, getTau(n/2),  color, 1);
					break;
			}
			
		}
		return resCs;
	} else {
		console.warn("Invalid face types set", templatesArray, types);
		return null;
	}

}


function drawSpiralTemplate(psvg, type, size = 100, options = {}) {
	var data = getSpiralTemplateData(type, size, options);
	return drawSpiralTemplateImpl(psvg, data );
}
function drawSpiralTemplateImpl(psvg, data ) {
	if (data) {
			var angle = getMinAreaAngle(data.cutData, Math.sqrt(2));
			data.cutData = rotateData(angle, data.cutData);
			data.etchData = rotateData(angle, data.etchData);
			data.circlesData = rotateData(angle,data.circlesData);
			
			var shft = psvg.setSizeByArrays(data.cutData.xs, data.cutData.ys);
			//function shiftData(dx, dy, data, res) //utils.js
			data.cutData = shiftData(-shft.xMin, -shft.yMin, data.cutData);
			data.etchData = shiftData(-shft.xMin, -shft.yMin, data.etchData);
			data.circlesData = shiftData(-shft.xMin, -shft.yMin, data.circlesData);
			
			//this.drawPolygon = function (xs, ys, options) { //plotsvg.js
			var cutStyle = {class: "cut"};//"stroke:rgb(0,0,0);stroke-width:1.5;fill:none"};
			var etchStyle = {class: "etch"};// "stroke:rgb(0,0,0);stroke-width:.5;fill:none"};
			psvg.drawPolygon(data.cutData.xs, data.cutData.ys, cutStyle);
			psvg.drawPolygon(data.etchData.xs, data.etchData.ys, etchStyle);
			//console.log("circles", circlesData);
			for (var i = 0; i < data.circlesData.xs.length; i++) {
				psvg.drawCircle(data.circlesData.xs[i], data.circlesData.ys[i], data.circlesRadii[i], cutStyle);
			}
		
	}
	return psvg;
}
//-----------------------------------------------------------------------------------------------------

function animate()
{
    requestAnimationFrame ( animate ); 
    for (var i = 0; i < previews3d.length; i++)
    	updateThreeContext(previews3d[i]);
}


