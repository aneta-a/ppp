var colors = ["red", "green", "blue" , "magenta", "orange", "#00ccff", "#ffaa00", "#cccccc", "#aaaaaa", "#999999", "#666666", "#333333", "black"]
var DefaultGetTau = "metallic";
var wireHolePreferences = ["s4", "s3", "h6", "s5", "h8", "h10", "s6", "s8", "s10"];


var qs;
var polyData;
var curPoly = "Cuboctahedron";
var curPolyObject = {};
var curVF = "";
//var relativeDiameter = 0;//Diameter of the polyhedron with unit edge, data from the table
//var curTemplates = "";
var templatePageSizes = [];
var edge = 300;
var defaultDPI = 96;
var thickness = 0.5;//mm
var previews3d = [];
var previewColor = colors[1];
var showWire = false;
var wireSize = 6.0; //mm
var nightView = true;
var sideMenu, mainPage;

var dayBackground = "#00000000";
var nightBackgorund = "#000000";

function pixelsToCm (arg, dpi = defaultDPI) {
	return arg/dpi*2.54;
}
function cmToPixels (arg, dpi = defaultDPI) {
	return arg/2.54*dpi;
}

function pageInit() {

	qs = parseQueryString();
	setGlobalVars(qs);
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
	if (qs.hasOwnProperty("nightView")) nightView = getBool(qs.nightView);
	if (qs.hasOwnProperty("wireSize")) wireSize = parseFloat(qs.wireSize);

}

