/**
 * Add non tiled d3 event vector layer
 *
 * Implemented as a layer to display point events. Events
 * are aggregated based on viewport (spatial extent) and
 * time-interval (temporal extent, from timeline)
 *
 */
app.directive('vectorlayer', ['EventService', '$rootScope',
  'ClickFeedbackService', 'MapService',
  function (EventService, $rootScope, ClickFeedbackService, MapService) {

  return {
    restrict: 'A',
    link: function (scope, element, attrsM) {

      // declaring all local vars for current scope:
      var getEventColor, eventClickHandler, getFeatureSelection, matchLocation,
          idExtractor, createEventLayer, d3eventLayer, _highlightEvents;

      /**
       * Get color from feature.
       *
       * @param {object} d - D3 bound data object; expects color property.
       */
      getEventColor = function (d) {
        return d.properties.color;
      };

      /**
       * Highlights and unhighlights data points
       * @param {string} - String with id that should be highlighted
       */
      _highlightEvents = function (id) {
        // unhighlight events
        d3.selectAll(".circle.event")
          .classed("highlighted-event", false)
          .attr("data-init-color", getEventColor)
          .attr("fill", getEventColor);
        // highlight selected event
        d3.select("." + id)
          .classed("highlighted-event", true)
          .transition()
          .duration(1000)
          .attr("fill", "black");


        // hacky hack is oooow soooo hacky
        setTimeout(function () {
          ClickFeedbackService.removeLocationMarker();
        }, 300);

      };

      /**
       * Event click handler.
       *
       * Gets id's highlights events,
       * matchesLocations and passes them to 'here' object
       * For pointObject to pick 'em up.
       *
       * @param {object} d - D3 bound data object.
       */
      eventClickHandler = function (d) {

        var id, here, features, f;

        features = matchLocation(d, d3eventLayer._data.features);
        id = this.options.selectorPrefix + this._idExtractor(d);
        here = new L.LatLng(d.geometry.coordinates[1],
                            d.geometry.coordinates[0]);
        var eventDatastuff = {
          type: 'events',
          eventData: {
            features: features
          }
        };

        _highlightEvents(id);

        var setEventOnPoint = function () {
          scope.mapState.here = here;
          scope.box.type = 'pointObject';
        };

        if (!scope.$$phase) {
          scope.$apply(setEventOnPoint);
        } else {
          setEventOnPoint();
        }

        $rootScope.$broadcast('newPointObject', eventDatastuff);
      };

      /**
       * Gets data point and searches through list of
       * geojson features for matches. Returns matchedLocations
       * @param  {object} d       Clicked object
       * @param  {array} features List of other geojson features.
       * @return {array}          List of Matched Locations
       */
      matchLocation = function (d, features) {
        var matchedLocation = [],
            f;
        for (f = 0; f < features.length; f++) {
          if (d.geometry.coordinates[0] === features[f].geometry.coordinates[0]
              &&
              d.geometry.coordinates[1] === features[f].geometry.coordinates[1]
              ) {
            matchedLocation.push(features[f]);
          }
        }
        return matchedLocation;
      };

      /**
       * Utilfunction that creates/returns a "feature"
       *
       * @parameter {object} g - D3 g (svg) selection.
       * @parameter {object} data - Event data object.
       * @returns {object} - D3 selection.
       */
      getFeatureSelection = function (g, data) {
        return g.selectAll("path")
                .data(data.features, function (d) { return d.id; });
      };

      /**
       * Generator function to extract id's from geoJson.
       *
       * @param  {object} feature - geoJson feature
       * @return {string} id - String
       */
      idExtractor = function (feature) {
        var id = feature.id.toString().split('.')[0] +
                  '_es_' + feature.properties.event_series;
        return id;
      };

      /**
       * Creates svg layer in leaflet's overlaypane and adds events as circles
       *
       * On leaflet's viewreset the svg rescaled and repositioned. This
       * function should also be called when the data is changed.
       *
       * @parameter {object} data - Object
       * @return {object} eventLayer - Leaflet layer object
       */
      createEventLayer = function (data) {

        // declaring all local vars in 1st line of function body!
        var map, svg, g, transform, path, bounds, featureSelection,
            projectPoint, reset;


        // if d3eventlayer does not exist create.
        if (d3eventLayer === undefined) {
          d3eventLayer = L.nonTiledGeoJSONd3(data, {
            ext: 'd3',
            name: 'events',
            selectorPrefix: 'm',
            class: 'circle event'
          });
        }

        MapService.addLayer(d3eventLayer);
        d3eventLayer._bindClick(eventClickHandler);

        // for backwards compatibility.
        d3eventLayer.g = d3eventLayer._container.selectAll("g");
        d3eventLayer.svg = d3eventLayer.svg;
        d3eventLayer.reset = d3eventLayer._onMove;

        return d3eventLayer;
      };

      /**
       * Updates svg layer in leaflet's overlaypane with new data object
       *
       * First call the reset function to give the svg enough space for the
       * new data.Identify path elements with data objects via id and update,
       * create or remove elements.
       *
       * @parameter: object eventLayer object to update
       * @parameter: data object
       * @return: object eventLayer object
       */
      var updateEventLayer = function (eventLayer, data) {
        eventLayer._data = data;
        eventLayer._refreshData();
        eventLayer._bindClick(eventClickHandler);
      };

      var removeEventLayer = function (eventLayer) {
        MapService.removeLayer(eventLayer);
        return false;
      };

      /**
       * Count overlapping locations.
       *
       * Adds a lat + lon key to overlapLocations if not defined and sets
       * counter to 1. If key exists adds +1 to counter. Returns counter for
       * current key.
       *
       * TODO: this code is duplicate from lib/Layer.GeoJSONd3.js. Refactor so
       * everything is done with enter, update and exit selections of d3.
       *
       * @parameter {object} d D3 data object, should have  a geometry property
       * @returns {integer} Count for current key
       *
       */
      var _countOverlapLocations = function (overlapLocations, d) {
        var key = "x:" + d.geometry.coordinates[0] +
                  "y:" + d.geometry.coordinates[1];
        var coord = overlapLocations[key];
        if (coord === undefined) {
          overlapLocations[key] = 1;
        } else {
          overlapLocations[key] += 1;
        }
        return overlapLocations[key];
      };

      /**
       * Draw events based on current temporal extent
       *
       * Hide all elements and then unhides when within the given start
       * and end timestamps.
       *
       * @parameter: int start start timestamp in epoch ms
       * @parameter: int end end timestamp in epoch ms
       */
      var drawTimeEvents = function (start, end) {
        //NOTE: not optimal class switching
        d3.selectAll(".circle").classed("hidden", true);
        d3.selectAll(".circle")
          .classed("selected", function (d) {
            var s = [start, end];
            var time = d.properties.timestamp_end;
            var contained = s[0] <= time && time <= s[1];

            // Some book keeping to count
            d.inTempExtent = contained;
            return !!contained;
          });
        var selected = d3.selectAll(".circle.selected");

        // hack to update radius of event circles on brush move
        // duplicate code with Layer.GeoJSONd3.js
        // TODO: refactor this code into above fill for update of d3 selection
        var overlapLocations = {};
        selected.classed("hidden", false);
        selected
          .attr("r", function (d) {
            var radius, overlaps;
            overlaps = _countOverlapLocations(overlapLocations, d);
            // logarithmic scaling with a minimum radius of 6
            radius = 6 + (5 * Math.log(overlaps));
            return radius;
          });
        EventService.countCurrentEvents(scope);
      };


      /**
       * Watch that is fired when the timeState has changed
       *
       * Calls functions to draw events currently within the timeState
       * and to count currently visible events
       */
      scope.$watch('timeState.changedZoom', function (n, o) {
        if (n === o) { return true; }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        EventService.countCurrentEvents(scope);
      });

      scope.$watch('events.changed', function (n, o) {
        if (n === o) { return true; }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
        EventService.countCurrentEvents(scope);
      });

      /**
       * Watch that is fired when the animation has stepped
       *
       * Calls functions to draw events currently within the animation bounds
       * and to count currently visible events
       */
      scope.$watch('timeState.at', function () {

        if (scope.timeState.animation.enabled) {

          drawTimeEvents(
            scope.timeState.animation.start,
            scope.timeState.at
          );

          EventService.countCurrentEvents(scope);
        }
      });

      /**
       * Watch that is fired when events data object has changed
       *
       * Calls functions to create, update or remove eventLayer.
       * And makes sure events are drawn in accordance to the current timeState.
       */
      var eventLayer;
      scope.$watch('events.changed', function (n, o) {
        if (n === o) { return true; }
        if (eventLayer) {
          if (scope.events.data.features.length === 0) {
            eventLayer = removeEventLayer(eventLayer);
          } else {
            updateEventLayer(eventLayer, scope.events.data);
          }
        } else {
          eventLayer = createEventLayer(scope.events.data);
        }
        drawTimeEvents(scope.timeState.start, scope.timeState.end);
      });
    }
  };
}]);

