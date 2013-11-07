/* 
 * Leaflet layer for d3 vectors
 * Copied from http://bl.ocks.org/tnightingale/4718717
 *
 */

L.PointsLayer = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        minZoom: 0,
        padding: 100,
        radius: 5
    },

    initialize: function (data, options) {
        var options = L.setOptions(this, options);
        this._data = data;
        this._path = d3.geo.path().projection(this._project.bind(this))
            .pointRadius(this._radius.bind(this));
    },

    onAdd: function (map) {
        this._map = map;

        // Create a container for svg.
        this._initContainer();

        // Set up events
        map.on({
            'moveend': this._update
        }, this);

        this._update();
    },

    onRemove: function (map) {
        // hack to fix bug in commented line below 
        var overlayPane = this._map.getPanes().overlayPane;
        d3.select(overlayPane).select("svg").remove();
        //this._container[0].parentNode.removeChild(this._container);

        map.off({
            'moveend': this._update
        }, this);

        this._container = null;
        this._map = null;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _initContainer: function () {
        var overlayPane = this._map.getPanes().overlayPane;
        console.log(this._container);
        if (!this._container || overlayPane.empty) {
            this._container = d3.select(overlayPane)
                .append('svg').attr('class', 'leaflet-layer leaflet-zoom-hide');

            console.log(this._data.features);
            this._layer = this._container.append("g");

            if (!this.options.cssclass) {
                this.options.cssclass = ""
            }
            var circles = this._layer.selectAll(".circle")
                .data(this._data.features).enter()
                .append("path")
                .attr("class", "circle " + this.options.cssclass);

            this._applyStyle(circles);
        }
    },

    _update: function () {

        if (!this._map) { return; }

        var zoom = this._map.getZoom();

        if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
            return;
        }

        var padding = this.options.padding,
            bounds = this._translateBounds(d3.geo.bounds(this._data), padding);
            dimensions = bounds.getSize();

        this._container.attr("width", dimensions.x).attr("height", dimensions.y)
            .style("margin-left", bounds.min.x + "px").style("margin-top", bounds.min.y + "px");

        this._layer.attr("transform", "translate(" + -bounds.min.x+ "," + -bounds.min.y+ ")")

        this._layer.selectAll(".circle").attr("d", this._path);
    },

    _applyStyle: function (circles) {
        if ('applyStyle' in this.options) {
            this.options.applyStyle.call(this, circles);
        }
    },

    _radius: function (d) {
        if (typeof this.options.radius == 'function') {
            return this.options.radius.call(this, d);
        }
        return this.options.radius;
    },

    _project: function (x) {
        var point = this._map.latLngToLayerPoint([x[1], x[0]]);
        return [point.x, point.y];
    },

    _translateBounds: function (d3_bounds, padding) {
        var nw = this._project([d3_bounds[0][0], d3_bounds[1][1]]),
            se = this._project([d3_bounds[1][0], d3_bounds[0][1]]);

        nw[0] -= padding, nw[1] -= padding;
        se[0] += padding, se[1] += padding;

        return L.bounds(nw, se);
    }

});

L.pointsLayer = function (data, options) {
    return new L.PointsLayer(data, options);
};


// //override L.GeoJson. for icons...
// L.extend(L.GeoJSON, {
//     geometryToLayer: function (geojson, pointToLayer, coordsToLatLng) {
//         var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
//             coords = geometry.coordinates,
//             layers = [],
//             latlng, latlngs, i, len, layer;

//         coordsToLatLng = coordsToLatLng || this.coordsToLatLng;

//         switch (geometry.type) {
//         case 'Point':
//             latlng = coordsToLatLng(coords);

//             //the only thing I changed.
//             if (this.options.icon){
//                 return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng, {
//                     icon: this.options.icon
//                 });
//             } else {
//                 return pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);            
//             }

//         case 'MultiPoint':
//             for (i = 0, len = coords.length; i < len; i++) {
//                 latlng = coordsToLatLng(coords[i]);
//                 layer = pointToLayer ? pointToLayer(geojson, latlng) : new L.Marker(latlng);
//                 layers.push(layer);
//             }
//             return new L.FeatureGroup(layers);

//         case 'LineString':
//             latlngs = this.coordsToLatLngs(coords, 0, coordsToLatLng);
//             return new L.Polyline(latlngs);

//         case 'Polygon':
//             latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
//             return new L.Polygon(latlngs);

//         case 'MultiLineString':
//             latlngs = this.coordsToLatLngs(coords, 1, coordsToLatLng);
//             return new L.MultiPolyline(latlngs);

//         case 'MultiPolygon':
//             latlngs = this.coordsToLatLngs(coords, 2, coordsToLatLng);
//             return new L.MultiPolygon(latlngs);

//         case 'GeometryCollection':
//             for (i = 0, len = geometry.geometries.length; i < len; i++) {

//                 layer = this.geometryToLayer({
//                     geometry: geometry.geometries[i],
//                     type: 'Feature',
//                     properties: geojson.properties
//                 }, pointToLayer, coordsToLatLng);

//                 layers.push(layer);
//             }
//             return new L.FeatureGroup(layers);

//         default:
//             throw new Error('Invalid GeoJSON object.');
//         }
//     },
// });