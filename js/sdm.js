var ROAD_COLOR = "grey";
var ROAD_COLOR_BLOCKED = "#a00";
var ROAD_NODES_COLOR = "grey";
var ROAD_NODES_STROKE = "grey";
var ROAD_NODES_SIZE = "4px";
var ROAD_SELECTION_NODES_SIZE = "20px";

var ROUTE_COLOR = "yellow";
var ROUTE_COLOR_COMPLETE = "green";
	
var ROUTE_OPACITY_ACTIVE = 1;
var ROUTE_OPACITY_SELECTABLE = 0.5;
var ROUTE_OPACITY_INACTIVE = 0;
var ROUTE_STROKE_WIDTH = 8;
var ROUTE_SELECT_WIDTH = 20;

var HIGHLIGHT_STROKE_WIDTH = 30;
var HIGHLIGHT_STROKE_COLOR = "yellow";

var START_END_POINTS_COLOR = "yellow";
var START_END_POINTS_STROKE_COLOR = "#555";
var START_END_POINTS_STROKE_WIDTH = "1px";

var WITHOUT = 0;
var EXPLICIT_COLOR = 1;
var EXPLICIT_COLOR_M = 2;
var EXPLICIT_SYMBOL = 3;
var EXPLICIT_SYMBOL_M = 4;
var EXPLICIT_TEXTURE = 5;
var EXPLICIT_TEXTURE_M = 6;
var IMPLICIT_COLOR = 10;
var IMPLICIT_SYMBOLS = 11;

var SYMBOL_SIZE = 20;
var SYMBOL_COLOR = "rgb(5,112,176)";
var SYMBOL_STROKE_COLOR = "white";

var ROUTE_0 = [5,32,33,34,83,84,67,62,63];
var ROUTE_1 = [7,51,52,53,57,41,36,19,21,69,40,23,27];

var route0 = [];
var route1 = [];
if (typeof routes !== 'undefined' && routes) {
	route0 = ROUTE_0;
	route1 = ROUTE_1;
}

var SYMBOL_RISK = "images/warning_red_white_new.svg";
var SYMBOL_BLOCKAGE = "images/no-entry-road-sign.png";

var pointsABpath = "data/"+pointsABname+".topojson";
var switchAB = false;//Math.random() >= 0.5;
	
var minLength = 61.5;
var eps = 10;
var route = [];
var routeLength = 0;
var routeRisk = 1;
var probNotBlocked = 1;
var routeComplete = false;

var time;
function startTime() {
	time = new Date().getTime();
//	alert("start time: " + startTime)
}

var animCounter = 0;

var leftMB = false;

// point at end of selected route
var currentEnd;

var rasterX = 0,
    rasterY = 0; // Offset (px) for positioning raster in 	<div>

var projection = d3.geo.mercator()
.center(center)
.translate(translate)
.scale(scale)
;

var path = d3.geo.path().projection(projection);

var svg = d3.select("#map").append("svg").attr("width", width).attr("height", height);

var rasterlayer = svg.append("g").attr("id", "background");
var highlightlayer = svg.append("g").attr("id", "highlight");
var roadlayer = svg.append("g").attr("id", "roads");
var symbollayer = svg.append("g").attr("id", "symbols");
var pointlayer = svg.append("g").attr("id", "points");
var roadnodeslayer = svg.append("g").attr("id", "roadnodes");

var selectionlayer = svg.append("g").attr("id", "selection");
var selectionnodeslayer = svg.append("g").attr("id", "selectionnodes");

rasterlayer.append("image")
	.attr("class", "noselect")
	.attr("width", width + "px")
	.attr("height", height + "px")
	.attr("x", rasterX + "px")
	.attr("y", rasterY + "px")
	.attr("id", "map")
	.attr("xlink:href", backgroundPath);

var roads, roadNodes, highlight, points;

