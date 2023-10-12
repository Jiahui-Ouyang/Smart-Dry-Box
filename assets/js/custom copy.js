// 1. Scroll To Top 
$(window).on('scroll', function () {
	if ($(this).scrollTop() > 300) {
		$('.return-to-top').fadeIn();
	} else {
		$('.return-to-top').fadeOut();
	}
});
$('.return-to-top').on('click', function () {
	$('html, body').animate({
		scrollTop: 0
	}, 1500);
	return false;
});

// Dry box script

// function getlinechart() {
//     const el = document.getElementById("chartdiagrambutton").style.display;
//     console.log("THIS IS", el);
// }
// Publish message as the topic "relay" which is sent to ESP8266 to turn off the relay

var relayoffsettings = {
	"url": "https://api.netpie.io/v2/device/message?topic=relay",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Basic YjVlNDhjOTctNDdjYi00MGJmLWEyOTctMTM4YmE2NzRlNDJiOkR6WFdHUnl0bzhTbUVoWGZLamE5dThxTXVNVjVuejZR",
		"Content-Type": "text/plain"
	},
	"data": "off",
};

// Publish message as the topic "relay" which is sent to ESP8266 to turn on the relay
var relayonsettings = {
	"url": "https://api.netpie.io/v2/device/message?topic=relay",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Basic YjVlNDhjOTctNDdjYi00MGJmLWEyOTctMTM4YmE2NzRlNDJiOkR6WFdHUnl0bzhTbUVoWGZLamE5dThxTXVNVjVuejZR",
		"Content-Type": "text/plain"
	},
	"data": "on",
};

// linechart data format for temperature in red and humidity in blue
let chartData = {
	labels: [],
	datasets: [
		{
			label: "Temperature",
			borderColor: "red",
			backgroundColor: "rgba(305, 0, 0, 0.1)",
			data: []
		},
		{
			label: "Humidity",
			borderColor: "blue",
			backgroundColor: "rgba(0, 0, 305, 0.1)",
			data: []
		}
	]
};

// Create the line chart
const ctx = document.getElementById('lineChart').getContext('2d');
const lineChart = new Chart(ctx, {
	type: 'line',
	data: chartData,
	options: {
		responsive: true,
		maintainAspectRatio: false
	},
	scales: {
		x: {
			title: {
				display: true,
				text: 'Time'
			}
		},
		y: {
			suggestedMin: 20,
			// the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
			suggestedMax: 80,
		}
	}
});

// Fetch variables from Netpie Shadow data
var settings = {
	"url": "https://api.netpie.io/v2/device/shadow/data",
	"method": "GET",
	"timeout": 0,
	"headers": {
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q"
	},
};

