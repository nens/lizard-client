
/**
 * @class LocationGetterSetter
 * @memberOf app
 *
 * @summary Lower level service to set $location.
 *
 * @description
 * Provides a setter and getter function to manipulate parts of the url to
 * keep the url synchronised with the actual application state. That way
 * you can use the url to share application state.
 */
app.service('LocationGetterSetter', ['$location', function ($location) {

    var _getPath, _getPathParts,

    service = {

     /**
      * @function
      * @memberOf app.LocationGetterSetter
      * @description returns the value in the path of url at the specified part
      * @param {str} part, part url looking for currently <path | @>
      * @param {str} index location in the part
      * @return {str} value
      */
      getUrlValue: function (part, index) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error(String(part) + ' is not a supported part of the url');
        }
        var pathParts = _getPathParts(part);
        var value = pathParts[index] === '' ? undefined : pathParts[index];
        return value;
      },

     /**
      * @function
      * @memberOf app.LocationGetterSetter
      * @description sets the value in the path of url at the specified part
      * @param {str} part, part url looking for currently <path | @>
      * @param {str} index location in the part
      * @param {str} value
      */
      setUrlValue: function (part, index, value) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error(String(part) + ' is not a supported part of the url');
        }
        if (value && !(typeof(value) === 'string' || typeof(value) === 'number')) {
          throw new Error(String(value) + ' cannot be set on the url');
        }
        var halfPath, otherHalf, parts = _getPathParts(part);
        if (!value && parts.length - 1 === index) {
          parts.splice(index, 1); // remove if no value and index is last one.
        } else {
          parts[index] = value; //replace
        }
        halfPath = parts.join('/');
        if (part === 'path') {
          otherHalf = _getPath('at') ? '@' + _getPath('at') : '';
          $location.path('/' + halfPath + otherHalf);
        } else {
          otherHalf = _getPath('path') ? _getPath('path') + '@' : '@';
          $location.path('/' + otherHalf + halfPath);
        }
      }
    };

   /**
    * @function
    * @memberOf app.LocationGetterSetter
    * @description returns the part of the path without first slash.
    * @param {str} part, part url looking for currently <path | @>
    * @return {str} the part the path.
    */
    _getPath = function (part) {
      var paths, pathPart,
      path = $location.path();
      paths = path.split('@'); //splits path in two at the @.
      pathPart = paths[part === 'path' ? 0: 1] || ''; //gets before @ when 'path' after when 'at'
      // we do not want the first slash
      pathPart = part === 'path' ? pathPart.slice(1): pathPart;
      return pathPart;
    };

   /**
    * @function
    * @memberOf app.LocationGetterSetter
    * @description splits the part of the path further in individual values.
    * @param {str} part of the path without first slash.
    * @return {array} the values in the part of the path.
    */
    _getPathParts = function (part) {
      var pathPart = _getPath(part);
      if (!pathPart || pathPart === '') { return []; }
      var parts = pathPart.split('/');
      return parts;
    };

    return service;
  }]);


/**
 * @ngdoc service
 * @class UrlState
 * @name UrlState
 * @description Higher level functions to parse and set URL.
 */