d3.json("data/"+ roadfile + ".topojson", function(error, roaddata) {
	if (error)
		throw error;

	// http://colorbrewer2.org/?type=sequential&scheme=OrRd&n=4
	var colorRed = d3.scale.ordinal()
		.domain([4,3,2,1])
		.range(['rgb(254,240,217)','rgb(253,204,138)','rgb(252,141,89)','rgb(215,48,31)']);
		
	var colorRedDark = d3.scale.ordinal()
		.domain([4,3,2,1])
		.range(['rgb(252,174,145)','rgb(251,106,74)','rgb(222,45,38)','rgb(165,15,21)']);
		
	var colorGrey = d3.scale.ordinal()
	.domain([4,3,2,1])
	.range(["#eee", "#bbb", "#777", "#d333"]);
	
	// http://colorbrewer2.org/?type=sequential&scheme=PuBu&n=4
	var colorBlue =  d3.scale.ordinal()
	.domain([4,3,2,1])
	.range(['rgb(241,238,246)','rgb(189,201,225)','rgb(116,169,207)','rgb(5,112,176)']);
	
	// http://colorbrewer2.org/?type=sequential&scheme=PuBu&n=5
	var colorBlueDark =  d3.scale.ordinal()
	.domain([4,3,2,1])
	.range(['rgb(189,201,225)','rgb(116,169,207)','rgb(43,140,190)','rgb(4,90,141)']);

	function setDarkRedColor() {
		d3.select(this).style('stroke', function(d) {
			return colorRedDark(d.properties.risk);
		});
	}

	function setRedColor() {
		d3.select(this).style('stroke', function(d) {
			var id = d.properties.id;
			if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
				return ROAD_COLOR;
			}
			return colorRed(d.properties.risk);
		});
	}
	function setBlueColor() {
		d3.select(this).style('stroke', function(d) {
			var id = d.properties.id;
			if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
				return ROAD_COLOR;
			}
			return colorBlue(d.properties.risk);
		});
	}
	
	function setDarkBlueColor() {
		d3.select(this).style('stroke', function(d) {
			return colorBlueDark(d.properties.risk);
		});
	}
	
	function changeBlocked(roads) {
		roads
		.transition()
		.duration(250)
		.style("stroke",
				function(d) {
					var id = d.properties.id;
					if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
						return ROAD_COLOR;
					} 
					var risk = d.properties.risk;
//					return Math.random() < (5 - risk) / 5 ? ROAD_COLOR_BLOCKED
//							: ROAD_COLOR;
					var segLength = parseFloat(d.properties.length);
					var segRisk = parseFloat(risks[d.properties.risk]);
					var segProbNotBlocked = Math.pow(1 - segRisk, segLength / minLength);
					return Math.random() > segProbNotBlocked ? ROAD_COLOR_BLOCKED
							: ROAD_COLOR;
				})
