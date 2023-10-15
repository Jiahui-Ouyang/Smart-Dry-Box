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
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"relay\": \"0\" }",
};

// Publish message as the topic "relay" which is sent to ESP8266 to turn on the relay
var relayonsettings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"relay\": \"1\" }",
};

var alertturnsettings = {
    "url": "https://notify-api.line.me/api/notify",
    "method": "POST",

    "headers": {
        "Authorization": "Bearer 1x97KYH8PaSrwQRRzPVk2F61xMsUPNesfoqaEHwZ4hk",
        "Content-Type": "application/x-www-form-urlencoded",
    }
};

// hourlineChart data format for temperature in red and humidity in blue
// let hourchartData = {
// 	labels: [],
// 	datasets: [
// 		{
// 			label: "Temperature",
// 			borderColor: "red",
// 			backgroundColor: "rgba(305, 0, 0, 0.1)",
// 			data: []
// 		},
// 		{
// 			label: "Humidity",
// 			borderColor: "blue",
// 			backgroundColor: "rgba(0, 0, 305, 0.1)",
// 			data: []
// 		}
// 	]
// };

// // Create the line hour chart
// const ctx = document.getElementById('hourlineChart').getContext('2d');
// const hourlineChart = new Chart(ctx, {
// 	type: 'line',
// 	data: hourchartData,
// 	options: {
// 		responsive: true,
// 		maintainAspectRatio: false,
// 		plugins: {
// 			tooltip: {
// 				mode: 'index',
// 				intersect: false
// 			},
// 			title: {
// 				display: true,
// 				text: 'Hour Line Chart'
// 			}
// 		}
// 	},
// 	scales: {
// 		x: {
// 			title: {
// 				display: true,
// 				text: 'Time'
// 			}
// 		},
// 		y: {
// 			Min: 20,
// 			// the data maximum used for determining the ticks is Math.max(dataMax, suggestedMax)
// 			Max: 100,
// 		}
// 	}
// });

// Fetch variables from Firebase into FirebaseIOT array Realtime database
var settings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "GET",
    "timeout": 0,
};

// variables that are for saving the data from the fetchdata
var saveddata;
var RHvalue;
var autovalue;
var RHsetvalue;
function doAjax() {
    $.ajax(settings).done(function (response) {
        saveddata = response;
        // console.log(response["data"]);
        var RHvalue = response["humidity"];
        var tempvalue = response["temperature"];
        // Display maual button status from Firebase into FirebaseIOT array Realtime database
        var manualvalue = response["manual"];
        if (manualvalue == '1') {
            document.getElementById("maualbutton").checked = true;
        }
        else if (manualvalue == '0') {
            document.getElementById("maualbutton").checked = false;
        }
        // Display auto button status from Firebase into FirebaseIOT array Realtime database
        var autovalue = response["auto"];
        // Set "auto on" status and disable for manual mode
        if (autovalue == '1') {
            document.getElementById("autobutton").checked = true;
            document.getElementById("maualbutton").disabled = true;
            // document.getElementById(".maualbutton").style.backgroundColor = "grey";
            if (RHvalue <= 50) {
                // console.log("Alert function is able");
                document.getElementById("alertswitch").disabled = false;
            }
            else {
                document.getElementById("alertswitch").setAttribute("disabled", true);
                // console.log("Alert function is disable");
            }
        }
        // Set "auto off" status and enable for manual mode
        else if (autovalue == '0') {
            document.getElementById("autobutton").checked = false;
            document.getElementById("maualbutton").disabled = false;
            // console.log("Alert function is off");
            document.getElementById("alertswitch").setAttribute("disabled", true);
            document.getElementById("alertswitch").checked = false;
        }
        // Display RHsetting value to slider from Firebase into FirebaseIOT array Realtime database
        var RHsetvalue = `${response["RHset"]}`;
        document.getElementById("RHsetdisplayed").innerText = RHsetvalue;
        document.getElementById("RHset").value = RHsetvalue;
        const sliderEl = document.querySelector("#RHset");
        sliderEl.style.background = `linear-gradient(to right, #f50 ${RHsetvalue}%, #ccc ${RHsetvalue}%)`;
        // Display Machine (relay) status from Firebase into FirebaseIOT array Realtime database
        var relayvalue = `${response["relay"]}`;
        if (relayvalue == '1') {
            document.getElementById("displaystatus").innerText = "Machine ON !";
            document.getElementById("displaystatus").style.color = "red";
        }
        else if (relayvalue == '0') {
            document.getElementById("displaystatus").innerText = "Machine OFF !";
            document.getElementById("displaystatus").style.color = "green";
        }
        compareRH(autovalue, RHvalue, RHsetvalue);
        // Display Temp and RH from Firebase into FirebaseIOT array Realtime database
        const addtemp = `  ${tempvalue} &#176;C `;
        const addRH = ` ${RHvalue}% `;
        // setRHGaugeValue(gaugeRHElement, RHgaguevalue);
        const displayedtemp = document.getElementById("labeltemp");
        displayedtemp.innerHTML = addtemp;
        const displayedRH = document.getElementById("labelRH");
        displayedRH.innerHTML = addRH;

    }
    );
}
// setTimeout(doAjax, 2000);
setInterval(doAjax, 2500);

