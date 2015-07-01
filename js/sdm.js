var ROUTE_COLOR = "yellow";
var ROUTE_COLOR_COMPLETE = "green";
	
var ROUTE_OPACITY_ACTIVE = 1;
var ROUTE_OPACITY_SELECTABLE = 0.5;
var ROUTE_OPACITY_INACTIVE = 0;

var width = 873;
var height = 499;

var backgroundPath = "./data/map.png";
var roadfile = "vector_risk_length";

var eps = 10;
var route = [];
var routeLength = 0;
var routeRisk = 0;

var startTime = new Date().getTime();

var risks = [0, 0.875, 0.625, 0.375, 0.125];

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
var symbollayer = svg.append("g").attr("id", "symbols");
var pointlayer = svg.append("g").attr("id", "points");
var selectionlayer = svg.append("g").attr("id", "selection");
var roadnodeslayer = svg.append("g").attr("id", "roadnodes");

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

	var colorRed = d3.scale.ordinal()
		.domain([4,3,2,1])
		.range(["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);
		
	var colorGrey = d3.scale.ordinal()
	.domain([4,3,2,1])
	.range(["#eee", "#bbb", "#777", "#d333"]);
	
	var colorBlue =  d3.scale.ordinal()
	.domain([4,3,2,1])
	.range(['rgb(239,243,255)','rgb(189,215,231)','rgb(107,174,214)','rgb(33,113,181)']);


	function setRedColor() {
		d3.select(this)
		.style('stroke', function(d) {
			return colorRed(d.properties.risk);
		});
	}
	function setBlueColor() {
		d3.select(this)
		.style('stroke', function(d) {
			return colorBlue(d.properties.risk);
		});
	}	
	
	function changeBlocked(roads) {
		roads
			.transition()
			.duration(500)
			.style("stroke", function(d) {
			var risk = d.properties.risk;
			return Math.random() < risks[risk] ? "white" : "#222";
		});
	}
	
	function drawSymbol() {
		var self = d3.select(this);
		if (visualization == 2) {
			self.attr("risk", function(d) {
				return d.properties.risk;
			});
			symbolSize = Math.sqrt((5-self.attr("risk"))*100);
		} else {
			symbolSize = 20;
		}
		// d3.select("#roads")
		// .append("g")
		// .attr("id", "symbols");
		
		var symbols = symbollayer.selectAll("image")
		.data(roaddata)
		.enter()
		.append("image")
		.attr("width", symbolSize)
		.attr("height", symbolSize)
		.attr("x", function(d) {
			// var x0 = d.node().getPointAtLength(0).x;
			// var x1 = d.node().getPointAtLength(self.node().getTotalLength()).x;
			var x0 = projection(d.geometry.coordinates[0])[0];
			var x1 = projection(d.geometry.coordinates[1])[0];
			if (isNaN(x0) || isNaN(x1)) {
				return 0;
			}
			return (x0+x1-symbolSize)/2.;
		})
		.attr("y", function(d) {
			// var y0 = self.node().getPointAtLength(0).y;
			// var y1 = self.node().getPointAtLength(self.node().getTotalLength()).y;
			var y0 = projection(d.geometry.coordinates[0])[1];
			var y1 = projection(d.geometry.coordinates[1])[1];
			if (isNaN(y0) || isNaN(y1)) {
				return 0;
			}
			return (y0+y1-symbolSize)/2.;
		})
		.attr("xlink:href", function(d) {
			return visualization == 2 ? "data/warning.png" : "data/fire_symbol.png";
		});
	}
	
	function changeSymbol() {
		symbollayer.selectAll("#symbols")
			// .transition()
			.style("opacity", function(d) {
			var risk = d.properties.risk;
			return Math.random();// < risks[risk] ? "0" : "1";
		});			
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
		.attr("risk", function(d) {return d.properties.risk;})
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
			.each(setBlueColor);
	} else if (visualization == 1) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "square")
			.each(setRedColor);
	} else if (visualization == 3) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "butt")
			// .style("stroke", function() {return Math.random() <=0.5 ? "#fef0d9" : "#d7301f";})
			;
			setInterval(function() {changeBlocked(roads);}, 500);
	} else if (visualization == 2){
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-linecap", "square")
			.style("stroke", "grey")
			.style("opacity", 1)
			.each(drawSymbol);
	} else {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			.style("stroke-linecap", "square")
			.style("stroke", "grey")
			.style("opacity", 1)
			.each(drawSymbol)
			;
			setInterval(changeSymbol, 500);
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
		console.log("part of route: " + isPartOfRoute(selected));
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
	var roadnodes = roadnodeslayer.selectAll("path")
			.data(roadnodesdata)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", function(d) {return "roadnode" + d.properties.id;})
			.style("fill", "white")
			.style("stroke", "white")
			.style("stroke-width", "5px")
			.style("stroke-linecap", "square")
			;
			
	roadnodes.on("mouseover", function() {
		var self = d3.select(this);
		highlightEdge(highlight, self[0][0].getPointAtLength(0), currentEnd);
		// if (selected) {
			// var selected1 = d3.select("#road1_highlight");
			// selected.style("opacity", ROUTE_OPACITY_SELECTABLE);
		// }
	});	
			
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
		.attr("cx", function(d) {return projection(d.geometry.coordinates)[0];})
		.attr("cy",  function(d) {return projection(d.geometry.coordinates)[1];})
		.attr("r", "12px")
		.style("fill", "green")
		.style("stroke", "white")
	;
	
	var pointAx = d3.select("#p0").attr("cx");
	var pointAy = d3.select("#p0").attr("cy");
	var pointBx = d3.select("#p1").attr("cx");
	var pointBy = d3.select("#p1").attr("cy");
	var labelAx = pointAx - 30; 
	var labelAy = pointAy - 10;
	var labelBx = pointBx - 30; 
	var labelBy = pointBy - 5;
	
	pointlayer.selectAll("labels")
		.data(abdata)
		.enter()
		.append("svg:text")
		.attr("x", function (d) {return d.properties.id==0?labelAx:labelBx;})
		.attr("y", function (d) {return d.properties.id==0?labelAy:labelBy;})
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
	var segRisk = parseFloat(risks[selected.attr("risk")]);
	if (active == true) {
		 route.push(currentEnd);
		 routeLength += segLength;
		 routeRisk += segRisk * segLength;
	} else {
		route.pop();
		routeLength -= segLength;
		routeRisk -= segRisk * segLength;
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

function highlightEdge(edges, point0, point1) {
	var p0 = new toxi.geom.Vec2D(point0.x, point0.y);
	var p1 = new toxi.geom.Vec2D(point1.x, point1.y);
	if (isIdentical(p0, p1)) {
		return null;
	}
	edges
	.each(function(d) {
		var self = d3.select(this);
		self.style("opacity", function(d) {
			return isEdge(p0, p1, d) ? ROUTE_OPACITY_SELECTABLE : ROUTE_OPACITY_INACTIVE;
		});
	});
	// for (var i = 0; i < edges[0].length; i++) {
		// var start = edges[0][i].getPointAtLength(0);
		// var end = edges[0][i].getPointAtLength(edges[0][i].getTotalLength());
		// var startPoint = new toxi.geom.Vec2D(point0.x, point0.y);
		// var endPoint = new toxi.geom.Vec2D(point1.x, point1.y);
		// if ((isIdentical(p0, startPoint) && isIdentical(endPoint, p1))
			// || (isIdentical(p1, startPoint) && isIdentical(endPoint, p0))) {
			// return edges[0][i];
		// }
	// }
	// return null;
}

function isEdge(p0, p1, edge) {
	var start = projection(edge.geometry.coordinates[0]);
	var end = projection(edge.geometry.coordinates[0]);
	var startPoint = new toxi.geom.Vec2D(start[0], start[1]);
	var endPoint = new toxi.geom.Vec2D(end[0], end[1]);
	return ((isIdentical(p0, startPoint) && isIdentical(endPoint, p1))
			|| (isIdentical(p1, startPoint) && isIdentical(endPoint, p0))); 
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
	routeRisk = 0;
	d3.select("#submitButton").attr("disabled", "disabled");
	d3.select("#lengthTextfield").html("Route length: 0 m");
}

function submitRoute() {
	var overalltime = (new Date().getTime() - startTime)/1000;
	console.log("final route length: " + routeLength);
	console.log("time: " + overalltime + " s.");
	console.log("mean risk for route: " + routeRisk / routeLength);
	var routeline = d3.svg.line()
    .x(function(d,i) { return projection.invert([route[i].x, route[i].y])[0]; })
    .y(function(d,i) { return projection.invert([route[i].x, route[i].y])[1]; });
	console.log("route: " + routeline(route));
	var json_lines = JSON.stringify(routeline(route));
	console.log("json: " + json_lines);
	
	var mydata = "amt_id=2&timestamp=4634&pctime="+overalltime+"&scenario_id=0" +
	"&coords=1,2,3,4,6,7,7&total_risk=0&distance="+routeLength+"&outcome=0";
	
	jQuery.ajax({
    type: "GET",
    url: '../storeresult.php',
    dataType: 'text',
    data: mydata,

    success: function (obj, textstatus) {
                  if( !('error' in obj) ) {
                      console.log(obj.result);
                  }
                  else {
                      console.log(obj.error);
                  }
           },
    error:function (xhr, ajaxOptions, thrownError){
                //On error, we alert user
                alert(thrownError);
            }
});
	
}