//					.style("stroke", ROAD_COLOR)
			.style("opacity", function(d) {
				var id = d.properties.id;
				if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
					return "1";
				} else {
//							var risk = d.properties.risk;
//							return Math.random() < (5 - risk) / 5 ? 1 : 0;
					return "1";
				}
			})
				;
	}
	
	function drawSymbol() {
		var self = d3.select(this);
		var symbols = symbollayer.selectAll("rect")
		.data(roaddata)
		.enter()
		.append("rect")
		.attr("width", getSymbolSize)
		.attr("height", getSymbolSize)
		.attr("x", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var x0 = projection(coords[0][0])[0];
				var x1 = projection(coords[1][0])[0];
				var x2 = projection(coords[1][1])[0];
				return (x0+x1+x2)/3.-getSymbolSize(d)/2;
			} else {
				var x0 = projection(coords[0])[0];
				var x1 = projection(coords[coords.length-1])[0];
			}				
			return (x0+x1-getSymbolSize(d))/2.;
		})
		.attr("y", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var y0 = projection(coords[0][0])[1];
				var y1 = projection(coords[1][0])[1];
				var y2 = projection(coords[1][1])[1];
				return (y0+y1+y2)/3.-getSymbolSize(d)/2;
			} else {
				var y0 = projection(coords[0])[1];
				var y1 = projection(coords[coords.length-1])[1];
				return (y0+y1-getSymbolSize(d))/2.;
			}
		})
		.style("fill", SYMBOL_COLOR)
		.style("stroke", SYMBOL_STROKE_COLOR)
		.style("opacity", function(d) {
			return 1;//visualization == EXPLICIT_SYMBOL_M ? getSymbolOpacity(d) : 1;
		});
	}
	
	function drawCircleSymbol() {
		var self = d3.select(this);
		var symbols = symbollayer.selectAll("circle")
		.data(roaddata)
		.enter()
		.append("circle")
		.attr("r", getCircleRadius)
		.attr("cx", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var x0 = projection(coords[0][0])[0];
				var x1 = projection(coords[1][0])[0];
				var x2 = projection(coords[1][1])[0];
				return (x0+x1+x2)/3.;
			} else {
				var x0 = projection(coords[0])[0];
				var x1 = projection(coords[coords.length-1])[0];
			}				
			return (x0+x1)/2.;
		})
		.attr("cy", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var y0 = projection(coords[0][0])[1];
				var y1 = projection(coords[1][0])[1];
				var y2 = projection(coords[1][1])[1];
				return (y0+y1+y2)/3.;
			} else {
				var y0 = projection(coords[0])[1];
				var y1 = projection(coords[coords.length-1])[1];
				return (y0+y1)/2.;
			}
		})
		.style("fill", SYMBOL_COLOR)
		.style("stroke", SYMBOL_STROKE_COLOR)
		.style("stroke-size", 1)
		.style("opacity", function(d) {
			return 1;//visualization == EXPLICIT_SYMBOL_M ? getSymbolOpacity(d) : 1;
		});
	}
	
	function drawIcon() {
		var self = d3.select(this);
		var symbols = symbollayer.selectAll("image")
		.data(roaddata)
		.enter()
		.append("image")
		.attr("width", getSymbolSize)
		.attr("height", getSymbolSize)
		.attr("x", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var x0 = projection(coords[0][0])[0];
				var x1 = projection(coords[1][0])[0];
				var x2 = projection(coords[1][1])[0];
				return (x0+x1+x2)/3.-getSymbolSize(d)/2;
			} else {
				var x0 = projection(coords[0])[0];
				var x1 = projection(coords[coords.length-1])[0];
			}				
			return (x0+x1-getSymbolSize(d))/2.;
		})
		.attr("y", function(d) {
			var coords = d.geometry.coordinates;
			if (coords[0][0].constructor === Array) {
				var y0 = projection(coords[0][0])[1];
				var y1 = projection(coords[1][0])[1];
				var y2 = projection(coords[1][1])[1];
				return (y0+y1+y2)/3.-getSymbolSize(d)/2;
			} else {
				var y0 = projection(coords[0])[1];
				var y1 = projection(coords[coords.length-1])[1];
				return (y0+y1-getSymbolSize(d))/2.;
			}
		})
		.attr("xlink:href", function(d) {
			return visualization == EXPLICIT_SYMBOL_M ? SYMBOL_RISK : SYMBOL_BLOCKAGE;
		})
		.style("opacity", function(d) {
			return 1;//visualization == EXPLICIT_SYMBOL_M ? getSymbolOpacity(d) : 1;
		});
	}
	
	// radius = sqrt(A/PI)
	function getCircleRadius(d) {
		var factor = 5-d.properties.risk;
		var radius = Math.sqrt(factor/Math.PI) * 8;
		return Math.round(radius);
	}
	
	// width = sqrt(2*A)
	function getSymbolSize(d) {
		var factor = 5-d.properties.risk;
		var symbolSize = visualization == EXPLICIT_SYMBOL || visualization == EXPLICIT_SYMBOL_M ? Math.sqrt(2*factor) * 8 : SYMBOL_SIZE;
		return Math.round(symbolSize);
	}
	
	function getSymbolOpacity(d) {
		return risks[d.properties.risk] + 0.135;
	}
	
	function changeSymbol() {
		symbollayer.selectAll("image")
			.transition()
			.duration(250)
			.style("opacity", function(d) {
			var id = d.properties.id;
//			if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
//				return "0";
//			}
//			var segLength = parseFloat(d.properties.length);
//			var segRisk = parseFloat(risks[d.properties.risk]);
//			var segProbNotBlocked = Math.pow(1 - segRisk, segLength / minLength);
//			return Math.random() > segProbNotBlocked ? "1" : "0";
			
		});			
	}
	
	function drawLinePattern(d) {
		d3.select(this).style("stroke-dasharray", function(d) {
			var dash = (Math.pow(2,5-d.properties.risk));
			return [dash, dash];
		});
	}
	
	var sketchyLineFunction = d3.svg.line()
	.x(function(d) {
		return d[0];
	})
	.y(function(d) {
		return d[1];
	})
	.interpolate('basis');
	
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
		.style("stroke", function(d) {
			var id = d.properties.id;
			return HIGHLIGHT_STROKE_COLOR;
//			if (routes && route0.indexOf(id) > -1) {
//				return "#55a";
//			} else if (routes && route1.indexOf(id) > -1){
//				return "#5a5";
//			}
		})
		.style("stroke-width", HIGHLIGHT_STROKE_WIDTH)
		.style("stroke-linecap", "round")
		.style("opacity", function(d) {
			var id = d.properties.id;
//			if (routes && route0.indexOf(id) == -1 && route1.indexOf(id) == -1) {
				return "0";
//			} else {
//				return 1;
//			}
		})
		;
		
	// layer for the roads
	if (visualization == WITHOUT) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.each(function(d) {d3.select(this).style('stroke', "grey");});
	} else if (visualization == EXPLICIT_COLOR) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.each(setBlueColor);
	} else if (visualization == EXPLICIT_COLOR_M) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.each(setRedColor);
	} else if (visualization == IMPLICIT_COLOR) {
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			// .style("stroke", function() {return Math.random() <=0.5 ? "#fef0d9" : "#d7301f";})
			;
			setInterval(function() {changeBlocked(roads);}, 500);
	} else if (visualization == EXPLICIT_SYMBOL){
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.style("stroke", "grey")
			.style("opacity", 1)
			.each(drawCircleSymbol);
	} else if (visualization == EXPLICIT_SYMBOL_M){
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			// .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.style("stroke", "grey")
			.style("opacity", 1)
			.each(drawIcon);
	} else if (visualization == EXPLICIT_TEXTURE){
		roads = roadlayer.selectAll("path.bg")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "bg" + d.properties.id;})
		.style("stroke", SYMBOL_COLOR)
		.style("stroke-width", ROUTE_STROKE_WIDTH)
		;
		
		roadlayer.selectAll("path.dashing")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id;})
		.style("stroke", "white")
		.style("stroke-width", ROUTE_STROKE_WIDTH)
		.style("stroke-linecap", "butt")
		.each(drawLinePattern)
		;
		
	} else if (visualization == EXPLICIT_TEXTURE_M){
		roads = roadlayer.selectAll("path.bg")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "bg" + d.properties.id;})
		.style("stroke", "white")
		.style("stroke-width", ROUTE_STROKE_WIDTH)
		;
		
		addPoints(roaddata);

		for (var a = 0; a < 50; a++) {
			symbollayer.selectAll("path.sketchy.g" + a)
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", function(d) {
				var risk = Math.pow(2,d.properties.risk);
				if (a % risk == 0) {
					sketchyCoords = computeSketchyCoords(d.geometry.coordinates, 4);
					return sketchyLineFunction(sketchyCoords);
				}
				return "";
			})
			.attr("id", function(d) {return "sketchy" + d.properties.id;})
			.style("stroke-width", 1)
	//		.style("stroke-linecap", "round")
			.style("stroke", "red")
			.style("stroke-dasharray", (4,4))
			.style("fill", "none")
			.style("opacity", function(d) {
//				var risk = 5-d.properties.risk;
				return 1-(d.properties.risk/8);
			})
			;
		}
		
		for (var a = 0; a < 3; a++) {
			symbollayer.selectAll("path.sketchy" + a)
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", function(d) {
//				console.log(d.properties.risk);
				var risk = Math.pow(2,d.properties.risk);
				if (a % risk == 0) {
					return "";
				}
				sketchyCoords = computeSketchyCoords(d.geometry.coordinates, 5);
				return sketchyLineFunction(sketchyCoords);
			})
			 .attr("id", function(d) {return "road" + d.properties.id;})
			.style("stroke-width", 1)
	//		.style("stroke-linecap", "round")
			.style("stroke", "white")
			.style("stroke-width", 1)
			.style("stroke-dasharray", (5,5))
			.style("fill", "none")
			.style("opacity", 1)
			;
		}
	
	} else if (visualization == IMPLICIT_SYMBOLS){
		// animated symbols
		roads = roadlayer.selectAll("path")
			.data(roaddata)
			.enter()
			.append("path")
			.attr("d", path)
			.style("stroke-width", ROUTE_STROKE_WIDTH)
			.style("stroke-linecap", "round")
			.style("stroke", "grey")
			.style("opacity", 1)
			.each(drawIcon)
			;
			setInterval(changeSymbol, 500);
	}
	
	function addPoints(pointdata) {
		for (var i = 0; i < pointdata.length; i++) {
			if (pointdata[i].geometry.coordinates[0][0].length > 1) {
				for (var j = 0; j < pointdata[i].geometry.coordinates[0].length;j++) {
					var first = pointdata[i].geometry.coordinates[j][0];
					var last = pointdata[i].geometry.coordinates[j][1];
//					pointdata[i].geometry.coordinates[j] = createCoordsMulti(first, last);
				}
			} //if (pointdata[i].geometry.coordinates[0][0].length == 1) {
			else {
				var first = pointdata[i].geometry.coordinates[0];
				var last = pointdata[i].geometry.coordinates[1];
				pointdata[i].geometry.coordinates = createCoords(first, last);
			}
		}
//		pointdata.geometry.coordinates = newData;
	}
	
	function createCoordsMulti(first, last) {
		var newCoords = createCoords(first, last);
		var newPoints = [];
		for (var i = 0; i < newCoords.length-1; i++) {
			newPoints[i] = [newCoords[i], newCoords[i+1]];
		}
		return newPoints;
	}
	
	function createCoords(first, last) {
		var dx = last[0] - first[0];
		var dy = last[1] - first[1];
		var length = Math.sqrt(dx*dx+dy*dy);
		var newCoords = [];
		var numPoints = Math.round(5 * length / 0.609);
		for (var k = 0; k < numPoints; k++) {
			var newX = first[0] + k * dx/numPoints;
			var newY = first[1] + k * dy/numPoints;
			newCoords.push([newX, newY]);
		}
		return newCoords;
	}
	
	
	function computeSketchyCoords(coords, risk) {
		var sketchy = [];
		if (coords[0][0] instanceof Array) {
			var sketchyCoords = [];
			for (var i = 0; i < coords.length; i++) {
				var sketchy = computeSketchyCoords(coords[i], risk);
				sketchyCoords.push(sketchy[0]);
				if (i == coords.length-1) {
					sketchyCoords.push(sketchy[1]);
				}
			}
			return sketchyCoords;
		}
		for (var i = 0; i < coords.length; i++) {
			var projected = projection(coords[i]);
			var jitter = risk/4 * ROUTE_STROKE_WIDTH;
			var x = projected[0] + jitter * (Math.random() - .5);
			var y = projected[1] + jitter * (Math.random() - .5);
			sketchy.push([x,y]);
		}
		return sketchy;
	}
	
	// invisible layer for selection events
	selection = selectionlayer.selectAll("path")
		.data(roaddata)
		.enter()
		.append("path")
		.attr("d", path)
		.attr("id", function(d) {return "road" + d.properties.id;})
		.style("stroke", ROUTE_COLOR)
		.style("stroke-width", ROUTE_SELECT_WIDTH)
		.style("stroke-linecap", "butt")
		.style("opacity", 0)
		;
	
	selection.on("mouseover", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_highlight");
		if (leftMB && isValid(selected) && isSimple(selected) && !routeComplete) {
			drawSegment(selected);
		} else if (isValid(selected) && isSimple(selected) && !routeComplete) {
			selected.style("opacity", ROUTE_OPACITY_SELECTABLE);
		}
//		console.log("part of route: " + isPartOfRoute(selected));
	});	
	
	selection.on("mouseout", function() {
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id+"_highlight");
		if (selected.style("opacity") == ROUTE_OPACITY_SELECTABLE && isValid(selected)) {
			selected.style("opacity", selected.attr("active")=="true" ? ROUTE_OPACITY_ACTIVE : ROUTE_OPACITY_INACTIVE);
		}
	});	
	
	selection.on("mousedown", function() {
		leftMB = true;
		var self = d3.select(this);
		var id = self.attr("id");
		var selected = d3.select("#" + id +"_highlight");
		if (isValid(selected) && isSimple(selected) && !routeComplete) {
			drawSegment(selected);
		}
	});
	
	selection.on("mouseup", function() {
		leftMB = false;
	});
	
});

