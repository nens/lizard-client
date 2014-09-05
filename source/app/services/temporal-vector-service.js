app.service('TemporalVectorService', ['MapService', function (MapService) {

  // declaring local vars
  var tvData,
      mustDrawTVLayer,
      setTVData,
      createTVLayer,
      updateTVLayer,
      d3TVLayer,
      getTimeIndex,
      getTimeIndexAndUpdate,
      previousTimeIndex,
      changeTVData,
      clearTVLayer,
      timeIndex,
      tvLayer,
      STEP_SIZE = 86400000,
      API_URL = '/api/v1/tiles/location/5/16/10.geojson';

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

    } else if (virtualNow > maxTimestamp) {

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


  mustDrawTVLayer = function (scope) {
    return scope.mapState.layers.flow.active;
  };


  return {
    createTVLayer: createTVLayer,
    updateTVLayer: updateTVLayer,
    clearTVLayer: clearTVLayer,
    mustDrawTVLayer: mustDrawTVLayer,
    getTimeIndex: getTimeIndex
  };

}]);