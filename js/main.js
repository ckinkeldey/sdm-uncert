var width = 873;
var height = 499;

var ROAD_COLOR = "yellow";
	
var ROAD_OPACITY_ACTIVE = 1;
var ROAD_OPACITY_SELECTABLE = 0.5;
var ROAD_OPACITY_INACTIVE = 0;

var backgroundPath = "./data/map.png";

var eps = 10;
var route = [];
// point at end of selected route
var currentEnd;

var rasterX = 0,
    rasterY = 0, // Offset (px) for positioning raster in 	<div>
    // imgWidth = 873, // <image> dimensions (don't change these)
    // imgHeight = 499,
    center = [8.73 / 2., 4.99 / 2.], // Center vector [lon, lat]
    scale = 873 * 2.1 * Math.PI,
    translate = [width/2, height/2];

var projection = d3.geo.mercator()
.center(center)
.translate(translate)
.scale(scale)
;

var path = d3.geo.path().projection(projection);

var svg = d3.select("body").append("div").append("svg").attr("width", width).attr("height", height);

var rasterlayer = svg.append("g").attr("id", "map");
var selectionlayer = svg.append("g").attr("id", "selection");
var roadlayer = svg.append("g").attr("id", "roads");
var pointlayer = svg.append("g")
	.attr("id", "points");

rasterlayer.append("image")
	.attr("width", width + "px")
	.attr("height", height + "px")
	.attr("x", rasterX + "px")
	.attr("y", rasterY + "px")
	.attr("xlink:href", backgroundPath);

var roads, selection, points;

d3.json("data/roads.topojson", function(error, vectordata) {
	if (error)
		throw error;

	var color = d3.scale.ordinal()
		.domain([4,3,2,1])
		.range(["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);

	function setColor() {
		d3.select(this).style('stroke', function(d) {
			return color(d.properties.risk);
			});
	}
	
	var roaddata = topojson.feature(vectordata, vectordata.objects.roads).features;
		
	// layer for selections
	selection = selectionlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id + "_select";})
		.attr("length", function(d) {return d.properties.length;})
		.attr("canclick", false)
		.attr("active", false)
		.style("stroke", ROAD_COLOR)
		.style("stroke-width", 20)
		.style("opacity", ROAD_OPACITY_INACTIVE);
		
	// layer for the colored roads
	roads = roadlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id;})
		.each(setColor);
	
	roads.on("mousedown", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_select");
		if (isValid(selected)) {
			drawSegment(selected);
		}
	});
	
	roads.on("mouseup", function() {
		leftMB = false;
	});
	
	roads.on("mouseover", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_select");
		if (isValid(selected)) {
			selected.style("opacity", ROAD_OPACITY_SELECTABLE);
		}
	});	
	
	roads.on("mouseout", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_select");
		if (selected.style("opacity") == ROAD_OPACITY_SELECTABLE && isValid(selected)) {
			selected.style("opacity", selected.attr("active")=="true" ? ROAD_OPACITY_ACTIVE : ROAD_OPACITY_INACTIVE);
		}
	});	
	
});

d3.json("data/AB.topojson", function(error, pointdata) {
	if (error)
		throw error;

	var abdata = topojson.feature(pointdata, pointdata.objects.AB).features;
		
	// points A, B
	points = pointlayer.selectAll("path")
		.data(abdata)
		.enter()
		.append("g")
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "p" + d.properties.id;})
		.style("stroke", "red")
	;
	var pointA = d3.select("#p0").node().getPointAtLength(0);
	var pointB = d3.select("#p1").node().getPointAtLength(0);
	var xLabelA = pointA.x - 20; 
	var yLabelA = pointA.y - 20;
	var xLabelB = pointB.x + 20; 
	var yLabelB = pointB.y - 20;
	
	pointlayer.selectAll("labels")
		.data(abdata)
		.enter()
		.append("svg:text")
		.attr("x", function (d) {return d.properties.id==0?xLabelA:xLabelB;})
		.attr("y", function (d) {return d.properties.id==0?yLabelA:yLabelB;})
		.style("fill", "red")
		// .style("font-size", "20px")
		.text(function (d) {return d.properties.id==0?"A":"B";})
	;
	
	// initial state: starting point is current end of route
	currentEnd = new toxi.geom.Vec2D(pointA.x, pointA.y);
	// console.log("current end: " + currentEnd);
});

function drawSegment(selected) {
	var active = (selected.attr("active") == "true") ? false : true;
	// console.log("active = " + selected.attr("active"));
	// console.log("new active = " + active);
	newOpacity = active ? ROAD_OPACITY_ACTIVE : ROAD_OPACITY_INACTIVE;
	// console.log("new opacity = " + newOpacity);
	selected.style("opacity", newOpacity);
	selected.attr("active", active);
	// add or remove selected part to/from the route
	if (active == true) {
		 route.push(selected);
	} else {
		route.pop();
	}
	updateEndPoint(selected);
	if (isRouteComplete(selected)) {
		selectionlayer.selectAll("path")
		.style("stroke", "green");
	} else {
		selectionlayer.selectAll("path")
		.style("stroke", ROAD_COLOR);
	}
} 

function updateEndPoint(segment) {
	var start = segment.node().getPointAtLength(0);
	var end = segment.node().getPointAtLength(segment.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	if (p0.distanceTo(currentEnd) < eps) {
		currentEnd = p1;
	} else if (p1.distanceTo(currentEnd) < eps) {
		currentEnd = p0;
	}
}

function isRouteComplete(segment) {
	var pointB = d3.select("#p1").node().getPointAtLength(0);
	var b = new toxi.geom.Vec2D(pointB.x, pointB.y);
	return b.distanceTo(currentEnd) < eps;
}

function isValid(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	return p0.distanceTo(currentEnd) < eps || p1.distanceTo(currentEnd) < eps;
}

function deleteRoute() {
	route = [];
	var pointA = d3.select("#p0").node().getPointAtLength(0);
	currentEnd = new toxi.geom.Vec2D(pointA.x, pointA.y);
	
	selection = d3.select("#selection").selectAll("*")
	.each(function(d) {
		var self = d3.select(this);
		self.attr("active", false)
		.style("stroke", ROAD_COLOR)
		.style("opacity", ROAD_OPACITY_INACTIVE)
		;
	});
}

function computeRouteLength() {
	
}

