
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
angular.module('lizard-nxt')
  .service('LocationGetterSetter', ['$location', function ($location) {

    var _getPath, _getPathParts,

    service = {

     /**
      * @function
      * @memberOf angular.module('lizard-nxt').LocationGetterSetter
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
      * @memberOf angular.module('lizard-nxt').LocationGetterSetter
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
    * @memberOf angular.module('lizard-nxt')
  .LocationGetterSetter
    * @description returns the part of the path without first slash.
    * @param {str} part, part url looking for currently <path | @>
    * @return {str} the part the path.
    */
    _getPath = function (part) {

      var paths,
          pathPart,
          path = $location.path();

      paths = path.split('@'); //splits path in two at the @.
      pathPart = paths[part === 'path' ? 0 : 1] || ''; //gets before @ when 'path' after when 'at'
      // we do not want the first slash
      pathPart = part === 'path' ? pathPart.slice(1) : pathPart;
      return pathPart;
    };

   /**
    * @function
    * @memberOf angular.module('lizard-nxt')
  .LocationGetterSetter
    * @description splits the part of the path further in individual values.
    * @param {str} part of the path without first slash.
    * @return {array} the values in the part of the path.
    */
    _getPathParts = function (part) {
      var pathPart = _getPath(part);
      if (!pathPart) { return []; }
      return pathPart.split('/');
    };
    return service;
  }]);


/**
 * @ngdoc service
 * @class UrlState
 * @name UrlState
 * @description Higher level functions to parse and set URL.
 */
angular.module('lizard-nxt')
  .service("UrlState", ["LocationGetterSetter", "UtilService", function (LocationGetterSetter, UtilService) {

    // Amount of decimals of coordinates stored in url.
    var COORD_PRECISION = 4;

    var service = {

     /**
      * @function
      * @memberOf UrlState
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
          pointsStr = here === undefined
            ? ''
            : here.lat.toFixed(COORD_PRECISION) + ',' + here.lng.toFixed(COORD_PRECISION);
        }
        LocationGetterSetter.setUrlValue(state.geom.part, state.geom.index, pointsStr);
      },

     /**
      * @function
      * @memberOf UrlState
      * @description Sets the start and end epoch ms on the url
      * @param {object} state config object
      * @param {int} start time in ms
      * @param {int} end time in ms
      * @param {bool} relative time or absolute
      */
      setTimeStateUrl: function (state, start, end, relative) {
        console.log("[F] setTimeStateUrl");

        // var startDate = new Date(start);
        // var endDate = new Date(end);

        // console.log("*** startDate...:", start);
        // console.log("*** endDate.....:", end);

        if (relative) {
          // var now = Date.now(),
          //     past = now - start,
          //     future = now - end;

          // past = UtilService.getTimeIntervalAsText(start, now);
          // future = UtilService.getTimeIntervalAsText(now, end);

          // var pastString = '-' + past.days + 'Days' + past.hours + 'Hours';
          // var futureString = '';

          // if (future.days !== '' && future.hours !== '') {
          //   futureString = '+' + future.days + 'Days' + future.hours + 'Hours';
          // }

          // LocationGetterFUtilService.getSetter.setUrlValue(
          //   state.timeState.part,
          //   state.timeState.index,
          //   pastString + futureString
          // );

          var now = Date.now(),
              // pastIntervalMs = now - start,
              firstInterval,
              firstIntervalObj,
              firstIntervalStr,
              // futureIntervalMs = now - end,
              lastInterval,
              lastIntervalObj,
              lastIntervalStr,
              totalIntervalStr;

          this._printHrTimestamp(start, 'start');
          this._printHrTimestamp(end, 'end');
          this._printHrTimestamp(now, 'now');

          if (start <= now && now <= end) {
            console.log("AAA");
            pastIntervalObj = UtilService.getTimeIntervalAsObj(start, now);
            pastIntervalStr = "-" + pastIntervalObj.days + "Days"
                                  + pastIntervalObj.hours + "Hours";
            futureIntervalObj = UtilService.getTimeIntervalAsObj(now, end);
            futureIntervalStr = "+" + futureIntervalObj.days + "Days"
                                    + futureIntervalObj.hours + "Hours";
          } else if (start <= end && end <= now) {
            console.log("BBB");
            pastIntervalObj = UtilService.getTimeIntervalAsObj(start, end);
            pastIntervalStr = "-" + pastIntervalObj.days + "Days"
                                  + pastIntervalObj.hours + "Hours";
            futureIntervalObj = UtilService.getTimeIntervalAsObj(start, now);
            futureIntervalStr = "-" + futureIntervalObj.days + "Days"
                                    + futureIntervalObj.hours + "Hours";
          } else if (now <= start && start <= end) {
            console.log("CCC");
            pastIntervalObj = UtilService.getTimeIntervalAsObj(now, start);
            pastIntervalStr = "+" + pastIntervalObj.days + "Days"
                                  + pastIntervalObj.hours + "Hours";
            futureIntervalObj = UtilService.getTimeIntervalAsObj(start, end);
            futureIntervalStr = "+" + futureIntervalObj.days + "Days"
                                    + futureIntervalObj.hours + "Hours";
          } else {
            console.log("DDD\n[E] Oh noes! invalid triplet: start vs. now vs. end");
          }

          totalIntervalStr = pastIntervalStr + futureIntervalStr;

          LocationGetterSetter.setUrlValue(
            state.timeState.part,
            state.timeState.index,
            totalIntervalStr
          );

        } else {
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
        }
      },

     /**
      * @function
      * @memberOf UrlState
      * @description Sets the mapView coordinates on the url.
      * @param {object} state config object
      * @param {object} lat leaflet Latitude object
      * @param {object} lng leaflet Lng object
      * @param {int} zoom level
      */
      setCoordinatesUrl: function (state, lat, lng, zoom) {
        var COORD_PRECISION = 4;
        var newHash = [
          parseFloat(lat).toFixed(COORD_PRECISION),
          parseFloat(lng).toFixed(COORD_PRECISION),
          zoom
        ].join(',');
        LocationGetterSetter.setUrlValue(
          state.mapView.part,
          state.mapView.index,
          newHash);
      },

      /**
       * @function
       * @memberOf UrlState
       * @description Sets the selected items part of the url
       * @param {object} state config object
       * @param {object} selected object (containing, assets, and geoms)
       */
      setSelectedUrl: function (state, selected) {
        var newHash = angular.copy(selected.assets);
        var n = Math.pow(10, COORD_PRECISION);
        var coords;
        angular.forEach(selected.geometries, function (geom) {
          if (geom.geometry.type === 'Point') {
            coords = angular.copy(geom.geometry.coordinates);
            coords.forEach(function (point, i) {
              coords[i] = Math.round(point * n) / n;
            });
            newHash.push(coords.join(','));
          }
          if (geom.geometry.type === 'LineString') {
            var points = [];
            coords = angular.copy(geom.geometry.coordinates);
            angular.forEach(coords, function (point) {
              point.forEach(function (pos, i) {
                point[i] = Math.round(pos * n) / n;
              });
              points.push(point.join(','));
            });
            newHash.push(points.join('-'));
          }
          if (geom.geometry.type === 'Polygon' && geom.id) {
            newHash.push(geom.id);
          }
        });

        LocationGetterSetter.setUrlValue(
          state.geom.part,
          state.geom.index,
          newHash.join('+')
        );
      },

      /**
       * @function
       * @memberOf UrlState
       * @description Sets the layer slugs on the url.
       * @param {object} state config object
       * @param {object} layerGroups list
       */
      setlayersUrl: function (config, state) {
        var layers = state.layers.active;
        if (state.annotations.active) {
          layers.unshift('annotations');
        }
        layers.unshift(state.baselayer);
        if (state === undefined) { return; }
        LocationGetterSetter.setUrlValue(
          config.layers.part,
          config.layers.index,
          layers.join(',')
        );
      },

      /**
       * @function
       * @description Decide whether the timestamp part (read from the URL)
       *              uses relative time. This has nothing to do with whether
       *              the timestamp part of the URL has either one or two
       *              timestamps.
       */
      _urlTimestampIsRelative: function (urlTimestamp) {
        return UtilService.countSubstringOccurrences(urlTimestamp, ",") === 0;
      },

      /**
       * @function
       * @description Parse the timestamp part of the URL given that this part
       *              denotes time in an absolute manner, e.g:
       *
       *              a) Jul,23,2016-Jul,25,2016
       *              b) Jul,23,2016
       */
      _parseAbsTimestamp: function (time) {
        var timeState = {};
        // Browser independent. IE requires datestrings in a certain format.
        var times = time.replace(/,/g, ' ').split('-');
        var msStartTime = Date.parse(times[0]);
        // bail if time is not parsable, but return timeState
        if (isNaN(msStartTime)) { return timeState; }
        timeState.start = msStartTime;

        var msEndTime = Date.parse(times[1]);
        if (isNaN(msEndTime)) { return timeState; }
        if (msEndTime <= timeState.start) {
          msEndTime = timeState.start + 43200000; // half a day
        }
        timeState.end = msEndTime;
        return timeState;
      },

      _printHrTimestamp: function (unixTimestamp, msg) {
        var hrTimestamp = new Date(unixTimestamp).toString();
        console.log("[dbg] HR timestamp:", unixTimestamp, "=>", hrTimestamp,
          (msg ? "(=" + msg + ")" : ""));
      },

      /**
       * @function
       * @description Parse the timestamp part of the URL given that this part
       *              denotes time in an relative manner, e.g:
       *
       *              a) -2Days11Hours-2Days7Hours  // start -> end -> NOW
       *              b) -2Days11Hours+2Days7Hours  // start -> NOW -> end
       *              c) +2Days11Hours-2Days7Hours  // CAN NEVAR HAPPEN!
       *              d) +2Days10Hours+2Days11Hours // NOW -> start -> end
       *              e) 2Days11Hours-2Days7Hours   // CAN NEVAR HAPPuN!
       *              f) 2Days10Hours+2Days11Hours  // equal to (d)
       *              g) +2Days11Hours              // NOW -> end
       *              h) -2Days11Hours              // start -> NOW
       *              i) 2Days11Hours               // equal to (g)
       */
      _parseRelTimestamp: function (time_) {

        var time,
            times,
            msStartTime,
            msEndTime,
            hasTwoParts,
            now = Date.now(),
            part1isPos = null,
            part2isPos = null,
            timeState = {};

        var writeLocalVars = function () {
          times = time.split("-");
          if (times.length === 1) {
            times = time.split("+")
            if (times.length === 1) {
              times = [time];
              hasTwoParts = false;
            } else if (times.length === 2) {
              part2isPos = true;
              hasTwoParts = true;
            }
          } else if (times.length === 2) {
            part2isPos = false;
            hasTwoParts = true;
          }
        }

        if (time_[0] === "+") {
          part1isPos = true;
          time = time_.slice(1, time_.length);
          writeLocalVars();

        } else if(time_[0] === "-") {
          part1isPos = false;
          time = time_.slice(1, time_.length);
          writeLocalVars();

        } else {
          part1isPos = true;
          time = time_;
          writeLocalVars();
        }

        msStartTime = UtilService.parseDaysHours(times[0]);
        timeState.start = part1isPos
          ? now + msStartTime
          : now - msStartTime;

        if (hasTwoParts) {
          msEndTime = UtilService.parseDaysHours(times[1]);
          timeState.end = part2isPos
            ? now + msEndTime
            : now - msEndTime;
        } else {
          timeState.end = now;
        }
        console.log("[dbg] rel. timeState (after parsing URL):", timeState);
        this._printHrTimestamp(timeState.start, 'start');
        this._printHrTimestamp(now, 'now');
        this._printHrTimestamp(timeState.end, 'end');

        return timeState;
      },

      /**
       * @function
       * @memberOf UrlState
       * @description Sets the layer slugs on the url.
       * @param  {str} time time value of the url
       * @param  {object} timeState nxt timeState
       * @return {object} nxt timeState
       */
      parseTimeState: function (time) {
        console.log("[F] parseTimeState; arg 'time' = '" + time + "'");
        if (!time) { return; }
        var times, msStartTime, msEndTime;

        return this._urlTimestampIsRelative(time)
          ? this._parseRelTimestamp(time)
          : this._parseAbsTimestamp(time);
      },

      // parseTimeState: function (time) {
      //   if (!time) { return; }
      //   var timeState = {};
      //   var times, msStartTime, msEndTime;
      //   if (time.split('Days').length > 1) {
      //     times = time.split('-')[1].split('+');
      //     var past = times[0];
      //     var future = times[1];

      //     msStartTime = UtilService.parseDaysHours(past);
      //     msEndTime = UtilService.parseDaysHours(future);

      //     timeState.start = Date.now() - msStartTime;
      //     timeState.end = Date.now() + msEndTime;
      //   } else {
      //     // Browser independent. IE requires datestrings in a certain format.
      //     times = time.replace(/,/g, ' ').split('-');
      //     msStartTime = Date.parse(times[0]);
      //     // bail if time is not parsable, but return timeState
      //     if (isNaN(msStartTime)) { return timeState; }
      //     timeState.start = msStartTime;

      //     msEndTime = Date.parse(times[1]);
      //     if (isNaN(msEndTime)) { return timeState; }
      //     if (msEndTime <= timeState.start) {
      //       msEndTime = timeState.start + 43200000; // half a day
      //     }
      //     timeState.end = msEndTime;
      //   }
      //   return timeState;
      // },
      /**
       * @function
       * @memberOf UrlState
       * @description returns the mapview value parsed to
       *              latlonzoom
       * @param  {str} mapView
       * @return {object_or_false} Lat lon zoom object or false
       *                               when not valid.
       */
      parseMapView: function (mapView) {
        if (!mapView) { return; }
        var latlonzoom = mapView.split(',');
        if (latlonzoom.length === 3
          && parseFloat(latlonzoom[0])
          && parseFloat(latlonzoom[1])
          && parseFloat(latlonzoom[2])) {
          return {
            lat: parseFloat(latlonzoom[0]),
            lng: parseFloat(latlonzoom[1]),
            zoom: parseFloat(latlonzoom[2])
          };
        }
      },

      parseSelection: function (geom) {
        if (!geom) { return; }
        var selection = {assets: [], geometries: []};
        var selections = geom.split('+');
        selections.forEach(function (selected) {
          if (selected.split('$').length === 2) {
            selection.assets.push(selected);
          }

          else {
            var geometry = {
              geometry: {
                type: 'LineString'
              }
            };
            var coordinates = [];

            if (selected.split('-').length > 1) {
              // Line
              var points = selected.split('-');
              angular.forEach(points, function (pointStr) {
                var point = pointStr.split(',');
                if (parseFloat(point[0]) &&
                    parseFloat(point[1])) {
                  coordinates.push([Number(point[0]), Number(point[1])]);
                }
              });
              geometry.geometry.coordinates = coordinates;
              selection.geometries.push(geometry);
            }

            else if (selected.split(',').length > 1) {
              geometry = {
                geometry: {
                  type: 'Point'
                }
              };
              var point = selected.split(',');
              if (parseFloat(point[0]) &&
                  parseFloat(point[1])) {
                coordinates = [Number(point[0]), Number(point[1])];
                geometry.geometry.coordinates = coordinates;
                selection.geometries.push(geometry);
              }
            }

          }
        });

        return selection;
      }
    };

    return service;

  }
]);


/**
 * @ngdoc service
 * @class UrlState
 * @name UrlState
 * @description Higher level functions to parse and set URL.
 */
angular.module('lizard-nxt')
.service("UrlService", ['UrlState', 'LocationGetterSetter', 'UtilService',
  function (UrlState, LocationGetterSetter, UtilService) {

    // Configuration object for url state.
    var config = {
      language: {
        part: 'path',
        index: 0
      },
      context: { // Locally used name for the state
        value: 'map', // default
        part: 'path', // Part of the url where this state is stored,
        index: 1, // Position of the state in the part
      },
      layers: {
        part: 'path',
        index: 2,
      },
      boxType: {
        part: 'path',
        index: 3,
      },
      geom: {
        part: 'path',
        index: 4,
      },
      mapView: {
        part: 'at',
        index: 0,
      },
      timeState: {
        part: 'at',
        index: 1,
      },
    };

    var getLanguage = function () {
      return LocationGetterSetter.getUrlValue(
        config.language.part,
        config.language.index
      );
    };

    var getContext = function () {
      var context = LocationGetterSetter.getUrlValue(
        config.context.part,
        config.context.index
      );
      if (context) { return context; }
    };

    var getLayers = function () {
      var layersFromURL = LocationGetterSetter.getUrlValue(
        config.layers.part,
        config.layers.index
      );
      if (layersFromURL) {
        var actives = layersFromURL.split(',');
        var layers = _.takeRightWhile(actives, function (layer) {
          return layer.indexOf('$') !== -1;
        });
        return layers;
      }
    };

    var getBaselayer = function () {
      var layersFromURL = LocationGetterSetter.getUrlValue(
        config.layers.part,
        config.layers.index
      );
      if (layersFromURL) {
        var actives = layersFromURL.split(',');
        return actives[0];
      }
    };

    var getAnnotations = function () {
      var layersFromURL = LocationGetterSetter.getUrlValue(
        config.layers.part,
        config.layers.index
      );
      var present = false;
      if (layersFromURL) {
        var actives = layersFromURL.split(',');
        if (actives.length > 1) {
           present = actives[1].indexOf('annotations') !== -1;
        }
      }
      return present;
    };

    var getBoxType = function () {
      var boxType = LocationGetterSetter.getUrlValue(
        config.boxType.part,
        config.boxType.index
      );
      if (boxType) { return boxType; }
    };

    var getSelected = function () {
      var selected = LocationGetterSetter.getUrlValue(
        config.geom.part,
        config.geom.index
      );
      return UrlState.parseSelection(selected);
    };

    var getView = function () {
      var mapView = LocationGetterSetter.getUrlValue(
        config.mapView.part,
        config.mapView.index
      );
      return UrlState.parseMapView(mapView);
    };

    var getTemporal = function () {
      console.log("[F] getTemporal");
      var time = LocationGetterSetter.getUrlValue(
        config.timeState.part,
        config.timeState.index
      );
      console.log("*** time....:", time);
      var result = UrlState.parseTimeState(time);
      console.log("*** result..:", result);
      return result;
    };

    return {
      setUrl: function (state) {
        console.log("[F] setUrl; arg 'state':", state);

        // Decide upon time=relative true/false:
        var time = LocationGetterSetter.getUrlValue(
          config.timeState.part,
          config.timeState.index
        );
        var TIME_IS_RELATIVE = UrlState._urlTimestampIsRelative(time);

        console.log("[dbg] TIME_IS_RELATIVE =", TIME_IS_RELATIVE);


        LocationGetterSetter.setUrlValue(
          config.language.part,
          config.language.index,
          state.language
        );

        UrlState.setSelectedUrl(config, state.selected);

        LocationGetterSetter.setUrlValue(
          config.context.part, config.context.index, state.context
        );

        LocationGetterSetter.setUrlValue(
          config.boxType.part, config.boxType.index, state.box.type
        );

        if (!state.temporal.timelineMoving) {
          // if (Date.now() - state.temporal.start > 7 * UtilService.day) {
          //   state.temporal.relative = false;
          // } else {
          //   state.temporal.relative = true;
          // }
          console.log("[dbg] Abpout to call 'setTimeStateUrl'; state.temporal:", state.temporal);
          UrlState.setTimeStateUrl(
            config,
            state.temporal.start,
            state.temporal.end,
            TIME_IS_RELATIVE
          );
        }

        UrlState.setCoordinatesUrl(
          config,
          state.spatial.view.lat,
          state.spatial.view.lng,
          state.spatial.view.zoom
        );

        UrlState.setlayersUrl(config, state);

      },

      getState: function () {
        return {
          language: getLanguage(),
          context: getContext(),
          baselayer: getBaselayer(),
          // If active return an object with active, otherwise leave it. The url
          // does not contain inactive layers. This is consistent with other
          // layers.
          annotations: getAnnotations() ? { active: true } : undefined,
          layers: {active: getLayers()},
          box: {type: getBoxType()},
          selected: getSelected(),
          spatial: {view: getView()},
          temporal: getTemporal()
        };
      },

      getFavourite: function () {
        var firstUrlPart = LocationGetterSetter.getUrlValue(
          'path',
          0
        );
        if (firstUrlPart === 'favourites') {
          var favouriteUUID = LocationGetterSetter.getUrlValue(
            'path',
            1
          );
          return favouriteUUID;
        }
      }

    };
  }
]);
