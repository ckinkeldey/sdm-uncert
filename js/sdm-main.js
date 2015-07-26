var scenarios = [ "explicit-color-1a.html", "explicit-color-m-1a.html",
                  "explicit-color-1b.html", "explicit-color-m-1b.html",
                  "explicit-color-2a.html", "explicit-color-m-2a.html",
                  "explicit-color-2b.html", "explicit-color-m-2b.html",
                  "explicit-symbol-1c.html", "explicit-symbol-m-1c.html",
                  "explicit-symbol-1d.html", "explicit-symbol-m-1d.html",
                  "explicit-symbol-2c.html", "explicit-symbol-m-2c.html",
                  "explicit-symbol-2d.html", "explicit-symbol-m-2d.html",
                  "explicit-texture-1e.html", "explicit-texture-m-1e.html", 
                  "explicit-texture-1f.html", "explicit-texture-m-1f.html", 
                  "explicit-texture-2e.html", "explicit-texture-m-2e.html",
                  "explicit-texture-2f.html", "explicit-texture-m-2f.html"
                  ];
if (random) {
	shuffle(scenarios);
}

var numNotBlocked = 0;
var userId = guid();//"user-" + new Date().getTime();
var i = 0;
$("#deleteButton").addClass("invisible");
$("#textInfo").addClass("invisible");
$(function() {
	$("#mainpage").load(scenarios[i++]);
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
		$("#mainpage").load("questionnaire.html");
		$("#mainpage").attr("userid", userId);
		$("#mainpage").attr("numnotblocked", numNotBlocked);
	}
}

function showResults() {
	$("#mainpage").load("sdm-end.html");
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

function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
	}