// variables that are for saving the data from the fetchdata
var savedshadowdata;
var RHvalue;
var autovalue;
var RHsetvalue;
function doAjax() {
	$.ajax(settings).done(function (response) {
		savedshadowdata = response["data"];
		console.log(response["data"]);
		var RHvalue = savedshadowdata["humidity"];
		var RHgaguevalue = RHvalue / 100;
		var tempvalue = savedshadowdata["temperature"];
		// Display maual button status from Netpie Shadow data
		var manualvalue = savedshadowdata["manual"];
		if (manualvalue == 'on') {
			document.getElementById("maualbutton").checked = true;
		}
		else if (manualvalue == 'off') {
			document.getElementById("maualbutton").checked = false;
		}
		// Display auto button status from Netpie Shadow data
		var autovalue = savedshadowdata["auto"];
		// Set "auto on" status and disable for manual mode
		if (autovalue == 'on') {
			document.getElementById("autobutton").checked = true;
			document.getElementById("maualbutton").disabled = true;
			// document.getElementById(".maualbutton").style.backgroundColor = "grey";
		}
		// Set "auto off" status and enable for manual mode
		else if (autovalue == 'off') {
			document.getElementById("autobutton").checked = false;
			document.getElementById("maualbutton").disabled = false;
		}
		// Display RHsetting value to slider from Netpie Shadow data
		var RHsetvalue = `${response["data"]["RHset"]}`;
		document.getElementById("RHsetdisplayed").innerText = RHsetvalue;
		document.getElementById("RHset").value = RHsetvalue;
		const sliderEl = document.querySelector("#RHset");
		sliderEl.style.background = `linear-gradient(to right, #f50 ${RHsetvalue}%, #ccc ${RHsetvalue}%)`;
		// Display Machine (relay) status from Netpie Shadow data
		var relayvalue = `${response["data"]["relay"]}`;
		if (relayvalue == 'on') {
			document.getElementById("displaystatus").innerText = "Machine ON !";
			document.getElementById("displaystatus").style.color = "red";
		}
		else if (relayvalue == 'off') {
			document.getElementById("displaystatus").innerText = "Machine OFF !";
			document.getElementById("displaystatus").style.color = "green";
		}
		compareRH(autovalue, RHvalue, RHsetvalue);
		// Display Temp and RH from Netpie Shadow data
		const addtemp = `  ${tempvalue} &#176;C `;
		const addRH = ` ${RHvalue}% `;
		// setRHGaugeValue(gaugeRHElement, RHgaguevalue);
		const displayedtemp = document.getElementById("labeltemp");
		displayedtemp.innerHTML = addtemp;
		const displayedRH = document.getElementById("labelRH");
		displayedRH.innerHTML = addRH;
	},
	);
}
// setTimeout(doAjax, 2000);
setInterval(doAjax, 2500);

// Fetch temp and RH data from server using jQuery's AJAX method
// function fetchDataAndUpdateChart() {
// 	$.ajax({
// 		url: 'https://api.netpie.io/v2/device/shadow/data', // Replace with the API URL to fetch data from the server
// 		method: 'GET',
// 		headers: {
// 			"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q"
// 		},
// 		success: function (response) {
// 			// Assuming the JSON response is like: {"data": {"temperature": 30, "humidity": 60}}
// 			var temperature = response["data"]["temperature"];
// 			var humidity = response["data"]["humidity"];
// 			// Update the chart data with the fetched data
// 			const timestamp = new Date().toLocaleTimeString();
// 			chartData.labels.push(timestamp);
// 			chartData.datasets[0].data.push(temperature);
// 			chartData.datasets[1].data.push(humidity);
// 			// Limit the number of data points shown on the chart (e.g., last 10 data points)
// 			if (chartData.labels.length > 10) {
// 				chartData.labels.shift();
// 				chartData.datasets[0].data.shift();
// 				chartData.datasets[1].data.shift();
// 			}
// 			// Update the chart
// 			lineChart.update();
// 		}
// 	});
// }
// // Fetch and update chart data every 10 second
// setInterval(fetchDataAndUpdateChart, 10000);

var hourdigramsettings = {
	"url": "https://api.netpie.io/v2/feed/api/v1/datapoints/query",
	"method": "POST",
	"timeout": 0,
	"headers": {
		"Content-Type": "application/json",
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q"
	},
	"data": JSON.stringify({
		"start_relative": {
			"value": 1,
			"unit": "hours"
		},
		"metrics": [
			{
				"name": "b5e48c97-47cb-40bf-a297-138ba674e42b",
				"tags": {
					"attr": [
						"temperature",
						"humidity"
					]
				},
				"group_by": [
					{
						"name": "tag",
						"tags": [
							"attr"
						]
					}
				],
				"aggregators": [
					{
						"name": "avg",
						"sampling": {
							"value": 1,
							"unit": "minutes"
						}
					}
				]
			}
		]
	}),
};