/**
 * Impervious surface vector layer.
 *
 * Load data with d3 geojson vector plugin L.TileLayer.GeoJSONd3 in ./lib
 * bind highlight function to mouseover and mouseout events.
 *
 * NOTE: this contains quite some hard coded stuff. Candidate for refactoring
 * to make generic
 *
 */
app.directive('surfacelayer', ['MapService', function (MapService) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var bottomLeft = {};

      /**
       * Style surface features.
       *
       * Function to style d3 features in d3 selection
       *
       * @param: features, d3 selection object
       */
      var surfaceStyle = function (features) {
        features
          .style("stroke-width", 0)
          .style("fill-opacity", 0);
      };

      /**
       * Convert list with values to d3 selector
       *
       * @param: list of values
       * @returns: concatenated d3 suitable OR selector
       */
      var listToSelector = function (list) {
        var selector = "";
        for (var i in list) {
          // prepend `.p` because classes can't start with an number
          selector += ".p" + list[i] + ", ";
        }
        selector = selector.slice(0, -2);

        return selector;
      };

      /**
       * Callback function to highlight surfaces connected to pipe
       *
       * Selects d3 objects based on ids in data property (in this case in
       * `impervious_surfaces`. On 'mouseover' highlights features, on
       * 'mouseout' fades features to transparant
       *
       * @param: e, event object, expects the data property to have a
       * `impervious_surfaces` property
       *
       */
      var highlightSurface = function (e) {
        if (e.data.impervious_surfaces !== undefined) {
          var surface_ids = JSON.parse(e.data.impervious_surfaces);
          if (surface_ids.indexOf("null") === -1) {
            var selector = listToSelector(surface_ids);
            if (e.type === 'mousemove') {
              d3.selectAll(selector)
                .style("fill", "#e74c3c")
                .style("fill-opacity", 0.6)
                .transition();
            } else if (e.type === 'mouseout') {
              d3.selectAll(selector)
                .transition()
                .duration(500)
                .style("stroke-width", 0)
                .style("fill-opacity", 0);
            }
          }
        }
      };

      var getLayer = MapService.getLayer;

      // Initialise geojson layer
      var surfaceLayer = L.geoJSONd3(
        'api/v1/tiles/impervioussurface/{z}/{x}/{y}.geojson',
        {
          applyStyle: surfaceStyle,
          class: "impervious_surface"
        });

      /**
       * Listen to tools model for pipe_surface tool to become active. Add
       * geojson d3 layer and bind mousemove and mouseout events to
       * highlight impervious surface.
       *
       */
      scope.$watch('tools.active', function (n, o) {
        if (n === o) { return true; }
        var pipeLayer = {};
        if (scope.tools.active === "pipeSurface") {
          MapService.addLayer(surfaceLayer);
          pipeLayer = getLayer('grid', 'waterchain');
          // icon active
          angular.element(".surface-info").addClass("icon-active");
          if (pipeLayer) {
            pipeLayer.on('mousemove', highlightSurface);
            pipeLayer.on('mouseout', highlightSurface);
          } else {
            // If there is no grid layer it is probably still being
            // loaded by the map-directive which will broadcast a
            // message when its loaded.
            scope.$on('waterchainGridLoaded', function () {
              if (scope.tools.active === 'pipeSurface') {
                pipeLayer = getLayer('grid', 'waterchain');
                pipeLayer.on('mousemove', highlightSurface);
                pipeLayer.on('mouseout', highlightSurface);
              }
            });
          }
        } else {
          pipeLayer = getLayer('grid', 'pipe');
          if (pipeLayer) {
            // icon inactive
            angular.element(".surface-info").removeClass("icon-active");
            pipeLayer.off('mousemove', highlightSurface);
            pipeLayer.off('mouseout', highlightSurface);
          }
          MapService.removeLayer(surfaceLayer);
        }
      });
    }
  };
}]);


