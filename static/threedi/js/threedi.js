// flood_activated = false;



// mode =
//first_flood_done = false;  // true means you have layers
//animation_activated = true;
var animate, 
    removeLayers,
    animation_counter = 0,
    max_animation_count = 10,
    layers = [],
    loaded_layers = 0,
    active_layer = null;

animate = function() {
    if (animation_counter < max_animation_count) {
        layers[animation_counter].setOpacity(1);
        if (active_layer !== null) {
            layers[active_layer].setOpacity(0);
        }
        active_layer = animation_counter;

        animation_counter += 1;
        setTimeout(animate, 500);
    }
};


// remove all layers. where is it used?
removeLayers = function() {
    for (var i = 0; i < layers.length; i++) {
        map.removeLayer(layers[i]);
    }
    layers = [];
};


var showalert;

function showalert(message, alert_class, timeout) {
    if(typeof(alert_class)==='undefined') alert_class = 'alert-info'; // twitter bootstrap alert type class
    if(typeof(timeout)==='undefined') timeout = 5000; // number of milliseconds after which disappears again
    
    var position = 90 + $('#alert_placeholder div').length * 55;  // pixels
    $('#alert_placeholder').append(
        '<div id="alertdiv" style="margin-bottom: 0px; bottom: ' + position + 'px;" class="alert ' +  alert_class + 
        '"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>');

    setTimeout(function() { // this will automatically close the alert and remove this if the users doesnt close it in 10 secs
        $("#alertdiv").remove();
    }, timeout);
};


function getParamsFromUrl() {
  var query = location.search.substr(1);
  var data = query.split("&");
  var result = {};
  for(var i=0; i<data.length; i++) {
    var item = data[i].split("=");
    result[item[0]] = item[1];
  }
  return result;
}

// Aggressive obtrusive message box if your browser is incompatible.
if (navigator.userAgent.indexOf('Firefox') != -1 && 
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Firefox') + 8)) >= 3.6){//Firefox
    //Allow
    //alert("Firefox");
} else if (navigator.userAgent.indexOf('Chrome') != -1 && 
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Chrome') + 7).split(' ')[0]) >= 15){//Chrome
    //Allow
    //alert("Chrome");
} else if(navigator.userAgent.indexOf('Safari') != -1 && 
    navigator.userAgent.indexOf('Version') != -1 && 
    parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Version') + 8).split(' ')[0]) >= 5){//Safari
    //Allow
    //alert("Safari");
} else {
    alert("You are using an unsupported browser. Use a recent Chrome or Firefox instead.");
}