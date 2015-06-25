var width = 873;
var height = 499;

var backgroundPath = "./data/map.png";
var roadfile = "vector_risk_length_transformed";

var eps = 10;
var route = [];
var routeLength = 0;

var leftMB = false;

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
var highlightlayer = svg.append("g").attr("id", "highlight");
var roadlayer = svg.append("g").attr("id", "roads");
var roadnodeslayer = svg.append("g").attr("id", "roadnodes");
var pointlayer = svg.append("g").attr("id", "points");
var selectionlayer = svg.append("g").attr("id", "selection");

rasterlayer.append("image")
	.attr("width", width + "px")
	.attr("height", height + "px")
	.attr("x", rasterX + "px")
	.attr("y", rasterY + "px")
	.attr("xlink:href", backgroundPath);

var roads, roadNodes, highlight, points;

d3.json("data/"+ roadfile + ".topojson", function(error, roaddata) {
	if (error)
		throw error;

	var color = d3.scale.ordinal()
		.domain([4,3,2,1])
		.range(["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);

	function setColor() {
		d3.select(this)
		.style('stroke', function(d) {
			return color(d.properties.risk);
		});
	}	
	
	function changeBlocked(roads) {
		roads
			.style("stroke", function(d) {
			var risk = d.properties.risk;
			return Math.random() < 1/risk ? "#d7301f" : "#fef0d9";
		});
	}
	
	function drawSymbol() {
		var self = d3.select(this);
		self.attr("risk", function(d) {
			return d.properties.risk;
			});
		var symbolSize = (5-self.attr("risk"))*8;
		d3.select("g")
		.append("svg:image")
		.attr("width", symbolSize)
		.attr("height", symbolSize)
		.attr("x", function() {
			var x0 = self.node().getPointAtLength(0).x;
			var x1 = self.node().getPointAtLength(self.node().getTotalLength()).x;
			return (x0+x1-symbolSize)/2;
		})
		.attr("y", function() {
			var y0 = self.node().getPointAtLength(0).y;
			var y1 = self.node().getPointAtLength(self.node().getTotalLength()).y;
			return (y0+y1-symbolSize)/2;
		})
		.attr("xlink:href", "data/warning.png");
	}
	
	var roaddata = topojson.feature(roaddata, roaddata.objects[roadfile]).features;
	
	// layer for highlighting selections
	highlight = highlightlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id + "_highlight";})
		.attr("length", function(d) {return d.properties.length;})
		.attr("canclick", false)
		.attr("active", false)
		.style("stroke", ROUTE_COLOR)
		.style("stroke-width", 30)
		.style("stroke-linecap", "round")
		.style("opacity", ROUTE_OPACITY_INACTIVE);
		
	// layer for the roads
	if (visualization == 0) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "square")
			.each(setColor);
	} else if (visualization == 1) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "butt")
			// .style("stroke", function() {return Math.random() <=0.5 ? "#fef0d9" : "#d7301f";})
			;
			setInterval(function() {changeBlocked(roads);}, 1000);
	} else {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "square")
			.style("stroke", "grey")
			.style("opacity", 0)
			.each(drawSymbol);
		
	}
	
	
	// invisible layer for selection events
	selection = selectionlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id;})
		.style("stroke", "#f00")
		.style("stroke-width", 30)
		.style("stroke-linecap", "butt")
		.style("opacity", 0)
		;
	
	selection.on("mouseover", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_highlight");
		if (isValid(selected) && isSimple(selected)) {
			// if (leftMB == true) {
				// drawSegment(selected);
			// } else {
				selected.style("opacity", ROUTE_OPACITY_SELECTABLE);
			// }
		}
		// console.log("part of route: " + isPartOfRoute(selected));
	});	
	
	selection.on("mousedown", function() {
		leftMB = true;
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_highlight");
		if (isValid(selected) && isSimple(selected)) {
			drawSegment(selected);
		}
	});
	
	selection.on("mouseup", function() {
		leftMB = false;
	});
	
	selection.on("mouseout", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_highlight");
		if (selected.style("opacity") == ROUTE_OPACITY_SELECTABLE && isValid(selected)) {
			selected.style("opacity", selected.attr("active")=="true" ? ROUTE_OPACITY_ACTIVE : ROUTE_OPACITY_INACTIVE);
		}
	});	
	
});