d3.json("data/"+ roadnodesfile + ".topojson", function(error, roadnodesdata) {
	if (error)
		throw error;
		
	var roadnodesdata = topojson.feature(roadnodesdata, roadnodesdata.objects[roadnodesfile]).features;
		
	// road nodes as layover
	var roadnodes = roadnodeslayer.selectAll("path")
			.data(roadnodesdata)
			.enter()
			.append("path")
			.attr("d", path)
			.attr("id", function(d) {return "roadnode" + d.properties.id;})
			.style("fill", ROAD_NODES_COLOR)
			.style("stroke", ROAD_NODES_STROKE)
			.style("stroke-width", ROAD_NODES_SIZE)
//			.style("stroke-linecap", "square")
			.style("opacity", 1)
			;
	
//	var selectionnodes = selectionnodeslayer.selectAll("path")
//		.data(roadnodesdata)
//		.enter()
//		.append("path")
//		.attr("d", path)
//		.attr("id", function(d) {return "selectionnode" + d.properties.id;})
//		.style("fill", "red")
//		.style("stroke", "red")
//		.style("stroke-width", ROAD_SELECTION_NODES_SIZE)
//		.style("stroke-linecap", "square")
//		.style("opacity", .25)
//		;
	
	var selectionnodes = selectionnodeslayer.selectAll("circle")
		.data(roadnodesdata)
		.enter()
		.append("circle")
		.attr("id", function(d) {return "selectionnode" + d.properties.id;})
		.attr("cx", function(d) {return projection(d.geometry.coordinates)[0];})
		.attr("cy",  function(d) {return projection(d.geometry.coordinates)[1];})
		.attr("r", 10)
		.style("fill", "red")
		.style("stroke", "red")
		.style("stroke-width", "1px")
		.style("opacity", 0)
	;
	 
	selectionnodes.on("mouseover", function() {
		 var self = d3.select(this);
		 var point = projection(self.datum().geometry.coordinates);
		 var thisPoint = new toxi.geom.Vec2D(point[0], point[1]);
		 var currentEndPoint = new toxi.geom.Vec2D(parseFloat(currentEnd.x), parseFloat(currentEnd.y));
		 
		 if (leftMB && selected && isValid(selected) && isSimple(selected) && !routeComplete) {
				drawSegment(selected);
		 } else if (isIdentical(thisPoint, currentEndPoint)) {
			 var pointBefore = new toxi.geom.Vec2D(parseFloat(route[route.length-2].x), parseFloat(route[route.length-2].y));
			 var selected = getEdge(thisPoint, pointBefore);
		 } else {
			 var selected = getEdge(thisPoint, currentEndPoint);
		 }
		 if (selected && isValid(selected) && isSimple(selected) && !routeComplete) {
				selected.style("opacity", ROUTE_OPACITY_SELECTABLE);
		}
	 });
	
	selectionnodes.on("mouseout", function() {
		var self = d3.select(this);
		 var point = projection(self.datum().geometry.coordinates);
		 var thisPoint = new toxi.geom.Vec2D(point[0], point[1]);
		var currentEndPoint = new toxi.geom.Vec2D(parseFloat(currentEnd.x), parseFloat(currentEnd.y));
		if (isIdentical(thisPoint, currentEndPoint)) {
			 var pointBefore = new toxi.geom.Vec2D(parseFloat(route[route.length-2].x), parseFloat(route[route.length-2].y));
			 var selected = getEdge(thisPoint, pointBefore);
		 } else {
			 var selected = getEdge(thisPoint, currentEndPoint);
		 }
		if (selected && selected.style("opacity") == ROUTE_OPACITY_SELECTABLE && isValid(selected)) {
			selected.style("opacity", selected.attr("active")=="true" ? ROUTE_OPACITY_ACTIVE : ROUTE_OPACITY_INACTIVE);
		}
	});
	
	selectionnodes.on("mousedown", function() {
		leftMB = true;
		var self = d3.select(this);
		 var point = projection(self.datum().geometry.coordinates);
		 var thisPoint = new toxi.geom.Vec2D(point[0], point[1]);
		var currentEndPoint = new toxi.geom.Vec2D(parseFloat(currentEnd.x), parseFloat(currentEnd.y));
		if (isIdentical(thisPoint, currentEndPoint)) {
			 var pointBefore = new toxi.geom.Vec2D(parseFloat(route[route.length-2].x), parseFloat(route[route.length-2].y));
			 var selected = getEdge(thisPoint, pointBefore);
		 } else {
			 var selected = getEdge(thisPoint, currentEndPoint);
		 }
		if (selected && isValid(selected) && isSimple(selected) && !routeComplete) {
			drawSegment(selected);
		}
	});
	
	selectionnodes.on("mouseup", function() {
		leftMB = false;
	});
			
});

