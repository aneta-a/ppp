

function PlotCanvas (initObj = {}, parent = document.body) {
	this.scaleObj = copyObject(PlotCanvas.defaults);
	copyObject(initObj, this.scaleObj);
	this.canvas = document.createElement("canvas");
	if (parent) parent.appendChild(this.canvas);
	this.canvas.setAttribute("width", this.scaleObj.width);
	this.canvas.setAttribute("height", this.scaleObj.height);
	
	this.ctx = this.canvas.getContext("2d");
	
	
	this.setScale = function (arg) {
		if (!arg)
			this.scaleObj = plotParInit(initObj, this.scaleObj);
		else 
			this.scaleObj = plotParInit(arg, this.scaleObj);
	}
	this.setScale();
	var that = this;
	var ctx = this.ctx;
	var canvas = this.canvas;
	var plotPar = this.scaleObj;
	this.lineToPolar = function(r, phi) {
		that.lineToXY(r*Math.cos(phi), r*Math.sin(phi));
	}
	this.moveToPolar = function(r, phi) {
		that.moveToXY(r*Math.cos(phi), r*Math.sin(phi));
	}

	this.lineToXY  = function(x, y) {
		ctx.lineTo(that.localToGlobal(x), that.localToGlobal(y, true)); 
		
	}
	this.moveToXY  = function(x, y) {
		ctx.moveTo(that.localToGlobal(x), that.localToGlobal(y, true)); 
		
	}

	this.localToGlobal = function(x, vert=false) {
		if (vert) {
			res = canvas.height - (x - plotPar.minY)*plotPar.ratY;
		} else {
			res = (x - plotPar.minX)*plotPar.ratX;
		}
		return res
		
	}

	this.drawLine = function(x1, y1, x2, y2, color = 0, width = 0.5) {
		ctx.strokeStyle = color;
		ctx.lineWidth = width;
		ctx.beginPath();
		that.moveToXY (x1, y1);
		that.lineToXY (x2, y2);
		ctx.stroke();

	}

	this.drawHorLine = function(y = 0, color = 0, width = 0.5) {
		that.drawLine (plotPar.minX, y, plotPar.maxX, y, color, width);
		
	}
	this.drawVerLine = function(x = 0, color = 0, width = 0.5) {
		that.drawLine (x, plotPar.minY, x, plotPar.maxY, color, width);
		
	}

	this.drawCross  = function(x = 0, y = 0, color = 0, width = 0.5) {
		that.drawVerLine(x, color, width);
		that.drawHorLine(y, color, width);
	}
	
	this.drawPolygon = function (xs, ys, color, width = 2, fill = false, fillColor = null, fillAlpha = this.scaleObj.fillAlpha) {
		ctx.strokeStyle = color;
		ctx.lineWidth = width;
		ctx.beginPath();
		that.moveToXY(xs[0], ys[0]);
		for (var i = 1; i < xs.length; i++) 
			that.lineToXY(xs[i], ys[i]);
		if (fill) {
			if (fillColor) ctx.fillStyle = fillColor 
			else {
				ctx.fillStyle = color;
				ctx.fillStyle = ctx.fillStyle + fillAlpha;
			}
			ctx.fill();
		}
		ctx.stroke();
	}
	

this.alphaToAbsorption = function(visibleAlpha = parseInt(this.scaleObj.fillAlpha, 16), countLayerAlpha = parseInt(this.scaleObj.fillAlpha, 16), light = {r:255, g:255, b:255, a:255}) {
	PC.alphaToAbsorption(this.canvas, countLayerAlpha, visibleAlpha, light);
}
	
function plotParInit(qs, plotPar) {
		function setVar (obj, name, val, number = false) {
			if (qs.hasOwnProperty(name)) obj[name] = number ? Number(qs[name]) : qs[name];
			else obj[name] = val;

		}

		setVar (plotPar, "adjust", plotPar.adjust);
		setVar (plotPar, "centerX", plotPar.centerX);
		setVar (plotPar, "centerY", plotPar.centerY);
		setVar (plotPar, "width", plotPar.width, true);
		setVar (plotPar, "height", plotPar.height, true);
		if (qs.hasOwnProperty("minX") && qs.hasOwnProperty("maxX")) {
			plotPar.minX = qs.minX;
			plotPar.maxX = qs.maxX;
			plotPar.centerX = false;
		} else if (qs.hasOwnProperty("minX")) {
			plotPar.minX = qs.minX;
			if (plotPar.centerX) {
				plotPar.maxX = - plotPar.minX;
			} 
		}else if (qs.hasOwnProperty("maxX")) {
			plotPar.maxX = qs.maxX;
			if (plotPar.centerX) {
				plotPar.minX = - plotPar.maxX;
			} 
		}
		if (qs.hasOwnProperty("minY") && qs.hasOwnProperty("maxY")) {
			plotPar.minY = qs.minY;
			plotPar.maxY = qs.maxY;
			plotPar.centerY = false;
		} else if (qs.hasOwnProperty("minY")) {
			plotPar.minY = qs.minY;
			if (plotPar.centerY) {
				plotPar.maxY = - plotPar.minY;
			} 
		} else if (qs.hasOwnProperty("maxY")) {
			plotPar.maxY = qs.maxY;
			if (plotPar.centerY) {
				plotPar.minY = - plotPar.maxY;
			} 
		}
		plotPar.x0 = 0.5*(plotPar.maxX + plotPar.minX);
		plotPar.y0 = 0.5*(plotPar.minY + plotPar.maxY);
		plotPar.dx = plotPar.maxX - plotPar.minX;
		plotPar.dy = plotPar.maxY - plotPar.minY;
		plotPar.ratX = plotPar.width / plotPar.dx;
		plotPar.ratY = plotPar.height/plotPar.dy;
		if (((plotPar.ratX < plotPar.ratY) && (plotPar.adjust == "all")) ||
			((plotPar.ratX > plotPar.ratY) && (plotPar.adjust == "crop"))) {
			plotPar.ratY = plotPar.ratX;
			plotPar.dy = plotPar.height/plotPar.ratX;
			plotPar.maxY = plotPar.y0 + 0.5*plotPar.dy;
			plotPar.minY = plotPar.y0 - 0.5*plotPar.dy;
			
		} else if (plotPar.adjust != "none"){
			plotPar.ratX = plotPar.ratY;
			plotPar.dx = plotPar.width/plotPar.ratY;
			plotPar.maxX = plotPar.x0 + 0.5*plotPar.dx;
			plotPar.minX = plotPar.x0 - 0.5*plotPar.dx;
		}
		
		return plotPar;
}


}