//-----------Layout-------------------------
function hideSideMenu() {
	document.getElementById('list').style.width = '0';
  	document.getElementById('main').style.marginLeft = '0';
  	document.getElementById('menuButton').style.display='inline-block';
  	document.getElementById('hideMenuButton').style.display='none';
  	//TODO hide list and options (or get rid of a scroller some other way)
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

	//TODO don't read table, make list of names and vfs an object (also for localization)

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
	
	var d = createDiv("description", mainPage);
	var prism = false;
	if (qs.hasOwnProperty("vf")) {
		var prismMatches = /^(4\.){2}([5-9]|(\d{2}))$/.exec(qs.vf);
		var antiprismMatches = /^(3\.){3}([4-9]|(\d{2}))$/.exec(qs.vf);
		if (prismMatches || antiprismMatches) {
			prism = true;
			curPoly = prismMatches ? "Uniform prism" : "Uniform antiprism";
			curVF = qs.vf;
			curPolyObject = getPolyObjectByVF(curVF);
			fillDescription(d);
			var templatesNode = drawTemplates(curPolyObject.templates, curVF, curPoly);
			
		} else {
			for (var i = 1; i < polyData.length; i++) {
				if (polyData[i][vfInd] == qs.vf) {
					curPolyInd = i;
				}
					
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
	
	
	if (curPolyInd > 0) {	
		curPoly = polyData[curPolyInd][nameInd];
		curVF = polyData[curPolyInd][vfInd];
		curPoly = capitalize(curPoly);
		curPolyObject = getPolyObjectByVF(curVF);
		fillDescription(d);
		var templatesNode = drawTemplates(curPolyObject.templates, curVF, curPoly);
	} else if (!prism) {
		var warnStr = "Invalid polyhedron name or vertex figure " + qs.polyhedron + " " + qs.vf;
		console.warn(warnStr);
		addP(d, warnStr);
		addP(d, "Pleas, choose one from the list");
		showSideMenu();
		
	}
}

function checkTemplates(data, vfInd, templInd) {
	for (var i = 1; i < data.length; i++) {
		if (data[i][vfInd]) {
			var vf = data[i][vfInd];
			var templatesString = data[i][templInd];
			
			var templatesObj = getPolyObjectByVF(vf).templates;
			if (templatesString.split(" ").length != templatesObj.length) 
				console.warn(vf, "Different length: ", templatesString.split(" ").length, templatesObj.length);
			console.log(getTemplatesStringFromObj(templatesObj), "|", templatesString);
			
		}
	}
}

function getTemplatesStringFromObj(obj) {
	var resArr = [];
	for (var i = 0; i < obj.length; i++) {
		var singleArr = [];
		for (var j = 0; j < obj[i].length; j++) {
			singleArr.push(obj[i][j].type);
		}
		resArr.push(singleArr.join("+"));
	}
	return resArr.join(" ");
}

function fillDescription(d) {
		addP(d, curPoly, "h1");
		addP(d,"Vertex figure: " + curVF + "");
		addP(d,"Edge length: " + pixelsToCm(edge).toFixed(2) + " cm");
		addP(d,"Approximate diameter: " + pixelsToCm(edge*curPolyObject.diameter).toFixed(1) + " cm");

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
	
	function createLink (name, vf) {
			newQS.vf = vf;
			var a = addP(addP(list, ""), name, "a");
			a.setAttribute("class", "polyhedronLink");
			a.setAttribute("href", location.href.split("?")[0] + "?" + createQueryString(newQS));
			return a;	
	}
	
	for (var i = 1; i < polyData.length; i++) {
		if (polyData[i][nameInd]) {
			var name = polyData[i][nameInd].charAt(0).toUpperCase() + polyData[i][nameInd].slice(1);
			createLink(name, polyData[i][vfInd]);
		}
	}
	createLink("Uniform prism", "4.4.7");
	createLink("Uniform antiprism", "3.3.3.8");
	
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
	if (curPoly.toLowerCase().split(" ")[0] == "uniform") {
		addOption(d, "baseVertices", "Number of vertices in base", curVF.split(".").slice(-1)[0]);
	}
	var showWireChb = addCheckbox(d, "showWire", "Generate templates with a hole for wire", showWire); 
	var vs = addOption(d, "wireSize", "Diameter of the wire, mm", wireSize);
	showElement(document.getElementById("wireSize_option"), showWire);
	showWireChb.addEventListener("change", function (e) {showElement(document.getElementById("wireSize_option"), e.target.checked);});
	addCheckbox(d, "nightView", "Night view", nightView);
	/*= document.createElement("input");
	showWireChb.setAttribute("type", "checkbox");
	if (showWire) showWireChb.setAttribute("checked", "checked");
	d.appendChild(showWireChb);
	addP(d, "Generate templates with a hole for wire", "span");
	
	showWireChb.onchange = function () {
		
		onOptionChanged("showWire", showWireChb.checked);
		
	}
	
	var nightViewChb = document.createElement("input");
	nightViewChb.setAttribute("type", "checkbox");
	if (nightView) nightViewChb.setAttribute("checked", "checked");
	d.appendChild(nightViewChb);
	addP(d, "Night view", "span");
	nightViewChb.onchange = function () {
		
		onOptionChanged("nightView", nightViewChb.checked);
		showElement(document.getElementById("wireSize_option"), showWireChb.checked);
	}

	*/
	addHideButton(d, "Options", "^", qs.hasOwnProperty("showOptions") ? getBool(qs.showOptions) : false);
	
}
function addCheckbox (parent, name, description, defaultValue) {
	var dd = createDiv("checkboxGroup", parent);
	var chb = document.createElement("input");
	chb.setAttribute("type", "checkbox");
	if (defaultValue) chb.setAttribute("checked", "checked");
	dd.appendChild(chb);
	addP(dd, description, "span");
	chb.addEventListener("change", function (e) {
		
		onOptionChanged(name, e.target.checked);
	});
	return chb;

}

function addOption (parent, name, description, defaultValue) {
	var validNumberRegEx = "-?((\\d*\\.\\d+)|(\\d+))((e|E)-?\\d+)?";
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
		
		input.setAttribute("pattern", validNumberRegEx);
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
		updateLinks(qs);
	} else if (name == "thickness" || name == "showWire" || name == "wireSize") {
		qs[name] = value; 
		setGlobalVars(qs);
		updateTemplatePages();
		updateLinks(qs);
	} else if (name == "nightView") {
		qs.nightView = value;
		nightView = value;
		for (var i = 0; i < previews3d.length; i++) {
			updateMaterial(previews3d[i], {nightView: value});
		}
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
		var newQS = copyObject(qs);
		if (name == "color" && value.charAt(0) == "#") 
			newQS.color = value.slice(1);
		else if (name == "baseVertices") {
			var newvfArr = newQS.vf.split(".");
			newvfArr.splice(-1, 1, value);
			newQS.vf = newvfArr.join(".");
		}
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
		var c_2 = 1/Math.sqrt(t_2*t_2 + 1);
		var s_2 = t_2*c_2;
		return {x: 0.5*(1+tau - (1-tau)*c_2), y: 0.5*(1-tau)*s_2}
	}
	var wirePart = -1;
	var addWire = options.hasOwnProperty("wire");
	//if (addWire) console.log(options, type);
	
	switch (tObj.letters) {
		case "s":
			if (tObj.numbers.length == 1)
				tObj.numbers.push(tObj.numbers[0]);
		
			var p1 = {x: 0, y: 0};
			var p2 = {x: size, y: 0};
			cutData = getTemplateData(p1, p2, tObj.numbers[0]);
			var cutDataInv = getTemplateData(p2, p1, tObj.numbers[1]);
			if (addWire && options.wire == tObj.numbers[0] && options.next == tObj.numbers[1]) {
				wirePart = 0;
			}
			if (addWire && options.wire == tObj.numbers[1] && options.next == tObj.numbers[0] && wirePart == -1) {
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
			if (addWire && options.wire == tObj.numbers[1] && options.next == tObj.numbers[0]) {
				wirePart = 0;
			}
			if (addWire && options.wire == tObj.numbers[2] && options.next == tObj.numbers[0] && wirePart == -1) {
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
						if (options.wire == tObj.numbers[0] && options.next == tObj.numbers[1] ) {
							wirePart = 0;
						} else if (options.wire == tObj.numbers[1] && options.next == tObj.numbers[0]) {
							wirePart = 3;
						} else if (options.wire == tObj.numbers[2] && options.next == tObj.numbers[3]) {
							wirePart = 2;
						} else if (options.wire == tObj.numbers[3] && options.next == tObj.numbers[2]) {
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
						if (options.wire == tObj.numbers[0] && options.next == tObj.numbers[1]) {
							wirePart = 0;
						} else if (options.wire == tObj.numbers[1] && options.next == tObj.numbers[0]) {
							wirePart = 2;
						} else if (options.wire == tObj.numbers[2] && options.next == tObj.numbers[0]) {
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
				if (options.wire == 3) wirePart = 1
				else if (options.wire == tObj.numbers[0]) wirePart = 2;
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
	//matches[2] = matches[2].replace(/10/g, "1");
	var numbers = matches[2].split("");
	var j = 0;
	while (j < numbers.length-1) {
		if (numbers[j] == "1" || numbers[j] == "2") {
			var num = numbers[j] + numbers[j+1];
			numbers.splice(j, 2, num);
		} else j++;
	}
	for (var i = 0; i < numbers.length; i++){
		//if (numbers[i] == 1) numbers[i] = 10;
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
function drawTemplates(templSets, vf, polyName) {
	
	var d0 = createDiv("typeBlocksContainer", mainPage);
	for (var i = 0; i < templSets.length; i++) {
		var d = createDiv("typeBlock", d0);
		if (templSets.length > 1) {
			addP(d, "Type " + (i+1), "h2");
		}
		var singleTemplates = [];//templSets[i].split("+");
		var templatesCounts = [];
		for (var j = 0; j < templSets[i].length; j++) {
			singleTemplates.push(templSets[i][j].type);
			templatesCounts.push(templSets[i][j].count);
		}
		
		//function drawFacesPreview(parent, color, templatesArray) {
		//addP(d, "3D preview", "h3");

		var dd = createDiv("preview3dBlock", d);
		
		var ctx3d = create3DPreview(dd, previewColor, singleTemplates, vf, polyName);
			
		dd = createDiv("templatesPreviewBlockContainer", d);
		addP(dd, "Templates","h3");
		ddd = createDiv("templatesPreviewBlock", dd);
		ddd.templates = singleTemplates.slice(0);
		ddd.templatesCounts = templatesCounts.slice(0);
		ddd.typeNum = i+1;
		ddd.multiTypes = (templSets.length > 1);
		// = [];
		// generateTemplates(parent, options = {}, resObj = [])
		var psvgData = generateTemplates(ddd)
		createTemplatesInfo(d, psvgData, i+1);
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
		var vfArr = vf.split(".");
		var wireFaceType = prefType ? parseInt(prefType.slice(1)) : vfArr[0];
		var ftInd = vfArr.indexOf(wireFaceType.toString());
		ddd.nexts = [Number(vfArr[(ftInd + 1)%vfArr.length]), Number(vfArr[(ftInd + vfArr.length - 1)%vfArr.length])];
	
		ddd.wireFaceType = wireFaceType; 
		if (showWire) {
			
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
	if (options.showWire) { //TODO wire faces count
		var l = ddd.nexts[0] == ddd.nexts[1] ? 1 : 2;
		for (var ii = 0; ii < l; ii++)
			for (var j = 0; j < singleTemplates.length; j++) {
			
				var wireTemplateData = getSpiralTemplateData( singleTemplates[j], 
															edge, 
															{wire:  ddd.wireFaceType, next: ddd.nexts[ii], wireRadius: cmToPixels(wireSize/20)});
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
				saveButtonName: "Save" +  (singleTemplates.length > 1 ? " page " + (j+1) : "") + " (x" + ddd.templatesCounts[j] + ")", 
				saveFileName: "ppp_" + curPoly.split(" ").join("_") +
				 (ddd.multiTypes ? "_type" + ddd.typeNum : "") + 
				 (singleTemplates.length > 1 ? "_page" + (j+1) + "of" + singleTemplates.length : "") + 
				 "_edge" + edge + "px_dpi" + defaultDPI + "_x" + ddd.templatesCounts[j]}, s); 
			resObj.push(drawSpiralTemplate(psvg, singleTemplates[j], edge));
			templatePageSizes[ddd.typeNum].push({w: psvg.svg.getAttribute("width"), h: psvg.svg.getAttribute("height"), count: ddd.templatesCounts[j]}); 
			
			
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

	addP(d, "Templates pages:&nbsp;" + d.pagesNum);// +"<br/> ", "span");
	for (var i = 0; i < sizes.length; i++) {
		addP(d, pixelsToCm(Number(sizes[i].w)).toFixed(1) + "&nbsp;x&nbsp;" + pixelsToCm(Number(sizes[i].h)).toFixed(1) + "&nbsp;cm&nbsp;(x" + sizes[i].count + ") ", "span"); 
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

function getPolyObjectByVF(vf) {
	var vfSimpleArr = vf.split(".");
	var vfArr = processVF(vf);
	var vfObjs = [];
	for (var i = 0; i < vfArr.length; i++) {
		var nexts = vfArr[i].split(":")[1].split("_").sort(function(a,b) {return a-b});;
		nexts[0]=parseInt(nexts[0]);
		nexts[1] = parseInt(nexts[1]);
		vfObjs.push({n: parseInt(vfArr[i].split(":")[0]), 
					nexts: nexts, 
					n_s: vfArr[i].split(":")[0], 
					nexts_s: [nexts[0].toFixed(0), nexts[1].toFixed(0)]});
	}
	var res = {};
	res.vf = vf;
	var factor = 0;
	var l = vfSimpleArr.length;
	for (var i = 0; i < l; i++) {
		factor += 1/Number(vfSimpleArr[i]);
	}
	//console.log(vf, factor, l, vfArr);
	res.V = Math.round(2/(1 - 0.5*l + factor));
	res.E = Math.round(res.V * l / 2);
	res.F = 2 - res.V + res.E;
	var eObj = {};
	var fObj = {};
	for (var i = 0; i < l; i++) {
		var sides = [vfSimpleArr[i],vfSimpleArr[(i+1)%l]].sort(function(a,b) {return a-b});
		var eString = "e" + sides.join("");;
		if (eObj.hasOwnProperty(eString)) eObj[eString] ++
		else {
			eObj[eString] = 1;
		}
		if (fObj.hasOwnProperty("f" + vfSimpleArr[i])) fObj["f" + vfSimpleArr[i]] ++;
		else fObj["f" + vfSimpleArr[i]] = 1;
	}
	res.eObj = eObj;
	res.fObj = fObj;
	var area = 0;
	for (var f in fObj) {
		var numSides = parseInt(f.slice(1))
		res[capitalize(f)] = res.V*fObj[f]/numSides;
		area += res[capitalize(f)]*numSides*0.25/Math.tan(Math.PI/numSides);
	}
	res.area = area;
	res.diameter = Math.sqrt(area/Math.PI);
	for (var f in eObj) {
		res[capitalize(f)] = res.V*eObj[f]/2;
	}
	
	var templates = [];
	function getSTemplate(edge) {
		var nums = edge.slice(1);
		if (nums.length % 2 == 0) {
			if (nums.slice(0, nums.length/2) == nums.slice(nums.length/2)) nums = nums.slice(nums.length/2);
		}
		var s = "s" + nums;
		var count = res[capitalize(edge)];
		return {type: s, count: count}
	}
	templates[0] = [];
	for (var f in eObj) {
		templates[0].push(getSTemplate(f));
	}
	
	function getHSTemplate(i, double) {
		var resStr = "hs";
		var hsCount = res["E" + vfObjs[i].nexts_s[0] + vfObjs[i].n_s];
		if (!double && vfObjs[i].nexts[0] == vfObjs[i].nexts[1]) hsCount /= 2;
		var sEdges = []; 
		if (!double) {
			resStr += vfObjs[i].n_s + vfObjs[i].nexts_s.join("");
			sEdges.push("e"  + (vfObjs[i].nexts_s[0] + vfObjs[i].n_s));
			sEdges.push("e"  + (vfObjs[i].n < vfObjs[i].nexts[1] ? vfObjs[i].n_s + vfObjs[i].nexts_s[1] : vfObjs[i].nexts_s[1] + vfObjs[i].n_s));
		}
		else {
			var n2 = vfObjs[i].n;
			var nexts2 = vfObjs[i].nexts.slice(0);
			for (var j = 0; j < vfObjs.length; j++) {
				if (j != i && vfObjs[j].n > 5) {
					n2 = vfObjs[j].n;
					nexts2 = vfObjs[j].nexts.slice(0);
				}
			}
			var n2_s = n2.toFixed(0);
			var n2next_s = nexts2[0].toFixed(0);
			resStr += n2 > vfObjs[i].n ?  
				(vfObjs[i].n_s + vfObjs[i].nexts_s[0] + n2_s + n2next_s) : 
				(n2_s + n2next_s +  (n2 == vfObjs[i].n ? "" : vfObjs[i].n_s + vfObjs[i].nexts_s[0]))
			sEdges.push("e"  + (vfObjs[i].nexts_s[0] + vfObjs[i].n_s));
			sEdges.push("e"  + (vfObjs[i].n < vfObjs[i].nexts[1] ? vfObjs[i].n_s + vfObjs[i].nexts_s[1] : vfObjs[i].nexts_s[1] + vfObjs[i].n_s));
			if (n2 != vfObjs[i].n) sEdges.push("e" + n2next_s + n2_s);
		}
		var hsTemplates = [{type: resStr, count: hsCount}];
		for (var f in eObj) 
				if (sEdges.indexOf(f) < 0) hsTemplates.push(getSTemplate(f));
		templates.push(hsTemplates.slice(0));			
	}
	
	for (var i = 0; i < vfObjs.length; i++) {
		if (vfObjs[i].n > 5 && vfObjs[i].n % 2 == 0 && vfObjs[i].nexts[1] != vfObjs[i].n && vfObjs[i].nexts[0] != vfObjs[i].n)
			getHSTemplate(i, false);
	}
	var doubleHSExists = false;
	for (var i = 0; i < vfObjs.length; i++) {
		if (!doubleHSExists && vfObjs[i].n > 5 && vfObjs[i].n % 2 == 0 && ((vfObjs[i].nexts[1] > 5 && vfObjs[i].nexts[1] % 2 == 0)|| (vfObjs[i].nexts[0] > 5 && vfObjs[i].nexts[2] % 2 == 0))) {
			getHSTemplate(i, true);
			doubleHSExists = true;
		}
	}
	
	
	function addFTemplate(ind, fTemplates, sEdges) {
		var i = ind;
		var n = vfObjs[i].n;
		var nexts = vfObjs[i].nexts;
		var n_s = vfObjs[i].n_s;
		var nexts_s = vfObjs[i].nexts_s;
		var exists = false;
		if (fTemplates.length > 0) {
			for (var jt = 0; jt < fTemplates.length; jt++) {
				if (fTemplates[jt].type.charAt(0) == "f" && fTemplates[jt].type.charAt(1) == n_s.charAt(0))
					exists = true;
			}
		}
		if (!exists && nexts[0] != n && nexts[1] != n) {
			var fTemplate = {type: "f" + n_s + nexts_s[0] + (nexts[0] == nexts[1]? "" : nexts_s[1]), count: res["F" + n_s]};
			sEdges.push("e" + (n < nexts[0] ? n_s + nexts_s[0] : nexts_s[0] + n_s));
			if (nexts[0] != nexts[1]) sEdges.push("e" + (n < nexts[1] ? n_s + nexts_s[1] : nexts_s[1] + n_s));
			fTemplates.push(fTemplate);
			for (var f in eObj) 
				if (sEdges.indexOf(f) < 0) fTemplates.push(getSTemplate(f));
			return fTemplate;
			
		}
		return null;
	}
	for (var i = 0; i < vfArr.length; i++) {
		var fTemplates = [];
		var sEdges = [];
		var ft = addFTemplate(i, fTemplates, sEdges);
		if (ft) {
			templates.push(fTemplates.slice(0));
			fTemplates = [ft];
			var n = vfObjs[i].n;
			for (var j = i+1; j < vfArr.length; j++) {
				var mNexts = vfObjs[j].nexts;
				if (mNexts[0] != n && mNexts[1] != n) {
				
					var ft2 = addFTemplate(j, fTemplates, sEdges);
					if (ft2) templates.push(fTemplates.slice(0));
				}
				
			}
		}
	}
	
	var snub = /(3\.){4}(4|5)/.exec(vf);
	if (snub) {
		var n = parseInt(snub[2]);
		var F3e = res["F" + snub[2]]*n;
		var f3Templ = {type: "f33", count: res.F3 - F3e};
		var s3Templ = {type: "s3", count: F3e/2};
		var fnTempl = {type: "f" + snub[2] + "3", count: res["F" + snub[2]] };
		templates.push([{type: "sf" + snub[2], count: res.E/5}], 
		[f3Templ, s3Templ, {type: "s3" + snub[2], count: res["E3" + snub[2]]}],
		[f3Templ, fnTempl, s3Templ]);
	
	}
	
	if (vf == "3.4.4.4") {
		var f44 = {type: "f44", count: 6} 
		templates.push([{type: "f434", count: 12}], [f44, {type: "s34", count: 24}], [f44, {type: "f34", count: 8}]);
	}
	res.templates = templates;
	
	return res;
}


function create3DPreview(parent, color, templatesArray, vf, polyName){
	var lp = null;
	console.log(polyName);
	if (PlatonicSolids.hasOwnProperty(polyName.toLowerCase())) 
		lp = PlatonicSolids[polyName.toLowerCase()].clone();
	else if (ArchimedeanSolids.hasOwnProperty(polyName.toLowerCase().split(" ").join("_"))) 
		lp = ArchimedeanSolids[polyName.toLowerCase().split(" ").join("_")];
	else if (polyName.toLowerCase() == "uniform prism") {
		lp = ArchimedeanSolids.prism(parseInt(vf.split(".")[2]))
	} else if (polyName.toLowerCase() == "uniform antiprism") {
		lp = ArchimedeanSolids.antiprism(parseInt(vf.split(".")[3]))
	}

	if (lp) {
		var cs3d = document.createElement("canvas");
		cs3d.setAttribute("class", "preview3d");
		cs3d.classList.add(nightView ? "night" : "day");
		var ctx3d = createThreeContext(cs3d);
		//return {renderer: renderer, scene: scene, camera: camera, controls: controls};
		parent.appendChild(ctx3d.renderer.domElement);
		
		ctx3d.templates = templatesArray.slice(0);
		ctx3d.vf = vf;

		var textureCanvas = getTextureCanvas(null, color, templatesArray, vf).canvas;
		var texture = new THREE.CanvasTexture(textureCanvas);
		var mat = new  THREE.MeshLambertMaterial({map: texture, transparent: true});//, emissive: "#cccccc", emissiveIntesity: 0.1, emissiveMap: texture});
		
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
		//ctx3d.poly3D.material.emissiveMap = texture;
		ctx3d.poly3D.material.needsUpdate = true;
		updateThreeContext(ctx3d);
		//var mat = new  THREE.MeshLambertMaterial({map: texture, transparent: true});
	} else if (options.hasOwnProperty("nightView")) {
		var textureCanvas = getTextureCanvas(null, previewColor, ctx3d.templates, ctx3d.vf).canvas;
		console.log("Updating material", nightView);
		var texture = new THREE.CanvasTexture(textureCanvas);
		ctx3d.poly3D.material.map = texture;
		//ctx3d.poly3D.material.emissiveMap = texture;
		ctx3d.poly3D.material.needsUpdate = true;
		ctx3d.renderer.domElement.classList.remove(options.nightView ? "day" : "night");
		ctx3d.renderer.domElement.classList.add(options.nightView ? "night" : "day");
		
		updateThreeContext(ctx3d);
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
		var cs = new PlotCanvas({width: w, height: w, minX: -scale, maxX: scale, minY: -scale, maxY: scale, fillAlpha: PC.viewAlpha}, parent);
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
		var resCs = new PlotCanvas({width: cWidth, height: cHeight, fillAlpha: (nightView ? PC.countLayerAlpha : PC.viewAlpha)}, parent); //TODO viewAlpha, if day
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
		if (nightView) resCs.alphaToAbsorption(PC.viewAlpha);
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