d3.json(pointsABpath, function(error, pointdata) {
	if (error)
		throw error;

	var abdata = topojson.feature(pointdata, pointdata.objects[pointsABname]).features;
		
	// points A, B
	points = pointlayer.selectAll("circle")
		.data(abdata)
		.enter()
		.append("circle")
		.attr("id", function(d) {
			return switchAB ? "p" + (1-parseFloat(d.properties.id)) : "p" + d.properties.id;
		})
		.attr("cx", function(d) {return projection(d.geometry.coordinates)[0];})
		.attr("cy",  function(d) {return projection(d.geometry.coordinates)[1];})
		.attr("r", "12px")
		.style("fill", START_END_POINTS_COLOR)
		.style("stroke", START_END_POINTS_STROKE_COLOR)
		.style("stroke-width", START_END_POINTS_STROKE_WIDTH)
	;
	
	var pointAx = d3.select("#p0").attr("cx");
	var pointAy = d3.select("#p0").attr("cy");
	var pointBx = d3.select("#p1").attr("cx");
	var pointBy = d3.select("#p1").attr("cy");

	var labelAx = parseFloat(pointAx) + A_B_LABEL_POSITION[switchAB?2:0]; 
	var labelAy = parseFloat(pointAy) + A_B_LABEL_POSITION[switchAB?3:1];
	var labelBx = parseFloat(pointBx) + A_B_LABEL_POSITION[switchAB?0:2]; 
	var labelBy = parseFloat(pointBy) + A_B_LABEL_POSITION[switchAB?1:3];
	
	pointlayer.selectAll("labels")
		.data(abdata)
		.enter()
		.append("svg:text")
		.attr("class", "noselect")
		.attr("x", function (d) {return d.properties.id==0?labelAx:labelBx;})
		.attr("y", function (d) {return d.properties.id==0?labelAy:labelBy;})
		.style("fill", START_END_POINTS_COLOR)
		.style("stroke", START_END_POINTS_STROKE_COLOR)
		.style("stroke-width", START_END_POINTS_STROKE_WIDTH)
		 .style("font-weight", "bold")
		 .style("font-size", "40px")
		.text(function (d) {
				return d.properties.id==0?"A":"B";
			})
	;
	
	// initial state: starting point is current end of route
	currentEnd = new toxi.geom.Vec2D(pointAx, pointAy);
	route.push(currentEnd);
	// console.log("current end: " + currentEnd);
});

