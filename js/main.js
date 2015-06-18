var width = 873;
var height = 499;

var backgroundPath = "./data/map.png";

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
	
	roads.on("mousedown", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_select");
		var active = (selected.attr("active") == "true") ? false : true;
		console.log("active = " + selected.attr("active"));
		console.log("new active = " + active);
		newOpacity = active ? ROAD_ACTIVE : ROAD_INACTIVE;
		console.log("new opacity = " + newOpacity);
		selected.style("opacity", newOpacity);
		selected.attr("active", active);
	});
	
	roads.on("mouseover", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_select");
		if (selected.style("opacity") == ROAD_INACTIVE) {
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

d3.json("data/AB.topojson", function(error, pointdata) {
	if (error)
		throw error;

	var abdata = topojson.feature(pointdata, pointdata.objects.AB).features;
		
	// layer for points A, B
	points = pointlayer.selectAll("path")
		.data(abdata)
		.enter()
		.append("path")
		.attr("d", path)
		.style("stroke", "red")
		.append("text")
	;
	console.log(d3.select("#road1").node());
	console.log(d3.select("#road1").node().getPointAtLength(0));
});		

