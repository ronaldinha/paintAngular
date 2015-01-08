var app = angular.module('drawSth', []);

app.directive('myCanvas', function() {
	return {
		restrict: 'A',
		link: function($scope, element) {
			// Variables
			var drawingAreaX = 0;
			var drawingAreaY = 0;
			var paint = false;

			// Event Handler
			element.bind('mousedown', start);
			element.bind('mousemove', move);
			element.bind('mouseup', stop);
			element.bind('mouseleave', stop);

			// This line aims to display the outline image from the beginning
			redraw();
			
			/*
				this function save the mouse position when there is a click on the canvas
				params : e - event
			*/
			function start (e){
				// Determine the mouse position in the canvas (X,Y)
				var mouseX = e.pageX - this.offsetParent.offsetLeft; // we use the offsetParent because the canvas has a parent different from body
				var mouseY = e.pageY - this.offsetParent.offsetTop;

				// Switch the paint status to true
				paint = true;
				// Save the click
				addClick(mouseX, mouseY);
				// Draw all the clicks from the beginning
				redraw();
			};


			/*
				this function save the mouse position if the user is painting and moving the mouse hover the canvas
				params : e - event
			*/
			function move (e){
				// Determine the mouse position in the canvas (X,Y)
				var mouseX;
				var mouseY;
				// if the user is painting
				if(paint){
					mouseX = e.pageX - this.offsetParent.offsetLeft;// - this.offsetLeft;
					mouseY = e.pageY - this.offsetParent.offsetTop;// - this.offsetTop;
					// Save the mouse position and redraw the image
		    		addClick(mouseX, mouseY, true);
		    		redraw();
		  		}
			};


			/*
				this function switch the paint property to false when the user is not painting
			*/
			function stop (){
				// Switch the paint status to false
				paint = false;
			};


			/*
				this function save a click on the coordinates (X,Y) and the properties related
				params : x - click location on X axis
						 y - click location on Y axis
						 dragging -
			*/		
			function addClick (x, y, dragging){
				// Save the mouse position
				$scope.clickX.push(x);
				$scope.clickY.push(y);

				$scope.clickDrag.push(dragging);
				// If the eraser is selected save white as color otherwise save the current color
				if($scope.curTool.name.toLowerCase() === "eraser"){
					$scope.clickColor.push("white");
				}else{
					$scope.clickColor.push($scope.curColor.code);
				}

				// Save the tool size
				$scope.clickSize.push($scope.curSize);
			};


			/*
				this function draw all the clicks saved from the beginning and the outline image
			*/
			function redraw (){
				var context = document.getElementById('canvas').getContext('2d');
				context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
				context.lineJoin = "round";
	
				// save the context and draw all the previous clicks
				context.save();
				context.beginPath();
				context.rect(drawingAreaX, drawingAreaY, $scope.drawingAreaWidth, $scope.drawingAreaHeight);
				context.clip();
							
				for (var i=0; i < $scope.clickX.length; i++) {		
					context.beginPath();
					if ($scope.clickDrag[i] && i){
						context.moveTo($scope.clickX[i-1], $scope.clickY[i-1]);
					} else {
						context.moveTo($scope.clickX[i]-1, $scope.clickY[i]);
					}
					context.lineTo($scope.clickX[i], $scope.clickY[i]);
					context.closePath();
					context.strokeStyle = $scope.clickColor[i];
					context.lineWidth = $scope.clickSize[i];
					context.stroke();
				};
				context.restore();
				
				// Draw with the crayon size or the marker size
				if ($scope.curTool.name.toLowerCase() === "crayon") {
						context.globalAlpha = 0.4;
						context.drawImage($scope.crayonTextureImage, 0, 0, context.canvas.width, context.canvas.height);
				}
				context.globalAlpha = 1;

				// Draw the outline image
				context.drawImage($scope.outlineImage, 0, 0, $scope.outlineImage.width, $scope.outlineImage.height);
			};
		}
	};
});