function drawSegment(selected) {
	var active = (selected.attr("active") == "true") ? false : true;
	newOpacity = active ? ROUTE_OPACITY_ACTIVE : ROUTE_OPACITY_INACTIVE;
	// console.log("new opacity = " + newOpacity);
	selected.style("opacity", newOpacity);
	selected.attr("active", active);
	var segLength = parseFloat(selected.attr("length"));
	var segRisk = parseFloat(risks[selected.attr("risk")]);
	if (active == true) {
		updateEndPoint(selected);
		 route.push(currentEnd);
		 routeLength += segLength;
		 var segProbNotBlocked = Math.pow(1 - segRisk, segLength / minLength);
		 probNotBlocked *= segProbNotBlocked;
//		 console.log("Length: " + segLength + " -> " + Math.pow(1 - segRisk, segLength / minLength))
		 routeRisk = 1 - probNotBlocked;
	} else {
		updateEndPoint(selected);
		route.pop();
		routeLength -= segLength;
		var segProbNotBlocked = Math.pow(1 - segRisk, segLength / minLength);
		probNotBlocked /= segProbNotBlocked;
		routeRisk = 1 - probNotBlocked;
	}
//	 console.log("current route: " + route);
	// console.log("current route length: " + routeLength);
	d3.select("#lengthTextfield").html("Route length: " + Math.round(routeLength) + " m");
	d3.select("#riskTextfield").html("Not blocked: " + Math.round(100*probNotBlocked ) + "%");
	
	// color route if complete
	if (isRouteComplete(selected)) {
		routeComplete = true;
		highlightlayer.selectAll("path")
		.style("stroke", ROUTE_COLOR_COMPLETE);
		d3.select("#submitButton").attr("disabled", null);
	} else {
		routeComplete = false;
		highlightlayer.selectAll("path")
		.style("stroke", ROUTE_COLOR);
		d3.select("#submitButton").attr("disabled", "disabled");
	}
} 