d3.json("data/"+ roadfile + "_points.topojson", function(error, roadnodesdata) {
	if (error)
		throw error;
		
	var roadnodesdata = topojson.feature(roadnodesdata, roadnodesdata.objects[roadfile+"_points"]).features;
		
	// road nodes as layover
	roadnodes = roadnodeslayer.selectAll("path")
			.data(roadnodesdata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("fill", "white")
			.style("stroke", "white")
			.style("stroke-width", "5px")
			.style("stroke-linecap", "square")
			;
			
});

d3.json("data/AB1.topojson", function(error, pointdata) {
	if (error)
		throw error;

	var abdata = topojson.feature(pointdata, pointdata.objects.AB1).features;
		
	// points A, B
	points = pointlayer.selectAll("circle")
		.data(abdata)
		.enter()
		.append("circle")
		.attr("id", function(d) {return "p" + d.properties.id;})
		.attr("cx", function(d) {
			console.log(d.geometry);
			return projection(d.geometry.coordinates)[0];})
		.attr("cy",  function(d) {return projection(d.geometry.coordinates)[1];})
		.attr("r", "10px")
		.style("fill", "green")
		.style("stroke", "white")
	;
	
	var pointAx = d3.select("#p0").attr("cx");
	var pointAy = d3.select("#p0").attr("cy");
	var pointBx = d3.select("#p1").attr("cx");
	var pointBy = d3.select("#p1").attr("cy");
	var xLabelA = pointAx - 20; 
	var yLabelA = pointAy - 20;
	var xLabelB = pointBx + 20; 
	var yLabelB = pointBy - 20;
	
	pointlayer.selectAll("labels")
		.data(abdata)
		.enter()
		.append("svg:text")
		.attr("x", function (d) {return d.properties.id==0?xLabelA:xLabelB;})
		.attr("y", function (d) {return d.properties.id==0?yLabelA:yLabelB;})
		.style("fill", "green")
		.style("stroke", "white")
		// .style("font-weight", "bold")
		// .style("font-size", "20px")
		.text(function (d) {return d.properties.id==0?"A":"B";})
	;
	
	// initial state: starting point is current end of route
	currentEnd = new toxi.geom.Vec2D(pointAx, pointAy);
	// console.log("current end: " + currentEnd);
});

function drawSegment(selected) {
	var active = (selected.attr("active") == "true") ? false : true;
	// console.log("active = " + selected.attr("active"));
	// console.log("new active = " + active);
	newOpacity = active ? ROUTE_OPACITY_ACTIVE : ROUTE_OPACITY_INACTIVE;
	// console.log("new opacity = " + newOpacity);
	selected.style("opacity", newOpacity);
	selected.attr("active", active);
	// add or remove selected part to/from the route
	var segLength = parseFloat(selected.attr("length"));
	if (active == true) {
		 route.push(currentEnd);
		 routeLength += segLength;
	} else {
		route.pop();
		routeLength -= segLength;
	}
	// console.log("current route: " + route);
	// console.log("current route length: " + routeLength);
	d3.select("#lengthTextfield").html("Route length: " + Math.round(routeLength) + " m");
	updateEndPoint(selected);
	
	// color route if complete
	if (isRouteComplete(selected)) {
		highlightlayer.selectAll("path")
		.style("stroke", ROUTE_COLOR_COMPLETE);
		d3.select("#submitButton").attr("disabled", null);
	} else {
		highlightlayer.selectAll("path")
		.style("stroke", ROUTE_COLOR);
		d3.select("#submitButton").attr("disabled", "disabled");
	}
} 

function updateEndPoint(segment) {
	var start = segment.node().getPointAtLength(0);
	var end = segment.node().getPointAtLength(segment.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	if (isIdentical(p0, currentEnd)) {
		currentEnd = p1;
	} else if (isIdentical(p1, currentEnd)) {
		currentEnd = p0;
	}
}

function isRouteComplete(segment) {
	var pointBx = d3.select("#p1").attr("cx");
	var pointBy = d3.select("#p1").attr("cy");
	var b = new toxi.geom.Vec2D(pointBx, pointBy);
	return isIdentical(b,currentEnd);
}

function isIdentical(p0, p1) {
	return p0.distanceTo(p1) < eps;
}

function isPartOfRoute(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	for (var i = 0; i < route.length-1; i++) {
		if (
			(isIdentical(route[i],p0) && isIdentical(route[i+1],p1)) 
		|| (isIdentical(route[i],p1) && isIdentical(route[i+1],p0))
		) {
			return true;
		}
	}
	return false;
}

function isValid(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	return isIdentical(p0,currentEnd) || isIdentical(p1,currentEnd);
}

function isSimple(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength());
	var p0 = new toxi.geom.Vec2D(start.x, start.y);
	var p1 = new toxi.geom.Vec2D(end.x, end.y);
	for (var i = 0; i < route.length-2; i++) {
		if ((isIdentical(route[i],p0) || isIdentical(route[i],p1))
			) {
			return false;
		}
	}
	return true;
}

function deleteRoute() {
	route = [];
	var pointAx = d3.select("#p0").attr("cx");
	var pointAy = d3.select("#p0").attr("cy");
	currentEnd = new toxi.geom.Vec2D(pointAx, pointAy);
	
	highlight = d3.select("#highlight").selectAll("*")
	.each(function(d) {
		var self = d3.select(this);
		self.attr("active", false)
		.style("stroke", ROUTE_COLOR)
		.style("opacity", ROUTE_OPACITY_INACTIVE)
		;
	});
	routeLength = 0;
	d3.select("#submitButton").attr("disabled", "disabled");
	d3.select("#lengthTextfield").html("Route length: 0 m");
}

function submitRoute() {
	console.log("final route length: " + routeLength);
}

