
// TODO: resolve asynch timing issues with calls to google API...
// examples...map works intermittently, relying on geocodes return
var firstTime = true;

$(document).ready(()=>{

  //First Name
// Add a change listener to the Toggle button which is actually a checkbox.
// hide or show the appropriate div depending on the checked status
// Map -- show map, hide list of buttons....may need to add listeners to markers in order to navigate to detail view for locations
// List -- show buttons....add listeners for buttons to navigate to detail view for locations

  $("#list-map-toggle").change(function() {
    console.log( "#list-map-toggle changed" );
    if ($(this).is(':checked')) {   // map
      // $(".location-buttons").hide();
      localStorage.setItem('showMap',true);//store the value
    } else {                        // list
      localStorage.setItem('showMap',false);//store the value
      // $(".location-buttons").show();
    };

    //to read the value from local storage
    var showMap = localStorage.getItem('showMap');
    $("#locations-map").toggle();

    // if (!showMap){
    //   $("#locations-map").hide();
    // } else {
    //   $("#locations-map").show();
    // };
  });



// To load up Google Maps in javascript versus src tag in HTML..
  var googMapURL = `https://maps.googleapis.com/maps/api/js?key=${googleMapsAPIKey}&callback=initMap`;

  //AJAX returns a 'promise'...we can use the done property to execute the code we want to run when the promise has been fulfilled
  var getGoogleMap = $.ajax({
      type: 'GET',
      url: googMapURL,
      dataType: 'jsonp',
      jsonpCallback: 'initMap',
      async: false, // this is by default false, so not need to mention
      crossDomain: true // tell the browser to allow cross domain calls.
  });  // ajax call to load googleMap

  getGoogleMap.done(buildPage);

// Use the express server to get locations for the user.
// Our demo is single user only
// TODO: Add capability to use actual authenticated user credentials to limit locations their own


  function buildPage() {
    var getLocationsURL = 'http://ec2-18-221-219-61.us-east-2.compute.amazonaws.com/Locations';

    var locations = [];
    var status = '';
    var newButtonHTML = '';
    var currentReadings = [];
    var locationReadings = [];
    var thermostatUI = null;


  $.get(getLocationsURL, function( locations, status ) {
    // display the initial map...
    var myMap = initMap();

    // get the geocoder we will need for the locations loop
    var myGeocoder = new google.maps.Geocoder();
    var geocodes =[];

    // get the boundaries object that we will use to constrain the map view later...

    var markerBounds = new google.maps.LatLngBounds();

    var locationsAccordianHTML = `<div class="panel-group" id="accordion">`;
    var locationsAccordianEnd = `</div>`;



      for (let i=0; i < locations.length; i++){
      // stash the locationId as an attrib in the button for later use (e.g. clicked event)

      // get a current reading....TODO:  asynch timing issue on console.log?
      var getCurrentReadingURL = 'http://ec2-18-221-219-61.us-east-2.compute.amazonaws.com/Now?';

      getCurrentReadingURL += `thermostatId=${locations[i].thermostatId}`;
      console.log(getCurrentReadingURL);

      var midSection = $.get(getCurrentReadingURL, function (currentReading, status) {
        var currentdate = new Date();
        var datetime = "Last Read: " + (currentdate.getMonth()+1)
                + "/"
                + currentdate.getDate()
                +  "/"
                + currentdate.getFullYear() + " @ "
                + twoDigits(currentdate.getHours()) + ":"
                + twoDigits(currentdate.getMinutes()) + ":"
                + twoDigits(currentdate.getSeconds());
        locationReadings.push(currentReading);
        thermostatUI = currentReading.GetThermostatResult.Thermostat[0].UI[0];
        console.log(thermostatUI);

        locationsAccordianHTML += `
        <div class="panel panel-default">
        <div class="panel-heading">
        <h4 class="panel-title">
        <a data-toggle="collapse" data-parent="#accordion" href="#collapse${i}">
        <i class="material-icons dp48">business</i>${locations[i].name}: ${parseInt(thermostatUI.DispTemperature)}&#176 ${thermostatUI.DisplayedUnits}</a></h4>
        </div>
        <div id="collapse${i}" class="panel-collapse collapse">
        <div class="panel-body">Heat Set Point: ${parseInt(thermostatUI.HeatSetpoint)}&#176&nbsp;&nbsp;&nbsp;&nbsp;Cool Set Point: ${parseInt(thermostatUI.CoolSetpoint)}&#176<br>${datetime}</div></div></div>`;

        console.log(locationsAccordianHTML);
        // newButtonHTML += `<button type="submit" class="btn-location-buttons btn-lg" thermostat-id=${locations[i].thermostatId} style="width: 70%;"><i class="material-icons dp48">business</i>${locations[i].name}: ${parseInt(thermostatUI.DispTemperature)}&#176 ${thermostatUI.DisplayedUnits}</button>`;
        //
        //
        //
        // $('.location-buttons').html(newButtonHTML);
      });  // getCurrentReadingURL

      midSection.done(wrapUpAccordian);

      geocodes.push(markLocation(myGeocoder, locations[i], myMap, markerBounds));
      console.log(`geocodes after push ${geocodes}`);

      function wrapUpAccordian() {
        // kluge....only call close accordian after last element processed
        console.log(`Time to wrap up? Not unless the i is right ${i}`);
        if (i == (locations.length - 1)) {
          console.log(i);
          closeAccordian();
        };
      };
    }; // looping through locations

    function closeAccordian() {
      console.log("============full accordian ===================");
      console.log(locationsAccordianHTML + locationsAccordianEnd);
      console.log("============full accordian ===================");
      $('.location-buttons').html(locationsAccordianHTML + locationsAccordianEnd);
    };

    // now update the DOM...
    // console.log(newButtonHTML);
    // $('.location-buttons').html(newButtonHTML);

  });  // getLocations request

  function twoDigits(n){
    return (n > 9 ? "" + n: "0" + n);
  };

  function initMap(){

    var myLatLng = {
      lat:  40.0000,
      lng: -98.0000
    };

    var myMap = new google.maps.Map(document.getElementById('locations-map'), {
      zoom: 4,
      center: myLatLng
    });

    return(myMap);
  };  // initMap

  function markLocation(geocoder, location, map, markerBounds) {
    var address = `${location.addr1}, ${location.city}, ${location.state}, ${location.zip5}`;
    var geocode = null;
    console.log (address);

    geocode = geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {
        map.setCenter(results[0].geometry.location);
        marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          title: location.name
        });
        // TODO: dig in and understand this code...relates to timing issues too....I'm doing it EVERY TIME.  It would be nice to do setCenter once
        markerBounds.extend(results[0].geometry.location);
        map.fitBounds(markerBounds);
        return (geocode);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });  // geocode
  }; // markLocation
} // buildPage
});  // document ready