function updateEndPoint(segment) {
	var start = segment.node().getPointAtLength(0);
	var end = segment.node().getPointAtLength(segment.node().getTotalLength());
	var pStart = new toxi.geom.Vec2D(start.x, start.y);
	var pEnd = new toxi.geom.Vec2D(end.x, end.y);
	if (isIdentical(pStart, currentEnd)) {
		currentEnd = pEnd;
	} else if (isIdentical(pEnd, currentEnd)) {
		currentEnd = pStart;
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

function getEdge(point0, point1) {
	if (isIdentical(point0, point1)) {
		return null;
	}
	var edges = highlight.data();
	for (var i = 0; i < edges.length; i++) {
		if (isEdge(point0, point1, edges[i])) {
			var id = "#road" + edges[i].properties.id + "_highlight";
			return d3.select(id);
		}
	}
	return null;
}

function highlightEdge(point0, point1) {
	if (isIdentical(point0, point1)) {
		return;
	}
	highlight
	.each(function(d) {
		var self = d3.select(this);
		self.style("opacity", function(d) {
			return isEdge(point0, point1, d) ? ROUTE_OPACITY_SELECTABLE : self.style("opacity");
		});
	});
}

function notHighlightEdge(point0, point1) {
	if (isIdentical(point0, point1)) {
		return;
	}
	highlight
	.each(function(d) {
		var self = d3.select(this);
		self.style("opacity", function(d) {
			return isEdge(point0, point1, d) ? ROUTE_OPACITY_INACTIVE : self.style("opacity");
		});
	});
}

function isEdge(p0, p1, edge) {
	var start = projection(edge.geometry.coordinates[0]);
	var end = projection(edge.geometry.coordinates[edge.geometry.coordinates.length-1]);
	var startPoint = new toxi.geom.Vec2D(start[0], start[1]);
	var endPoint = new toxi.geom.Vec2D(end[0], end[1]);
	return ((isIdentical(p0, startPoint) && isIdentical(endPoint, p1))
			|| (isIdentical(p1, startPoint) && isIdentical(endPoint, p0))); 
}
	

function isValid(path) {
	var start = path.node().getPointAtLength(0);
	var end = path.node().getPointAtLength(path.node().getTotalLength()-0.01);
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
	route = [];
	route.push(currentEnd);
	
	highlight = d3.select("#highlight").selectAll("*")
	.each(function(d) {
		var self = d3.select(this);
		self.attr("active", false)
		.style("stroke", ROUTE_COLOR)
		.style("opacity", ROUTE_OPACITY_INACTIVE)
		;
	});
	routeComplete = false;
	routeLength = 0;
	routeRisk = 0;
	probNotBlocked = 1;
	d3.select("#submitButton").attr("disabled", "disabled");
	d3.select("#lengthTextfield").html("Route length: 0 m");
	d3.select("#riskTextfield").html("Not blocked:");
}

function submitRoute() {
	var alertString = "";
	var overalltime = (new Date().getTime() - time)/1000;
	alertString += "route length: " + routeLength + "\n";
	alertString += "time: " + overalltime + " s.\n";
	var probability = Math.round(100*probNotBlocked)/100;
	console.log("overall prob for not blocked: " + probability);
	var displayString = "p(not blocked): " + probability;
	var decision = Math.random() > probNotBlocked ? 
			displayString + " -> blocked!" : displayString + " -> not blocked!";
	alertString += decision + "\n";
//	var routeline = d3.svg.line()
//    .x(function(d,i) { return projection.invert([route[i].x, route[i].y])[0]; })
//    .y(function(d,i) { return projection.invert([route[i].x, route[i].y])[1]; });
//	alertString += "route: " + routeline(route) + "\n";
//	var json_lines = JSON.stringify(routeline(route));
//	console.log("json: " + json_lines);

//	alert(alertString);
	
	var geoJSON = getGeoJSON(route);
	console.log(geoJSON);
	
	var mydata = "amt_id=2&timestamp=4634&pctime="+overalltime+"&scenario_id=0" +
	"&coords="+geoJSON+"&total_risk=0&distance="+routeLength+"&outcome=0";
	
//	jQuery.ajax({
//    type: "GET",
//    url: '../storeresult.php',
//    dataType: 'text',
//    data: mydata,
//
//    success: function (obj, textstatus) {
//                  if( !('error' in obj) ) {
//                      console.log(obj.result);
//                  }
//                  else {
//                      console.log(obj.error);
//                  }
//           },
//    error:function (xhr, ajaxOptions, thrownError){
//                //On error, we alert user
//                alert(thrownError);
//            }
//	});
	
	function getGeoJSON(route) {
		var geojson = "{\n\"type\": \"FeatureCollection\",\n\"features\": [\n{\n\"type\": \"Feature\",\n\"properties\": {},\n"
				+"\"geometry\": {\n"
			    +"\"type\": \"LineString\",\n"
			    +"\"coordinates\": [\n";
			                        
		for (var i = 0; i < route.length; i++) {
			var worldCoords = projection.invert([route[i].x, route[i].y]);
			geojson += "[" + worldCoords[0] + "," + worldCoords[1] + "],\n";
		}
		geojson += "]}}]}";
		return geojson;
	}
	
}