app.controller('drawCtrl', ['$scope', function($scope){
	// Variable initialisations
	this.colors = colors;
	this.sizes = sizes;
	this.tools = tools;
			
	$scope.curColor = this.colors[0];
	$scope.curSize = this.sizes[2].value; // caution : the normal size should be in second position :/
	$scope.curTool = this.tools[0];


	/*
		This function creates a canvas width the given parameters and initialise the related variables
		params : width - canvas width
				 height - canvas height
	*/
	this.initCanvas = function (width, height){
		// canvas creation
		var canvas = document.createElement('canvas');
		canvas.setAttribute('width', width);
		canvas.setAttribute('height', height);
		canvas.setAttribute('id', 'canvas');
		document.getElementById('canvasDiv').appendChild(canvas);
		// this line is only for the compatibility with IE
		if(typeof G_vmlCanvasManager != 'undefined') {
			canvas = G_vmlCanvasManager.initElement(canvas);
		}

		// Variables
		$scope.drawingAreaWidth = width;
		$scope.drawingAreaHeight = height
		$scope.clickX = [];
		$scope.clickY = [];
		$scope.clickDrag = [];
		$scope.clickColor = [];
		$scope.clickSize = [];
		$scope.clickTool = [];

		// Images
		$scope.outlineImage = new Image();
		$scope.crayonTextureImage = new Image();
		$scope.crayonTextureImage.src = "images/crayon-texture.png";
		$scope.outlineImage.src = "images/watermelon-duck-outline.png";
		$scope.outlineImage.width = 267;
		$scope.outlineImage.height = 210;
	};

	/*
		This function changes the tool color and displays the relevant images
		params : color - the selected color 
	*/
	$scope.changeColor = function (color){
		$scope.curColor = color;
		// change the tool images - 4 cases : good/wrong color + marker or good/wrong color + crayon
		for (var i = 0; i < colors.length; i++) {
			var colorImg = document.getElementById(colors[i].name + 'Image');
			var goodColorAndMarker = color.name === colors[i].name && $scope.curTool.name === 'marker';
			var goodColorAndCrayon = color.name === colors[i].name && $scope.curTool.name === 'crayon';
			var badColorAndMarker = color.name !== colors[i].name && $scope.curTool.name === 'marker';
			var badColorAndCrayon = color.name !== colors[i].name && $scope.curTool.name === 'crayon';

			if(goodColorAndMarker){
				colorImg.src = colors[i].markerLong;
			} else if (goodColorAndCrayon){
				colorImg.src = colors[i].crayonLong;
			} else if (badColorAndMarker) {
				colorImg.src = colors[i].markerShort;
			} else if (badColorAndCrayon){
				colorImg.src = colors[i].crayonShort;
			}
		};
	};


	/*
		This function changes the tool and displays the relevant images
		params : tool - the selected tool 
	*/
	$scope.changeTool = function(tool){
		$scope.curTool = tool;
		for (var i = 0; i < tools.length; i++) {
			var toolImg = document.getElementById(tools[i].name + 'Image');
			// change the tool images
			if(tool.name === tools[i].name){
				toolImg.src = tools[i].imageOn; 
			} else {
				toolImg.src = tools[i].imageOff;
			}
		};
		$scope.changeColor($scope.curColor);
	};


	/*
		This function changes the tool size and displays the relevant images
		params : size - the selected size 
	*/
	this.changeSize = function(size){
		$scope.curSize = size.value;
		var lineimg = document.getElementById('lineImg');
		if (size.name.toLowerCase() === 'small') {
			lineImg.className = " line smallSize";
		} else if (size.name.toLowerCase() === 'normal') {
			lineImg.className = " line normalSize";
		} else if (size.name.toLowerCase() === 'large') {
			lineImg.className = " line largeSize";
		} else {
			lineImg.className = " line hugeSize";
		}
	};


	/*
		This function reinitialises all the canvas parameters and erases all the previous clicks 
	*/
	this.reset = function (){
		var context = document.getElementById('canvas').getContext('2d');
		context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
		$scope.clickX = [];
		$scope.clickY = [];
		$scope.clickDrag = [];
		$scope.clickColor = [];
		$scope.clickSize = [];
		$scope.clickTool = [];
		context.drawImage($scope.outlineImage, 0, 0, $scope.outlineImage.width, $scope.outlineImage.height);
	};	
}]);

var colors = [ 
	{ name : 'Purple', code : "#cb3594", defaultSize:"images/colors/crayon-purple-long.png", crayonLong: "images/colors/crayon-purple-long.png", markerLong:"images/colors/marker-purple-long.png", crayonShort: "images/colors/crayon-purple-short.png", markerShort:"images/colors/marker-purple-short.png" }, 
	{ name : 'Green', code : "#659b41", defaultSize:"images/colors/crayon-green-short.png", crayonLong: "images/colors/crayon-green-long.png", markerLong:"images/colors/marker-green-long.png", crayonShort: "images/colors/crayon-green-short.png", markerShort:"images/colors/marker-green-short.png"  },
	{ name : 'Yellow', code : "#ffcf33", defaultSize:"images/colors/crayon-yellow-short.png", crayonLong: "images/colors/crayon-yellow-long.png", markerLong:"images/colors/marker-yellow-long.png", crayonShort: "images/colors/crayon-yellow-short.png", markerShort:"images/colors/marker-yellow-short.png" },
	{ name : 'Brown', code : "#986928", defaultSize:"images/colors/crayon-brown-short.png", crayonLong: "images/colors/crayon-brown-long.png", markerLong:"images/colors/marker-brown-long.png", crayonShort: "images/colors/crayon-brown-short.png", markerShort:"images/colors/marker-brown-short.png" }
];

var sizes = [
	{ name : 'Huge', value : 20, image : "images/sizes/huge.png", sClass : "huge"},
	{ name : 'Large', value : 10, image : "images/sizes/large.png", sClass : "large" },
	{ name : 'Normal', value : 5, image : "images/sizes/normal.png", sClass : "normal" },
	{ name : 'Small', value : 2, image : "images/sizes/small.png", sClass : "small" }
];

var tools = [ 
	{name:"crayon", imageDefault: "images/tools/crayonOn.png", imageOn: "images/tools/crayonOn.png", imageOff: "images/tools/crayonOff.png"},
	{name:"marker", imageDefault: "images/tools/markerOff.png", imageOn: "images/tools/markerOn.png", imageOff: "images/tools/markerOff.png"},
	{name:"eraser", imageDefault: "images/tools/eraserOff.png", imageOn: "images/tools/eraserOn.png", imageOff: "images/tools/eraserOff.png"}
];