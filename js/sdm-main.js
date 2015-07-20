	var scenarios = ["explicit-color.html", "explicit-color-m.html",
	                 "explicit-symbol.html", "explicit-symbol-m.html",
	                 "explicit-texture.html", "explicit-texture-m.html"
	                 ];

	var i = 0;
	$("#deleteButton").addClass("invisible");
	$("#textInfo").addClass("invisible");
	$(function(){
	      $("#mainpage").load("sdm-start.html");
	});
		
	function next() {
		if (i < scenarios.length) {
			$("#deleteButton").removeClass("invisible");
			$("#textInfo").removeClass("invisible");
			$("#mainpage").load(scenarios[i++]); 
		} else {
			$("#deleteButton").addClass("invisible");
			$("#submitButton").addClass("invisible");
			$("#textInfo").addClass("invisible");
			$("#mainpage").load("sdm-end.html"); 
		}
	}
	