// Send the danger message to Line notify when the RH is more than 55% (that is suitable to store camera lens)
// if (document.getElementById("alertswitch").checked = true && RHvalue >=55) {
//     console.log("SEND LINE");
//     $.ajax(alertturnsettings).done(function (alertturnresponse) {
//         // console.log("RH High!!", alertturnresponse);
//         document.getElementById("alertswitch").checked = false;
//     });
// }
function mincheckingalert() {
    $.ajax(settings).done(function (response) {
        var RHvalue = response["humidity"];
        if (document.getElementById("alertswitch").checked = true && RHvalue >= 55) {
            console.log("SEND LINE");
            var win = window.open('https://script.google.com/macros/s/AKfycbxlLiS2E1TydhquNupmmymIkXcv4TFCyMibycYQDqKO_hV8ppGjQBSvY2lRBo6DUfKA/exec?lntoken=1x97KYH8PaSrwQRRzPVk2F61xMsUPNesfoqaEHwZ4hk&message=RH+Danger&messagefrom=Notification', '_blank');
            win.focus();
            document.getElementById("alertswitch").checked = false;
        }
    })
}
setTimeout(mincheckingalert, 30000);

// // Fetch temp and RH data from server using jQuery's AJAX method
// function fetchDataAndUpdateChart() {
//     $.ajax({
//         url: 'https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json', // Replace with the API URL to fetch data from the server
//         method: 'GET',
//         success: function (response) {
//             // Assuming the JSON response is like: {"data": {"temperature": 30, "humidity": 60}}
//             var temperature = response["temperature"];
//             var humidity = response["humidity"];
//             // Update the chart data with the fetched data
//             const timestamp = new Date().toLocaleTimeString();
//             chartData.labels.push(timestamp);
//             chartData.datasets[0].data.push(temperature);
//             chartData.datasets[1].data.push(humidity);
//             // Limit the number of data points shown on the chart (e.g., last 10 data points)
//             if (chartData.labels.length > 10) {
//                 chartData.labels.shift();
//                 chartData.datasets[0].data.shift();
//                 chartData.datasets[1].data.shift();
//             }
//             // Update the chart
//             lineChart.update();
//         }
//     });
// }
// // Fetch and update chart data every 10 second
// setInterval(fetchDataAndUpdateChart, 10000);

var hourdigramsettings = {
    "url": 'https://smart-dry-box-default-rtdb.firebaseio.com/DHT11.json', // Replace with the API URL to fetch data from the server
    "method": 'GET',
    "timeout": 0
};


$.ajax(hourdigramsettings).done(function (hourdigramresponse) {
    var RHhourvalues = Object.values(hourdigramresponse)[0]["Hum"];
    var temphourvalues = Object.values(hourdigramresponse)[0]["Temp"];
    var timestampvalues = Object.values(hourdigramresponse)[0]["Timestamp"]
    var array1 = [];
    var array2 = [];
    var arraytimestamp = [];
    console.log("DHT Data with timestamp from Firebase is:", hourdigramresponse);
    // for (var i = 0; i < RHhourvalues.length; i++) {
    //     // var split = .push(RHhourvalues[i]);
    //     array1.push(RHhourvalues[i]["1"]);
    //     // hourchartData.datasets[1].data.push(RHhourvalues[i]["1"]);

    //     const converttime = new Date(RHhourvalues[i]["0"]);
    //     var hourtime = converttime.getHours();
    //     var mintime = converttime.getMinutes();
    //     var realtime = hourtime + ':' + mintime;
    //     const hourtime = new Intl.DateTimeFormat(options).format(RHhourvalues[i]["0"]);
    //     console.log("Relatime IS", realtime);
    //     arraytimestamp.push(RHhourvalues[i]["0"]);
    //     // hourchartData.labels.push(realtime);
    //     // hourchartData.labels.push(RHhourvalues[i]["0"]);
    // }
    // for (var i = 0; i < temphourvalues.length; i++) {
    //     // var split = .push(RHhourvalues[i]);
    //     // hourchartData.datasets[0].data.push(temphourvalues[i]["1"]);
    //     array2.push(temphourvalues[i]["1"]);
    // }
    // console.log("HOUR timestamp:", arraytimestamp);
    // console.log("HOUR RH:", array1);
    // // console.log("HOUR DIAGRAM RH:", RHhourvalues);
    // console.log("HOUR TEMP:", array2);

    // Update the chart
    // hourlineChart.update();
});


