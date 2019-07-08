

function PlotSVG (initObj = {}, parent = document.body) {
	this.scaleObj = copyObject(PlotSVG.defaults);
	copyObject(initObj, this.scaleObj);
	this.svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
	parent.appendChild(this.svg);
	
	this.svg.setAttribute("width", this.scaleObj.width);
	this.svg.setAttribute("height", this.scaleObj.height);
	if (initObj.hasOwnProperty("id"))
		this.svg.setAttribute("id", initObj.id);

	var that = this;
	
	var svg = this.svg;


	this.drawLine = function(x1, y1, x2, y2, color = 0, width = 0.5) {
		//<line x1="0" y1="0" x2="200" y2="200" style="stroke:rgb(255,0,0);stroke-width:2" />
		var l = document.createElementNS('http://www.w3.org/2000/svg','line');
		l.setAttribute("x1", x1);
		l.setAttribute("x2", x2);
		l.setAttribute("y1", y1);
		l.setAttribute("y2", y2);
		l.setAttribute("style", "stroke:" + color + ";stroke-width:" + width);
		that.svg.appendChild(l);
		return l;
	}

	this.drawHorLine = function(y = 0, color = 0, width = 0.5) {
		that.drawLine (0, y, that.svg.getAttribute("width"), y, color, width);
		
	}
	this.drawVerLine = function(x = 0, color = 0, width = 0.5) {
		that.drawLine (x, 0, x, that.svg.getAttribute("height"), color, width);
		
	}

	this.drawCross  = function(x = 0, y = 0, color = 0, width = 0.5) {
		that.drawVerLine(x, color, width);
		that.drawHorLine(y, color, width);
	}
	
	this.drawPolygon = function (xs, ys, style) {
		var pointsStr = "";
		for (var i = 0; i < xs.length; i++) {
			pointsStr += xs[i] + "," + ys[i] + (i < xs.length - 1 ? " " : "");
		}		
		var pl = document.createElementNS('http://www.w3.org/2000/svg','polyline');
		pl.setAttribute("points", pointsStr);
		if (style) pl.setAttribute("style", style);
		that.svg.appendChild(pl);
		return pl;
	}

	this.setSizeByArrays = function (xs, ys, options = {}) {
		var xMin = Number.POSITIVE_INFINITY;
		var xMax = Number.NEGATIVE_INFINITY;
		var yMin = Number.POSITIVE_INFINITY;
		var yMax = Number.NEGATIVE_INFINITY;
		for (var i = 0; i < xs.length; i++) {
			if (xs[i] < xMin) xMin = xs[i];
			if (ys[i] < yMin) yMin = ys[i];
			if (xs[i] > xMax) xMax = xs[i];
			if (ys[i] > yMax) yMax = ys[i];
		}
		
		var w = xMax - xMin;
		var h = yMax - yMin;
		if (options.hasOwnProperty("hMargine")) w+=2*options.hMargine;
		if (options.hasOwnProperty("vMargine")) h+=2*options.vMargine;
		
		this.svg.setAttribute("width", Math.ceil(w).toString());
		this.svg.setAttribute("height", Math.ceil(h).toString());
		
		return {xMin: xMin, yMin: yMin};
		
		
	}
	
	this.saveAsFile = function (name = (this.scaleObj.saveFileName ? this.scaleObj.saveFileName :(that.svg.hasAttribute("id") ? that.svg.getAttribute("id") : "plot")) + ".svg") {
		 var svg_data = that.svg.outerHTML;

		var blob = new Blob([svg_data], {type: "image/svg+xml"});  
		saveAs(blob, name);

	}
	if (this.scaleObj) {
		var b = document.createElement("button");
			b.innerHTML = this.scaleObj.saveButtonName;
			
			b.onclick = function (e) {
				that.saveAsFile();
			}
			parent.appendChild(b);
	}
	

}

PlotSVG.prototype = new Object();

PlotSVG.defaults = {width: 400, height: 600, dpi: 96, saveButton: false, saveButtonName: "Save", saveFileName: ""};



