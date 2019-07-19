/**
* @author Anna Alekseeva
*/

var rendererBkgColor = 0x00000000;
var default3DCanvasWidth = 450;
var default3DCanvasHeight = 450;

var createThreeContext = function (canvas) {
	var renderer = new THREE.WebGLRenderer( {canvas: canvas, antialias:true, alpha:true} );
  	renderer.setClearColor(rendererBkgColor);
	if (!canvas.getAttribute("width")) canvas.setAttribute("width", default3DCanvasWidth);
	if (!canvas.getAttribute("height")) canvas.setAttribute("height", default3DCanvasHeight);

  	resizeCanvas({renderer: renderer});
	

	var scene = new THREE.Scene();

 	var camera = new THREE.PerspectiveCamera (45, canvas.width/canvas.height, 1, 10000);
	camera.position.y = 2;//-3;
	camera.position.z = 2;//-1;
	camera.position.x = 2;//.5;
	camera.lookAt (new THREE.Vector3(0,0,0));

  	var controls = new THREE.OrbitControls (camera, renderer.domElement);
  	controls.enableKeys = false;
	initLights(scene);
	
	controls.enableZoom = false;
	
	renderer.domElement.addEventListener("click", function (ev) {controls.enableZoom = true});
	renderer.domElement.addEventListener("mouseout", function (ev) {controls.enableZoom = false});
	
	
 	
  	return {renderer: renderer, scene: scene, camera: camera, controls: controls};

}

var updateThreeContext = function (ctxObj) {
	ctxObj.controls.update();
	ctxObj.renderer.render(ctxObj.scene, ctxObj.camera);
}

var resizeCanvas = function (element) {
	var isContext = element.hasOwnProperty("renderer");
	var canvas = isContext ? element.renderer.domElement : element;
	var style = window.getComputedStyle(canvas);
	var w = parseInt(style.width);
	var h = parseInt(style.height);
	if( w > 0) canvas.width = w
	else w = canvas.width;
	if (h > 0) canvas.height = h 
	else h = canvas.height;
	if (isContext) {
		element.renderer.setSize(w, h, false);
		if (element.camera) {
			element.camera.aspect = w/h;
			element.camera.updateProjectionMatrix();
		}
	} else {
	}
}

function initLights(scene) {
  	var pointLight = new THREE.PointLight (0xffffff);
	pointLight.position.set (0,30,10);
	//scene.add(pointLight);
	var light = new THREE.AmbientLight( 0xeeeeee ); // soft white light
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
	directionalLight.position.set( -0.8, 2, -1);
	scene.add( directionalLight );
	var directionalLight1 = new THREE.DirectionalLight( 0xffffff, 0.6 );
	directionalLight1.position.set( 2, -1, 0.5 );
	//scene.add( directionalLight1 );
	scene.add( light );

}

console.log("display loaded");