// var dummyResults = {
//   "type":
//   "FeatureCollection",
//   "features":
//     [
//       {
//         "geometry":
//           {
//             "type": "Point",
//             "coordinates": [5.25, 52.517]
//           },
//         "type": "Feature",
//         "properties":
//           {
//             "id": 1,
//             "code": "3201",
//             "name": "Stichtsch Ankeveensche Polder",
//             "timeseries":
//               [
//                 {
//                   "data": [1230764400000,1230850800000,1230937200000,1231023600000,1231110000000,1231196400000,1231282800000,1231369200000,1231455600000,1231542000000,1231628400000,1231714800000,1231801200000,1231887600000,1231974000000,1232060400000,1232146800000,1232233200000,1232319600000,1232406000000,1232492400000,1232578800000,1232665200000,1232751600000,1232838000000,1232924400000,1233010800000,1233097200000,1233183600000,1233270000000,1233356400000,1233442800000,1233529200000,1233615600000,1233702000000,1233788400000,1233874800000,1233961200000,1234047600000,1234134000000,1234220400000,1234306800000,1234393200000,1234479600000,1234566000000,1234652400000,1234738800000,1234825200000,1234911600000,1234998000000,1235084400000,1235170800000,1235257200000,1235343600000,1235430000000,1235516400000,1235602800000,1235689200000,1235775600000,1235862000000,1235948400000,1236034800000,1236121200000,1236207600000,1236294000000,1236380400000,1236466800000,1236553200000,1236639600000,1236726000000,1236812400000,1236898800000,1236985200000,1237071600000,1237158000000,1237244400000,1237330800000,1237417200000,1237503600000,1237590000000,1237676400000,1237762800000,1237849200000,1237935600000,1238022000000,1238108400000,1238194800000,1238281200000,1238367600000,1238454000000,1238540400000,1238626800000,1238713200000,1238799600000,1238886000000,1238972400000,1239058800000,1239145200000,1239231600000,1239318000000,1239404400000,1239490800000,1239577200000,1239663600000,1239750000000,1239836400000,1239922800000,1240009200000,1240095600000,1240182000000,1240268400000,1240354800000,1240441200000,1240527600000,1240614000000,1240700400000,1240786800000,1240873200000,1240959600000,1241046000000,1241132400000,1241218800000,1241305200000,1241391600000,1241478000000,1241564400000,1241650800000,1241737200000,1241823600000,1241910000000,1241996400000,1242082800000,1242169200000,1242255600000,1242342000000,1242428400000,1242514800000,1242601200000,1242687600000,1242774000000,1242860400000,1242946800000,1243033200000,1243119600000,1243206000000,1243292400000,1243378800000,1243465200000,1243551600000,1243638000000,1243724400000,1243810800000,1243897200000,1243983600000,1244070000000,1244156400000,1244242800000,1244329200000,1244415600000,1244502000000,1244588400000,1244674800000,1244761200000,1244847600000,1244934000000,1245020400000,1245106800000,1245193200000,1245279600000,1245366000000,1245452400000,1245538800000,1245625200000,1245711600000,1245798000000,1245884400000,1245970800000,1246057200000,1246143600000,1246230000000,1246316400000,1246402800000,1246489200000,1246575600000,1246662000000,1246748400000,1246834800000,1246921200000,1247007600000,1247094000000,1247180400000,1247266800000,1247353200000,1247439600000,1247526000000,1247612400000,1247698800000,1247785200000,1247871600000,1247958000000,1248044400000,1248130800000,1248217200000,1248303600000,1248390000000,1248476400000,1248562800000,1248649200000,1248735600000,1248822000000,1248908400000,1248994800000,1249081200000,1249167600000,1249254000000,1249340400000,1249426800000,1249513200000,1249599600000,1249686000000,1249772400000,1249858800000,1249945200000,1250031600000,1250118000000,1250204400000,1250290800000,1250377200000,1250463600000,1250550000000,1250636400000,1250722800000,1250809200000,1250895600000,1250982000000,1251068400000,1251154800000,1251241200000,1251327600000,1251414000000,1251500400000,1251586800000,1251673200000,1251759600000,1251846000000,1251932400000,1252018800000,1252105200000,1252191600000,1252278000000,1252364400000,1252450800000,1252537200000,1252623600000,1252710000000,1252796400000,1252882800000,1252969200000,1253055600000,1253142000000,1253228400000,1253314800000,1253401200000,1253487600000,1253574000000,1253660400000,1253746800000,1253833200000,1253919600000,1254006000000,1254092400000,1254178800000,1254265200000,1254351600000,1254438000000,1254524400000,1254610800000,1254697200000,1254783600000,1254870000000,1254956400000,1255042800000,1255129200000,1255215600000,1255302000000,1255388400000,1255474800000,1255561200000,1255647600000,1255734000000,1255820400000,1255906800000,1255993200000,1256079600000,1256166000000,1256252400000,1256338800000,1256425200000,1256511600000,1256598000000,1256684400000,1256770800000,1256857200000,1256943600000,1257030000000,1257116400000,1257202800000,1257289200000,1257375600000,1257462000000,1257548400000,1257634800000,1257721200000,1257807600000,1257894000000,1257980400000,1258066800000,1258153200000,1258239600000,1258326000000,1258412400000,1258498800000,1258585200000,1258671600000,1258758000000,1258844400000,1258930800000,1259017200000,1259103600000,1259190000000,1259276400000,1259362800000,1259449200000,1259535600000,1259622000000,1259708400000,1259794800000,1259881200000,1259967600000,1260054000000,1260140400000,1260226800000,1260313200000,1260399600000,1260486000000,1260572400000,1260658800000,1260745200000,1260831600000,1260918000000,1261004400000,1261090800000,1261177200000,1261263600000,1261350000000,1261436400000,1261522800000,1261609200000,1261695600000,1261782000000,1261868400000,1261954800000,1262041200000,1262127600000,1262214000000,1262300400000],
//                   "type": "timestamp",
//                   "name": "timestamp",
//                   "unit": "ms",
//                   "quantity": "time"
//                 },
//                 {
//                   "data": [0,0.6,0,0.1,7.8,0,0.6,0.1,0,0,0,0,2.1,3,0.2,0,0,5.4,2.9,5.7,0,0,15.6,13.1,0.1,0,0,0,0,0,0,0,0,0.1,3.5,0.4,2.9,2.8,2,1.6,13.9,5.1,0.8,0.9,1.5,0,4.9,7.6,0.4,0,1.3,0,0.2,0.5,0.3,0.1,0.8,1.4,1.5,0,1.6,0,0.2,0,1.3,0,7.3,2.9,1.3,3,0.5,1.3,0,1.5,0,0,0,0,0,0,0,0,8.2,12.1,3.2,5.3,10,4.6,1.1,0,0,0,0,0,0,0,0,0,4.1,0.1,3,6.2,0,0,0,0,0.4,0,0,0,0,0,0,0,0,1.4,5.6,0,0.5,0,0,0,0,0.7,2.7,8.8,0,0,1.7,0.2,0,0,0,2.6,0.9,9.4,15.9,4.5,0.6,0,0,0,0,0,0,22.3,2.5,1.6,0,0,0,0,0,0,0.1,0.5,0,0,10.7,4.3,0.7,15.9,1.5,0,0,0.8,3.9,0.2,0.4,0,0,0.4,1.4,0,0,0,0,0,0,0.1,0,0,0,0,8.1,0,2.4,2.5,18.3,1.5,2.1,0.4,5.6,1.7,0.6,1.8,0,4.6,1.8,1.9,5.2,0,1.2,12.5,3,4.9,0.3,0,0,0,2,0.8,0,7.4,0.3,0,0,0,0,0,0,0,1.4,0,1.4,0.1,0,0,0,0,0,0,4.4,0,0,0,0.9,0.5,0,1,13.5,7,0,0,0.6,2.6,7.7,27.3,0.9,0.5,0,0,0,0,0,0,0,2.6,0.7,0,0,0,0,0,0,0,0,0,0,0,0,0,1.7,5.5,0.5,0.1,2,0.1,4.3,18,20.7,0,7.4,1.5,5.8,0.2,0,0,1.1,1.2,0.3,0.2,0,0,2.5,0.9,0,5,6.1,1,0.1,0,0,0,0,13.8,1,8.4,20.1,8,1.3,2.6,0.2,0.1,0.9,4,0.9,1.6,4,2.8,1.2,0.1,0.7,0,6,5.8,3.7,15.1,0.9,7.4,8.6,7,7.6,2,0.1,0,4.5,6,9.2,6.4,4.9,3.1,0.7,7.4,0.8,0.1,0,0,0,0,2.4,1,0,1.4,8,2.2,0.3,0.4,12,8.9,0.2,2.6,0,6,0.3,0],
//                   "type": "float",
//                   "name": "test2",
//                   "unit": "ampère",
//                   "quantity": "1,1,1,2-tetrachloor-2-fluorethaan"
//                 },
//                 {
//                   "data": [0,0.6,0,0.1,7.8,0,0.6,0.1,0,0,0,0,2.1,3,0.2,0,0,5.4,2.9,5.7,0,0,15.6,13.1,0.1,0,0,0,0,0,0,0,0,0.1,3.5,0.4,2.9,2.8,2,1.6,13.9,5.1,0.8,0.9,1.5,0,4.9,7.6,0.4,0,1.3,0,0.2,0.5,0.3,0.1,0.8,1.4,1.5,0,1.6,0,0.2,0,1.3,0,7.3,2.9,1.3,3,0.5,1.3,0,1.5,0,0,0,0,0,0,0,0,8.2,12.1,3.2,5.3,10,4.6,1.1,0,0,0,0,0,0,0,0,0,4.1,0.1,3,6.2,0,0,0,0,0.4,0,0,0,0,0,0,0,0,1.4,5.6,0,0.5,0,0,0,0,0.7,2.7,8.8,0,0,1.7,0.2,0,0,0,2.6,0.9,9.4,15.9,4.5,0.6,0,0,0,0,0,0,22.3,2.5,1.6,0,0,0,0,0,0,0.1,0.5,0,0,10.7,4.3,0.7,15.9,1.5,0,0,0.8,3.9,0.2,0.4,0,0,0.4,1.4,0,0,0,0,0,0,0.1,0,0,0,0,8.1,0,2.4,2.5,18.3,1.5,2.1,0.4,5.6,1.7,0.6,1.8,0,4.6,1.8,1.9,5.2,0,1.2,12.5,3,4.9,0.3,0,0,0,2,0.8,0,7.4,0.3,0,0,0,0,0,0,0,1.4,0,1.4,0.1,0,0,0,0,0,0,4.4,0,0,0,0.9,0.5,0,1,13.5,7,0,0,0.6,2.6,7.7,27.3,0.9,0.5,0,0,0,0,0,0,0,2.6,0.7,0,0,0,0,0,0,0,0,0,0,0,0,0,1.7,5.5,0.5,0.1,2,0.1,4.3,18,20.7,0,7.4,1.5,5.8,0.2,0,0,1.1,1.2,0.3,0.2,0,0,2.5,0.9,0,5,6.1,1,0.1,0,0,0,0,13.8,1,8.4,20.1,8,1.3,2.6,0.2,0.1,0.9,4,0.9,1.6,4,2.8,1.2,0.1,0.7,0,6,5.8,3.7,15.1,0.9,7.4,8.6,7,7.6,2,0.1,0,4.5,6,9.2,6.4,4.9,3.1,0.7,7.4,0.8,0.1,0,0,0,0,2.4,1,0,1.4,8,2.2,0.3,0.4,12,8.9,0.2,2.6,0,6,0.3,0],
//                   "type": "float",
//                   "name": "NEERSG",
//                   "unit": "millimeter",
//                   "quantity": null
//                 }
//               ]
//           }
//       }
//     ]
// };