$.ajax(hourdigramsettings).done(function (hourdigramresponse) {
	var RHhourvalues = hourdigramresponse["queries"]["0"]["results"]["0"]["values"];
	var temphourvalues = hourdigramresponse["queries"]["0"]["results"]["1"]["values"];
	var array1 = [];
	var array2 = [];
	var arraytimestamp = [];
	const options = { day: 'numeric', hour: 'numeric', min: 'numeric' };
	for (var i = 0; i < RHhourvalues.length; i++) {
		// var split = .push(RHhourvalues[i]);
		array1.push(RHhourvalues[i]["1"]);
		chartData.datasets[1].data.push(RHhourvalues[i]["1"]);

		const converttime = new Date(RHhourvalues[i]["0"]);
		var hourtime = converttime.getHours();
		var mintime = converttime.getMinutes();
		var realtime = hourtime + ':' + mintime;
		// // const hourtime = new Intl.DateTimeFormat(options).format(RHhourvalues[i]["0"]);
		// console.log("Relatime IS", realtime);
		arraytimestamp.push(RHhourvalues[i]["0"]);
		chartData.labels.push(realtime);
		// chartData.labels.push(RHhourvalues[i]["0"]);
	}
	for (var i = 0; i < temphourvalues.length; i++) {
		// var split = .push(RHhourvalues[i]);
		chartData.datasets[0].data.push(temphourvalues[i]["1"]);
		array2.push(temphourvalues[i]["1"]);
	}
	// console.log("HOUR timestamp:", arraytimestamp);
	// console.log("HOUR RH:", array1);
	// // console.log("HOUR DIAGRAM RH:", RHhourvalues);
	// console.log("HOUR TEMP:", array2);

	// Update the chart
	lineChart.update();
});


// For auto mode on, it needs to have comparsion between RH value from sensor and RH setting value
function compareRH(autovalue, RHvalue, RHsetvalue) {
	// RHsettext = JSON.parse(RHsetvalue);
	// Publish the RHsetting value from slider to Netpie Shadow data; If RHsetting value <= RH, turn on relay published to Netpie
	if (autovalue == "on") {
		if (parseInt(RHsetvalue) <= parseInt(RHvalue)) {
			var RHsetvaluesettings = {
				"url": "https://api.netpie.io/v2/device/shadow/data",
				"method": "PUT",
				"timeout": 0,
				"headers": {
					"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"data": {
						"RHset": RHsetvalue,
						"relay": "on"
					}
				}),
			};
			$.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
			});
			$.ajax(relayonsettings).done(function (relayonresponse) {
			});
		}
		// If not, publish the RHsetting value and relay "off" status to Netpie Shadow data
		else {
			var RHsetvaluesettings = {
				"url": "https://api.netpie.io/v2/device/shadow/data",
				"method": "PUT",
				"timeout": 0,
				"headers": {
					"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
					"Content-Type": "application/json"
				},
				"data": JSON.stringify({
					"data": {
						"RHset": RHsetvalue,
						"relay": "off"
					}
				}),
			};
			$.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
			});
			$.ajax(relayoffsettings).done(function (relayoffresponse) {
			});
		}
	}
	else {
		// Only publish the RHsetting value to Netpie Shadow data
		var RHsetvaluesettings = {
			"url": "https://api.netpie.io/v2/device/shadow/data",
			"method": "PUT",
			"timeout": 0,
			"headers": {
				"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
				"Content-Type": "application/json"
			},
			"data": JSON.stringify({
				"data": {
					"RHset": RHsetvalue
				}
			}),
		};
		$.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
		});
	}
}

// Publish manual "on" and relay "on" together to Netpie Shadow data
var manualonsettings = {
	"url": "https://api.netpie.io/v2/device/shadow/data",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
		"Content-Type": "application/json"
	},
	"data": JSON.stringify({
		"data": {
			"manual": "on",
			"relay": "on"
		}
	}),
};

// Publish manual "off" and relay "off" together to Netpie Shadow data
var manualoffsettings = {
	"url": "https://api.netpie.io/v2/device/shadow/data",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
		"Content-Type": "application/json"
	},
	"data": JSON.stringify({
		"data": {
			"manual": "off",
			"relay": "off"
		}
	}),
};

