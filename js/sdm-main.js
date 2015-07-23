var scenarios = [ "explicit-color.html", "explicit-color-1b.html", "explicit-color-2.html",
                  "explicit-color-m.html", "explicit-color-m-1b.html", "explicit-color-m-2.html",
                  "explicit-symbol.html", "explicit-symbol-1b.html", "explicit-symbol-2.html",
                  "explicit-symbol-m.html", "explicit-symbol-m-1b.html", "explicit-symbol-m-2.html",
                  "explicit-texture.html", "explicit-texture-1b.html", "explicit-texture-2.html", 
                  "explicit-texture-m.html",  "explicit-texture-m-1b.html",  "explicit-texture-m-2.html", 
                  ];
if (random) {
	shuffle(scenarios);
}
var i = 0;
$("#deleteButton").addClass("invisible");
$("#textInfo").addClass("invisible");
$(function() {
	$("#mainpage").load("sdm-start.html");
});

function next() {
	if (i < scenarios.length) {
		if (i > 0) {
			submitRoute();
		}
		$("#deleteButton").removeClass("invisible");
		$("#textInfo").removeClass("invisible");
		$("#mainpage").load(scenarios[i++]);
	} else {
		submitRoute();
		$("#deleteButton").addClass("invisible");
		$("#submitButton").addClass("invisible");
		$("#textInfo").addClass("invisible");
		$("#mainpage").load("sdm-end.html");
	}
}

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	while (0 !== currentIndex) {

		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}
