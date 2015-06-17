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

var rasterlayer = svg.append("g");

rasterlayer.append("image").attr("width", width + "px").attr("height", height + "px").attr("x", rasterX + "px").attr("y", rasterY + "px").attr("xlink:href", backgroundPath);

var vectorlayer = svg.append("g");

d3.json("data/roads.topojson", function(error, vectordata) {
	if (error)
		throw error;

	var ROAD_ACTIVE = 1;
	var ROAD_SELECTABLE = 0.5;
	var ROAD_INACTIVE = 0;

	var roaddata = topojson.feature(vectordata, vectordata.objects.roads).features;
	var i = 0;
	var road = vectorlayer.selectAll("path")
		.data(roaddata).enter()
		.append("path")
		.attr("d", path)
		.attr("id", function() {return i++;	})
		.attr("canclick", false)
		.attr("active", false)
		.style("opacity", ROAD_INACTIVE);

	road.on("mousedown", function() {
		var self = d3.select(this);
		console.log("id = " + self.attr("id"));
		// if (self.attr("canclick") == "false") {return;}
		
		var active = (self.attr("active") == "true") ? false : true;
		console.log("active = " + self.attr("active"));
		console.log("new active = " + active);
		newOpacity = active ? ROAD_ACTIVE : ROAD_INACTIVE;
		console.log("new opacity = " + newOpacity);
		self.style("opacity", newOpacity);
		self.attr("active", active);
	});
	
	road.on("mouseover", function() {
		var self = d3.select(this);
		if (self.style("opacity") == ROAD_INACTIVE) {
			self.style("opacity", ROAD_SELECTABLE);
		}
	});	
	
	road.on("mouseout", function() {
		var self = d3.select(this);
		if (self.style("opacity") == ROAD_SELECTABLE) {
			self.style("opacity", ROAD_INACTIVE);
		}
	});	
});

/*vectorlayer.
 on("click", function() {
 var active   = vectorlayer.active ? false : true,
 newOpacity = active ? 0.5 : 1;
 vectorlayer.style("opacity", newOpacity);
 vectorlayer.active = active;
 //console.log({"x": d3.event.x, "y": d3.event.y});
 });
 */

