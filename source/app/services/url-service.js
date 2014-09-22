
/**
 * @class hashSyncHelper
 * @memberOf app
 *
 * @summary Lower level service to set $location.
 *
 * @description
 * Provides a setter and getter function to manipulate parts of the url to
 * keep the url synchronised with the actual application state. That way
 * you can use the url to share application state.
 */
app.service('UrlSyncHelper', ['$location', function ($location) {

    var _getPath, _getPathParts,

    service = {

      getUrlValue: function (part, index) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error('The provided part is not a supported part of the url');
        }
        var pathParts = _getPathParts(part);
        return pathParts[index];
      },

      setUrlValue: function (part, index, value) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error('The provided part is not a supported part of the url');
        }
        if (value && !(typeof(value) === 'string' || typeof(value) === 'number')) {
          throw new Error('The provided value cannot be set on the url');
        }
        var halfPath, otherHalf, parts = _getPathParts(part);
        if (value) {
          parts[index] = value; //replace
        } else {
          parts.splice(index, 1); // remove
        }
        halfPath = parts.join('/');
        if (part === 'path') {
          otherHalf = _getPath('at') ? '@' + _getPath('at') : '';
          $location.path(halfPath + otherHalf);
        } else {
          otherHalf = _getPath('path') ? _getPath('path') + '@' : '';
          $location.path(otherHalf + halfPath);
        }
      }
    };

    _getPath = function (part) {
      var paths, pathPart,
      path = $location.path();
      paths = path.split('@'); //splits path in two at the @.
      pathPart = paths[part === 'path' ? 0: 1] || ''; //gets before @ when 'path' after when 'at'
      // we do not want the first slash
      pathPart = part === 'path' ? pathPart.slice(1): pathPart;
      return pathPart;
    };

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
app.service("UrlState", ["UrlSyncHelper", function (UrlSyncHelper) {

    // Amount of decimals of coordinates stored in url.
    var COORD_PRECISION = 4;

    var service = {
      setgeomUrl: function (state, type, here, points) {
        var pointsStr = '';
        if (type === 'line') {
          angular.forEach(points, function (point) {
            pointsStr += point.lat.toFixed(COORD_PRECISION) + ',' + point.lng.toFixed(COORD_PRECISION) + '-';
          });
        }
        pointsStr += here.lat.toFixed(COORD_PRECISION) + ',' + here.lng.toFixed(COORD_PRECISION);
        UrlSyncHelper.setUrlValue(state.geom.part, state.geom.index, pointsStr);
      },
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
        UrlSyncHelper.setUrlValue(
          state.timeState.part,
          state.timeState.index,
          startDateString + '-' + endDateString);
      },
      setCoordinatesUrl: function (state, lat, lng, zoom) {
        var COORD_PRECISION = 4;
        var newHash = [
          lat.toFixed(COORD_PRECISION),
          lng.toFixed(COORD_PRECISION),
          zoom
        ].join(',');
        UrlSyncHelper.setUrlValue(
          state.mapView.part,
          state.mapView.index,
          newHash);
      },
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
        UrlSyncHelper.setUrlValue(
          state.layers.part,
          state.layers.index,
          activeSlugs.toString());
      },
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
      parseMapView: function (mapView) {
        var latlonzoom = mapView.split(',');
        if (latlonzoom.length === 3
          && parseFloat(latlonzoom[0])
          && parseFloat(latlonzoom[1])
          && parseFloat(latlonzoom[2])) {
          return {
            latLng: [latlonzoom[0], latlonzoom[1]],
            zoom: latlonzoom[2],
            options: {reset: true, animate: true}
          };
        } else {
          return false;
        }
      },
      setGeom: function (type, geom, mapState) {
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
        if (!UrlSyncHelper.getUrlValue(state.context.part, state.context.index)) {
          UrlSyncHelper.setUrlValue(
            state.context.part,
            state.context.index,
            state.context.value);
        }
        if (!UrlSyncHelper.getUrlValue(state.boxType.part, state.boxType.index)) {
          UrlSyncHelper.setUrlValue(
            state.boxType.part,
            state.boxType.index,
            type);
        }
        if (!UrlSyncHelper.getUrlValue(state.layers.part, state.layers.index)) {
          this.setLayersUrl(mapState.layers);
        }
        if (!UrlSyncHelper.getUrlValue(state.mapView.part, state.mapView.index)) {
          this.setCoordinatesUrl(mapState.center.lat,
            mapState.center.lng,
            mapState.zoom);
        }
        if (!UrlSyncHelper.getUrlValue(state.timeState.part, state.timeState.index)) {
          this.setTimeStateUrl(timeState.start, timeState.end);
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
