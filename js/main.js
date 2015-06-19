var width = 873;
var height = 499;

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

	var ROAD_ACTIVE = 1;
	var ROAD_SELECTABLE = 0.5;
	var ROAD_INACTIVE = 0;
	
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
		.attr("canclick", false)
		.attr("active", false)
		.style("stroke", "yellow")
		.style("stroke-width", 20)
		.style("opacity", ROAD_INACTIVE);
		
	// layer for the colored roads
	roads = roadlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id;})
		.each(setColor);
	
	roads.on("click", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_select");
		if (!isValid(selected)) {
			return;
		}
		var active = (selected.attr("active") == "true") ? false : true;
		console.log("active = " + selected.attr("active"));
		console.log("new active = " + active);
		newOpacity = active ? ROAD_ACTIVE : ROAD_INACTIVE;
		console.log("new opacity = " + newOpacity);
		selected.style("opacity", newOpacity);
		selected.attr("active", active);
		// add selected part to the route
		route.push(self);
		updateEndPoint(self);
		if (isRouteComplete(self)) {
			selectionlayer.selectAll("path")
			.style("stroke", "green");
		}
	});
	
	roads.on("mouseover", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_select");
		if (isValid(selected) && selected.style("opacity") == ROAD_INACTIVE) {
			selected.style("opacity", ROAD_SELECTABLE);
		}
	});	
	
	roads.on("mouseout", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_select");
		if (selected.style("opacity") == ROAD_SELECTABLE) {
			selected.style("opacity", ROAD_INACTIVE);
		}
	});	
});

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

d3.json("data/AB.topojson", function(error, pointdata) {
	if (error)
		throw error;

	var abdata = topojson.feature(pointdata, pointdata.objects.AB).features;
		
	// points A, B
	points = pointlayer.selectAll("path")
		.data(abdata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "p" + d.properties.id;})
		.style("stroke", "red")
		.append("text")
	;
	// initial state: starting point is current end of route
	var pointA = d3.select("#p0").node().getPointAtLength(0);
	currentEnd = new toxi.geom.Vec2D(pointA.x, pointA.y);
	// console.log("current end: " + currentEnd);
});

function isValid(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	return p0.distanceTo(currentEnd) < eps || p1.distanceTo(currentEnd) < eps;
}