app.service("UrlState", ["LocationGetterSetter", function (LocationGetterSetter) {

    // Amount of decimals of coordinates stored in url.
    var COORD_PRECISION = 4;

    var service = {

     /**
      * @function
      * @memberOf app.UrlState
      * @description Sets the points or the here on the url when
      *              respectively point or line is specified as type.
      * @param {object} state config object
      * @param {str} type box.type
      * @param {object} here leaflet LatLng object
      * @param {array} points array of leaflet LatLng objects
      */
      setgeomUrl: function (state, type, here, points) {
        var pointsStr = '';
        if (type === 'line') {
          angular.forEach(points, function (point) {
            pointsStr += point.lat.toFixed(COORD_PRECISION) + ',' + point.lng.toFixed(COORD_PRECISION) + '-';
          });
          pointsStr = pointsStr.substring(0, pointsStr.length - 1);
        } else {
          pointsStr = here.lat.toFixed(COORD_PRECISION) + ',' + here.lng.toFixed(COORD_PRECISION);
        }
        LocationGetterSetter.setUrlValue(state.geom.part, state.geom.index, pointsStr);
      },

     /**
      * @function
      * @memberOf app.UrlState
      * @description Sets the start and end epoch ms on the url
      * @param {object} state config object
      * @param {int} start time in ms
      * @param {int} end time in ms
      */
      setTimeStateUrl: function (state, start, end) {
        var startDate = new Date(start);
        var endDate = new Date(end);
        var startDateString = startDate.toDateString()
          .slice(4) // Cut off day name
          .split(' ') // Replace spaces by hyphens
          .join(',');
        var endDateString = endDate.toDateString()
          .slice(4) // Cut off day name
          .split(' ') // Replace spaces by hyphens
          .join(',');
        LocationGetterSetter.setUrlValue(
          state.timeState.part,
          state.timeState.index,
          startDateString + '-' + endDateString);
      },

     /**
      * @function
      * @memberOf app.UrlState
      * @description Sets the mapView coordinates on the url.
      * @param {object} state config object
      * @param {object} lat leaflet Latitude object
      * @param {object} lng leaflet Lng object
      * @param {int} zoom level
      */
      setCoordinatesUrl: function (state, lat, lng, zoom) {
        var COORD_PRECISION = 4;
        var newHash = [
          lat.toFixed(COORD_PRECISION),
          lng.toFixed(COORD_PRECISION),
          zoom
        ].join(',');
        LocationGetterSetter.setUrlValue(
          state.mapView.part,
          state.mapView.index,
          newHash);
      },

      /**
       * @function
       * @memberOf app.UrlState
       * @description Sets the layer slugs on the url.
       * @param {object} state config object
       * @param {object} layers mapState.layer
       */
      setLayersUrl: function (state, layers) {
        if (layers === undefined) { return; }
        var slugs = Object.keys(layers),
            i,
            activeSlugs = [];
        for (i = 0; i < slugs.length; i++) {
          if (layers[slugs[i]].active) {
            activeSlugs.push(slugs[i]);
          }
        }
        LocationGetterSetter.setUrlValue(
          state.layers.part,
          state.layers.index,
          activeSlugs.toString());
      },
      /**
       * @function
       * @memberOf app.UrlState
       * @description Sets the layer slugs on the url.
       * @param  {str} time time value of the url
       * @param  {object} timeState nxt timeState
       * @return {object} nxt timeState
       */
      parseTimeState: function (time, timeState) {
        // Browser independent
        var times = time.replace(/,/g, '/').split('-');
        var msStartTime = Date.parse(times[0]);
        // bail if time is not parsable
        if (isNaN(msStartTime)) { return; }
        timeState.start = msStartTime;

        var msEndTime = Date.parse(times[1]);
        if (isNaN(msEndTime)) { return; }
        if (msEndTime === timeState.start) {
          msEndTime += 43200000; // half a day
        }
        timeState.end = msEndTime;
        timeState.at = timeState.start +
          (timeState.end - timeState.start) / 2;
        timeState.changeOrigin = 'hash';
        timeState.changedZoom = Date.now();
        return timeState;
      },
      /**
       * @function
       * @memberOf app.UrlState
       * @description returns the mapview value parsed to
       *              latlonzoom
       * @param  {str} mapView
       * @return {object_or_false} Lat lon zoom object or false
       *                               when not valid.
       */
      parseMapView: function (mapView) {
        var latlonzoom = mapView.split(',');
        if (latlonzoom.length === 3
          && parseFloat(latlonzoom[0])
          && parseFloat(latlonzoom[1])
          && parseFloat(latlonzoom[2])) {
          return {
            latLng: [parseFloat(latlonzoom[0]), parseFloat(latlonzoom[1])],
            zoom: parseFloat(latlonzoom[2]),
            options: {reset: true, animate: true}
          };
        } else {
          return false;
        }
      },
      parseGeom: function (type, geom, mapState) {
        if (type === 'point') {
          var point = geom.split(',');
          if (parseFloat(point[0]) &&
              parseFloat(point[1])) {
            mapState.here = L.latLng(point[0], point[1]);
          }
        } else if (type === 'line') {
          var points = geom.split('-');
          angular.forEach(points, function (pointStr, key) {
            var point = pointStr.split(',');
            if (parseFloat(point[0]) &&
                parseFloat(point[1])) {
              mapState.points[key] = L.latLng(point[0], point[1]);
            }
          });
        }
        return mapState;
      },
      setUrlHashWhenEmpty: function (state, type, mapState, timeState) {
        if (!LocationGetterSetter.getUrlValue(state.context.part, state.context.index)) {
          LocationGetterSetter.setUrlValue(
            state.context.part,
            state.context.index,
            state.context.value);
        }
        if (!LocationGetterSetter.getUrlValue(state.boxType.part, state.boxType.index)) {
          LocationGetterSetter.setUrlValue(
            state.boxType.part,
            state.boxType.index,
            type);
        }
        if (!LocationGetterSetter.getUrlValue(state.layers.part, state.layers.index)) {
          this.setLayersUrl(mapState.layers);
        }
        if (!LocationGetterSetter.getUrlValue(state.mapView.part, state.mapView.index)) {
          this.setCoordinatesUrl(state,
            mapState.center.lat,
            mapState.center.lng,
            mapState.zoom);
        }
        if (!LocationGetterSetter.getUrlValue(state.timeState.part, state.timeState.index)) {
          this.setTimeStateUrl(state, timeState.start, timeState.end);
        }
      },
      update: function (state) {
        var u = true;
        angular.forEach(state, function (value) {
          if (!value.update) {
            u = false;
          }
        });
        return u;
      }
    };

    return service;

  }
]);