PlotCanvas.prototype = new Object();

PlotCanvas.defaults = {minY: -1, maxY: 1, maxX: 1, minX: -1, adjust: "all"/*"none" "crop"*/, centerX: true, centerY: true, width: 600, height: 400, fillAlpha: "1C"};

(function(){

this.countLayerAlpha = "1C";
this.viewAlpha = "66";


function transformCanvas (canvas, transformFunc) {
	var ctx = canvas.getContext('2d');
	var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
    	var newRGBA = transformFunc({r: data[i], g: data[i+1], b: data[i+2], a: data[i+3]});
      data[i]     = newRGBA.r;     // red
      data[i + 1] = newRGBA.g; // green
      data[i + 2] = newRGBA.b; // blue
      data[i + 3] = newRGBA.a; // blue
    }
    ctx.putImageData(imageData, 0, 0);
}
this.transformCanvas = transformCanvas;

this.invertAlpha = function(canvas) {
	return transformCanvas(canvas, function (rgba) {return {r: rgba.r, g: rgba.g, b: rgba.b, a: 255-rgba.a};});
}

this.alphaToAbsorption_ = function(canvas, gray = 0) {
	return transformCanvas(canvas, function (rgba) {
		var epsilon = 1 - rgba.a/255.0;
		return {r: Math.round(gray*(1-epsilon) + rgba.r*epsilon), g: Math.round(gray*(1-epsilon) + rgba.g*epsilon), b: Math.round(gray*(1-epsilon) + rgba.b*epsilon), a: 255}
	});
}

this.alphaToAbsorption = function(canvas, 
		layerAlpha = parseInt(PlotCanvas.defaults.fillAlpha, 16), 
		visibleAlpha = parseInt(PlotCanvas.defaults.fillAlpha, 16)/*100*/, 
		extLight = {r: 255, g:255, b: 255, a: 255}) {
	var log255 = Math.log(255);
	var alpha = layerAlpha*0.003921569; // /255
	var logA = Math.log(255.0-layerAlpha) - log255;
	var vAlpha = visibleAlpha*0.003921569;
	var maxC = 240; 
	var maxLayer = -Math.log(layerAlpha)/logA;//=(LN(A35)/(LN(255)-LN(255-A35))), a35=
	function transformPixel (rgba) {
		var layers = rgba.a == 255 ? maxLayer: Math.min(maxLayer, Math.round((Math.log(255-rgba.a)-log255)/logA));
		function getComponent(c) {
			var base = (Math.min(maxC,rgba[c])*vAlpha+255-visibleAlpha)*0.003921569;
			var n = layers;
			var res = extLight[c];
			while (n-- > 0 && res > 1) res*=base;
			return Math.round(res);
		}
		//var epsilon = 1 - rgba.a/255.0;
		return {r: getComponent("r"), g: getComponent("g"), b: getComponent("b"), a: 255}
	}
	
	return transformCanvas(canvas, transformPixel );
}
}).apply(PlotCanvas);

var PC = PlotCanvas;