/**
 * Add non-tiled d3 vector layer for currents.
 *
 * Implemented as a layer to display current speed/direction on the map.
 */
app.directive('temporalVectorLayer', ['UtilService', 'MapService',
  function (UtilService, MapService) {

  // declaring constants:
  var API_URL = '/api/v1/tiles/location/5/16/10.geojson';

  // declaring local vars
  var tvData,
      mustDrawTVLayer,
      setTVData,
      createTVLayer,
      updateTVLayer,
      d3TVLayer,
      getTimeIndex,
      previousTimeIndex,
      changeTVData,
      clearTVLayer;

  mustDrawTVLayer = function (scope) {
    return scope.mapState.layers.flow.active;
  };

  setTVData = function () {

    var response, request = new XMLHttpRequest();
    request.open("GET", API_URL, true);

    request.onreadystatechange = function () {
      /*jshint evil: true */
      if (request.readyState === 4 && request.status === 200) {
        if (window.JSON) {
          response = JSON.parse(request.responseText);
        } else {
          response = eval("(" + request.responseText + ")");
        }
        tvData = response;
      }
    };
    request.send();
  };

  getTimeIndex = function (scope, tvData, stepSize) {

    var virtualNow = scope.timeState.at,
        relevantTimestamps = tvData.features[0].properties.timeseries[0].data,
        currentTimestamp,
        minTimestamp,
        maxTimestamp;

    if (relevantTimestamps.length === 0) {
      console.log("[E] we don't have any relevant timestamps (i.e. no data!)");
      return;
    }

    minTimestamp = relevantTimestamps[0];
    maxTimestamp = relevantTimestamps[relevantTimestamps.length - 1];

    if (virtualNow < minTimestamp) {

      previousTimeIndex = 0;
      clearTVLayer();
      return;

    } else if ( virtualNow > maxTimestamp) {

      clearTVLayer();
      return;

    } else {

      var i,
          startIndex = previousTimeIndex || 0,
          endIndex = relevantTimestamps.length - startIndex;

      for (i = startIndex; i < endIndex; i++) {

        currentTimestamp = relevantTimestamps[i];
        if (currentTimestamp >= virtualNow
            && currentTimestamp < virtualNow + stepSize) {

          return i;
        }
      }
    }
  };

  /**
   * Creates svg layer in leaflet's overlaypane and adds current speed/direction
   * as arrows
   *
   * @parameter {object} scope - A ng scope s.t. scope.map is defined
   * @parameter {object} data - Object
   * @return    {object} eventLayer - Leaflet layer object
   */
  createTVLayer = function (scope, data) {

    // if d3currentlayer does not exist atm, create it.
    if (d3TVLayer === undefined) {
      d3TVLayer = L.nonTiledGeoJSONd3(data, {
        ext: 'd3',
        name: 'current',
        selectorPrefix: 'a',
        class: 'current-arrow'
      });
    }

    MapService.addLayer(d3TVLayer);

    // for backwards compatibility.
    d3TVLayer.g = d3TVLayer._container.selectAll("g");
    d3TVLayer.reset = d3TVLayer._onMove;

    return d3TVLayer;
  };

  /**
   * Updates svg layer in leaflet's overlaypane with new data object
   *
   * First call the reset function to give the svg enough space for the
   * new data.Identify path elements with data objects via id and update,
   * create or remove elements.
   *
   * @parameter {object} currentLayer - currentLayer object to update
   * @parameter {object} data - data object
   * @returns {void}
   */
  updateTVLayer = function (tvLayer, data, timeIndex) {
    tvLayer._data = data;
    tvLayer._refreshDataForCurrents(timeIndex);
  };

  clearTVLayer = function () {
    d3.selectAll("polygon.current-arrow").remove();
  };

  return {
    restrict: 'A',
    link: function (scope, element, attrs) {

      var previousTimeIndex,
          STEP_SIZE = 86400000,
          tvLayer,
          timeIndex,
          getTimeIndexAndUpdate;

      getTimeIndexAndUpdate = function () {

        if (tvData && mustDrawTVLayer(scope)) {
          timeIndex = getTimeIndex(scope, tvData, STEP_SIZE);
          if (timeIndex !== undefined) {
            console.log('kom ik hier???');
            previousTimeIndex = timeIndex;
            updateTVLayer(tvLayer, tvData, timeIndex);
          }
        }
      };

      setTVData();

      scope.$watch('timeState.at', function (newVal, oldVal) {

        if (newVal === oldVal) { return; }

        if (!tvLayer && MapService.isMapDefined()) {
          tvLayer = createTVLayer(scope, {
            type: "FeatureCollection",
            features: []
          });
        }

        getTimeIndexAndUpdate();
      });

      scope.$watch('mapState.zoom', function (newVal, oldVal) {

        if (newVal === oldVal) { return; }

        clearTVLayer();
        getTimeIndexAndUpdate();
      });

      scope.$watch('mapState.layers.flow.active', function (newVal, oldVal) {

        if (newVal === oldVal) { return; }

        clearTVLayer();
        if (newVal && scope.timeState.hidden !== false) {
          scope.toggleTimeline();
        }
        getTimeIndexAndUpdate();
      });
    }
  };
}]);