// For auto mode on, it needs to have comparsion between RH value from sensor and RH setting value
function compareRH(autovalue, RHvalue, RHsetvalue) {
    // RHsettext = JSON.parse(RHsetvalue);
    // Publish the RHsetting value from slider to Firebase into FirebaseIOT array Realtime database; If RHsetting value <= RH, turn on relay published to Firebase Realtime database
    if (autovalue == "1") {
        if (parseInt(RHsetvalue) <= parseInt(RHvalue)) {
            var RHsetvaluesettings = {
                "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
                "method": "PATCH",
                "timeout": 0,
                "headers": {
                    "Content-Type": "text/plain"
                },
                "data": "{\"RHset\": " + RHsetvalue + ",\"relay\": \"1\"}",
            };
            $.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
            });
            $.ajax(relayonsettings).done(function (relayonresponse) {
            });
        }
        // If not, publish the RHsetting value and relay "off" status to Firebase into FirebaseIOT array Realtime database
        else {
            var RHsetvaluesettings = {
                "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
                "method": "PATCH",
                "timeout": 0,
                "headers": {
                    "Content-Type": "text/plain"
                },
                "data": "{\"RHset\": " + RHsetvalue + ",\"relay\": \"0\"}",
            };
            $.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
            });
            $.ajax(relayoffsettings).done(function (relayoffresponse) {
            });
        }
    }
    else {
        // Only publish the RHsetting value to Firebase into FirebaseIOT array Realtime database
        var RHsetvaluesettings = {
            "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
            "method": "PATCH",
            "timeout": 0,
            "headers": {
                "Content-Type": "text/plain"
            },
            "data": "{ \"RHset\": " + RHsetvalue + "}",
        };
        $.ajax(RHsetvaluesettings).done(function (RHsettingresponse) {
        });
    }
}

function alertturn() {

}

// Publish manual "on" and relay "on" together to Firebase into FirebaseIOT array Realtime database
var manualonsettings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"manual\": \"1\" ,\"relay\":\"1\" }",
};

// Publish manual "off" and relay "off" together to Firebase into FirebaseIOT array Realtime database
var manualoffsettings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"manual\": \"0\" ,\"relay\":\"0\" }",
};

// Publish auto "on" to Firebase into FirebaseIOT array Realtime database
var autoonsettings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"auto\": \"1\" }",
};
// Publish auto "off" to Firebase into FirebaseIOT array Realtime database
var autooffsettings = {
    "url": "https://smart-dry-box-default-rtdb.firebaseio.com/FirebaseIOT.json",
    "method": "PATCH",
    "timeout": 0,
    "headers": {
        "Content-Type": "text/plain"
    },
    "data": "{ \"auto\": \"0\" }",
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
    // var RHdisplayedvalue = document.getElementById("RHsetdisplayed");
    console.log("RHsetting value is: ", RHsettingvalue);

    var RHvalue = saveddata["humidity"];
    console.log("RH value is: ", RHvalue);
    var autobuttonvalue = saveddata["auto"];
    console.log("Auto button value is: ", autobuttonvalue);
    // RHdisplayedvalue.innerText = RHsettingvalue;
    RHsettext = JSON.parse(RHsettingvalue);

    compareRH(autobuttonvalue, RHvalue, RHsettext);
}

function showdiagram() {
    // document.getElementById("chartContainer").className = "collapsing";
    $('#chartContainer').toggleClass('hidden');
}

// document.getElementById("hourchartContainer").style.display = "none";

// var coll = document.getElementsByClassName("collapsiblehour");
// var count;

// for (count = 0; count < coll.length; count++) {
//     coll[count].addEventListener("click", function () {
//         this.classList.toggle("active");
//         var content = document.getElementById("hourchartContainer");
//         if (content.style.display === "block") {
//             content.style.display = "none";
//             // document.getElementById("chartContainer").style.display = "none";
//         } else {
//             content.style.display = "block";
//         }
//     });
// }

// document.getElementById("daychartContainer").style.display = "none";

// var collapsed = document.getElementsByClassName("collapsibleday");

// for (count = 0; count < collapsed.length; count++) {
//     collapsed[count].addEventListener("click", function () {
//         this.classList.toggle("active");
//         var content = document.getElementById("daychartContainer");
//         if (content.style.display === "block") {
//             content.style.display = "none";
//             // document.getElementById("chartContainer").style.display = "none";
//         } else {
//             content.style.display = "block";
//         }
//     });
// }

// document.getElementById("alertswitch").setAttribute("disabled", true);
// // document.getElementById("alertswitch").disabled = false;
