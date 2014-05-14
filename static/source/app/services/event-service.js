/**
 * Service to handle raster requests.
 */
app.service("EventService", ["Restangular", "UtilService", "$q",
  function (Restangular, UtilService, $q) {


  // COLOR MODEL
  var colors =  {
    3: ["#27ae60", "#2980b9", "#8e44ad"],
    4: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50"],
    5: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12"],
    6: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400"],
    7: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400", "#c0392b"],
    8: ["#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f39c12", "#d35400", "#c0392b", "#16a085"]
  };

  /**
   * Build object template to hold information per event type.
   * 
   * @param object eventTypes object with event ids
   * @returns  
   */
  var buildEventTypesTemplate = function (eventTypes) {
  
    var eventTypesTemplate = {};
    for (var i = 0; i < eventTypes.length; i++) {
      eventTypesTemplate[eventTypes[i].event_series] = {};
    }
    eventTypesTemplate.count = 0;

    return eventTypesTemplate;
  };

  /**
   * Counts the events currently within the temporal and spatial extent
   * 
   * Called when the user pans the map or zooms the timeline.
   * The aggregate directive flags events that are visible on the map at
   * feature.inSpatExtent. The timeline directive flags events that are
   * currently on the map at inTempExtent attribute. This function sums it all
   * up.
   */
  var countCurrentEvents = function (eventTypes, events) {
    var i,
        eventType;
    var typeLength = eventTypes.length;
    for (i = 0; i < typeLength; i++) {
      eventType = eventTypes[i];
      events.types[eventType.event_series].currentCount = 0;
    }
    for (i = 0; i < events.data.features.length; i++) {
      var feature = events.data.features[i];
      if (feature.inTempExtent && feature.inSpatExtent) {
        events.types[feature.properties.event_series].currentCount++;
      }
    }
  };


  /**
   * Adds events to event data object.
   * 
   * Takes a geojson compliant data object which is added to another geojson
   * compliant data object. In order to identify the type of events in the
   * longData object, an eventOrder is added to the features. This eventOrder
   * is also used in the timeline for the yAxis. The indiviudual features also
   * get an id which is used by d3 to identify the events in the update
   * pattern.
   * 
   * @param: object geojson compliant data object to add too
   * @param: object geojson compliant data object to add
   * @param: str containing the type of the event to add
   * @returns: object geojson compliant data object 
   */
  var addEvents = function (longData, shortData, eventSeriesId) {
    // Create event identifier
    var eventOrder;
    if (longData.features === undefined) { longData.features = []; }
    if (longData.features.length === 0) {
      eventOrder = 1;
    } else {
      var maxEventOrder = 0;
      angular.forEach(longData.features, function (feature) {
        maxEventOrder = feature.event_order > maxEventOrder ?
                        feature.event_order : maxEventOrder;
      });
      eventOrder = maxEventOrder + 1;
    }
    angular.forEach(shortData.features, function (feature) {
      feature.event_order = eventOrder;
      feature.color = colors[8][eventOrder];
      feature.id = eventSeriesId + feature.properties.timestamp +
                   feature.geometry.coordinates[0] +
                   feature.geometry.coordinates[1];
      longData.features.push(feature);
    });
    return {
      data: longData,
      order: eventOrder
    };
  };
  
  /**
   * Removes events from the data object.
   * 
   * Takes a geojson compliant data object and removes the features with the
   * given name. It also removes the metadata of these events and lowers the
   * eventOrder of all the event types which have a order that is greater than
   * the order of the removed event type.
   * 
   * @param: object geojson compliant data object 
   * @param: str containing the type of the event to remove
   * @returns: object geojson compliant data object 
   */
  var removeEvents = function (types, longData, eventSeriesId) {
    var eventOrder = types[eventSeriesId].event_type;
    var iterations = longData.features.length;
    for (var i = 0; i < iterations; i++) {
      var index = iterations - 1 - i;
      var feature = longData.features[index]; // Go from back to front to not mess with the order
      if (feature.properties.event_series === eventSeriesId) {
        var j = longData.features.indexOf(feature);
        longData.features.splice(j, 1);
      }
      else if (feature.event_type > eventOrder) {
        feature.event_type = feature.event_type - 1;
      }
    }
    for (var key in types) {
      var eType = types[key];
      if (eType.event_type > eventOrder) {
        eType.event_type = eType.event_type - 1;
      }
    }
    return longData;
  };

  /**
   * Adds a color attribute to features in event data object
   * 
   * Takes a geojson compliant data object and adds a color to all the
   * features. If there is only one event type, the events are colored on the
   * basis of sub_event_type. If there are multiple event types active, the
   * events are colored on the basis of a colorscale on the scope and the type
   * of the feature.
   * 
   * @param: object geojson compliant data object with all the events
   */
  var addColor = function (longData, count, scale) {
    if (count === 1) {
      scale = d3.scale.ordinal().range(colors[8]);
      angular.forEach(longData.features, function (feature) {
        feature.color = scale(feature.properties.category);
      });
    } else {
      angular.forEach(longData.features, function (feature) {
        feature.color = scale(feature.properties.event_series);
      });
    }
  };

  var eventsResource,
      objectEventsResource;
  
  Restangular.setRequestSuffix('?page_size=0');
  eventsResource = Restangular.one('api/v1/events/');
  // TODO: Restangular.one('api/v1/objects/');
  objectEventsResource = function (name, objectID) {
    var defer = $q.defer();
    setTimeout(function () {
      var response = {"type": "FeatureCollection", "features": [{"id": 3503, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.954955496434113, 52.501379130617515]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp": 1389819600000, "event_series": "Alarmen"}}, {"id": 3504, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.954955496434113, 52.501379130617515]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp": 1389906000000, "event_series": "Alarmen"}}, {"id": 3505, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.986668114895552, 52.50079113117614]}, "properties": {"category": "PUTDEKSELWEG", "value": "Rioolverstopping", "timestamp": 1389992400000, "event_series": "Alarmen"}}, {"id": 3500, "type": "Feature", "geometry": {"type": "Point", "coordinates": [4.974311869167772, 52.522110756663764]}, "properties": {"category": "STANKOVERLAST", "value": "Rioolverstopping", "timestamp": 1389560400000, "event_series": "Alarmen"}}]};
      defer.resolve(response);
    }, 500);
    return defer.promise;
  };


  return {
    getEvents: eventsResource.get,
    getEventsForObject: objectEventsResource,
    buildEventTypesTemplate: buildEventTypesTemplate,
    countCurrentEvents: countCurrentEvents,
    addEvents: addEvents,
    removeEvents: removeEvents,
    colors: colors,
    addColor: addColor
  };
}]);