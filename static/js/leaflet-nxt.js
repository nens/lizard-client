// create a map in the "map" div, set the view to a given place and zoom



// var funcLayer = new L.TileLayer.Functional(function (view) {
//     var deferred = new jQuery.Deferred();
//     $.ajax({
//         url: '/jsonp',
//         data: { url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png' },
//         dataType: 'jsonp',
//         success: function(response) {
//             // Resolve the defered to return the URL
//             var url = response.url
//                 .replace('{z}', view.zoom)
//                 .replace('{y}', view.tile.row)
//                 .replace('{x}', view.tile.column)
//                 .replace('{s}', view.subdomain);
//             deferred.resolve(url);
//         }
//     });
//     return deferred;
// });
$(document).on('ready', function(){

    var osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png'),
        blanco = L.tileLayer.wms('http://geoserver6.lizard.net/geoserver/deltaportaal/wms', {'layers':'basiskaart'}),
        transport = L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png');

    var map = L.map('map', {
        center: new L.LatLng(52.0992287,5.5698782),
        zoom: 8,
        layers: [osm]
    });

    var baseMaps = {
        "Blanco": blanco,
        "Openstreetmap": osm,
        "Transport": transport
    };


    var wijken = $.getJSON('/static/data/wijken.geojson', function(data) {
        L.geoJson(data, {
            style: function (feature) {
                return {color: feature.properties.color};
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.description);
            }
        }).addTo(map);
    });



    L.control.layers(baseMaps).addTo(map);

});
//map.addLayer(funcLayer);