// Publish auto "on" to Netpie Shadow data
var autoonsettings = {
	"url": "https://api.netpie.io/v2/device/shadow/data",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
		"Content-Type": "application/json"
	},
	"data": JSON.stringify({
		"data": {
			"auto": "on"
		}
	}),
};
// Publish auto "off" to Netpie Shadow data
var autooffsettings = {
	"url": "https://api.netpie.io/v2/device/shadow/data",
	"method": "PUT",
	"timeout": 0,
	"headers": {
		"Authorization": "Device b5e48c97-47cb-40bf-a297-138ba674e42b:DzXWGRyto8SmEhXfKja9u8qMuMV5nz6Q",
		"Content-Type": "application/json"
	},
	"data": JSON.stringify({
		"data": {
			"auto": "off"
		}
	}),
};

// Publish manual mode (on/off) data to Nitepie
function togglemanual() {
	var togglevalue = document.getElementById("maualbutton");
	if (togglevalue.checked == true) {
		$.ajax(manualonsettings).done(function (manualonresponse) {
		});
		$.ajax(relayonsettings).done(function (relayonresponse) {
		});
		console.log("TURN ON manual NOW");
	}
	else {
		$.ajax(manualoffsettings).done(function (manualoffresponse) {
		});
		$.ajax(relayoffsettings).done(function (relayoffresponse) {
		});
		console.log("TURN OFF manual NOW");
	}
}

// Publish auto mode (on/off) data to Nitepie
function toggleauto() {
	var autostatus = document.getElementById("autobutton");
	if (autostatus.checked == true) {
		$.ajax(autoonsettings).done(function (autoonresponse) {
		});
		// Check whether turn on/off the relay base on RH value from sensor and RH setting value 
		compareRH(autovalue, RHvalue, RHsetvalue);
		console.log("Auto ON NOW");
		document.getElementById("maualbutton").disabled = true;
	}
	else {
		$.ajax(autooffsettings).done(function (autooffresponse) {
		});
		// Turn of the relay after turning off auto mode
		$.ajax(relayoffsettings).done(function (relayoffresponse) {
		});
		console.log("Auto OFF NOW");
		document.getElementById("maualbutton").disabled = false;
	}
}

// response from RH setting value then to slider
const sliderEl = document.querySelector("#RHset");
const RHdisplayedvalue = document.querySelector("#RHsetdisplayed");
sliderEl.addEventListener("input", (event) => {
	const tempSliderValue = event.target.value;
	RHdisplayedvalue.textContent = tempSliderValue;
	const progress = (tempSliderValue / sliderEl.max) * 100;
	sliderEl.style.background = `linear-gradient(to right, #f50 ${progress}%, #ccc ${progress}%)`;
})

// display the RH setting value after clicking
function getRHsetting() {
	var RHsettingvalue = document.getElementById("RHset").value;
	var RHdisplayedvalue = document.getElementById("RHsetdisplayed");
	console.log("RHsetting value is: ", RHsettingvalue);
	var RHvalue = savedshadowdata["humidity"];
	console.log("RH value is: ", RHvalue);
	var autobuttonvalue = savedshadowdata["auto"];
	console.log("Auto button value is: ", autobuttonvalue);
	// RHdisplayedvalue.innerText = RHsettingvalue;
	RHsettext = JSON.parse(RHsettingvalue);

	compareRH(autobuttonvalue, RHvalue, RHsettext);
}

function showdiagram() {
	// document.getElementById("chartContainer").className = "collapsing";
	$('#chartContainer').toggleClass('hidden');
}

document.getElementById("chartContainer").style.display = "none";

var coll = document.getElementsByClassName("collapsiblehour");
var count;

for (count = 0; count < coll.length; count++) {
	coll[count].addEventListener("click", function () {
		this.classList.toggle("active");
		var content = document.getElementById("chartContainer");
		if (content.style.display === "block") {
			content.style.display = "none";
			// document.getElementById("chartContainer").style.display = "none";
		} else {
			content.style.display = "block";
		}
	});
}