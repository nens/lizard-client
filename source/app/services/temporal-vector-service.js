app.service('TemporalVectorService', ['MapService', function (MapService) {

  // declaring local vars
  var tvData,
      tvLayer,
      mustDrawTVLayer,
      getTVData,
      getTimeIndex,
      getTimeIndexAndUpdate,
      createTVLayer,
      updateTVLayer,
      clearTVLayer,
      d3TVLayer,
      timeIndex,
      previousTimeIndex,
      resetTimeindex,
      STEP_SIZE = 86400000,
      API_URL = '/api/v1/tiles/location/5/16/10.geojson';


  /**
   * A synchronious call to retrieve the timeseries data from the API endpoint;
   * NB! This uses a hardcoded URL for now, suince we dont have any actual data
   * atm.
   *
   * @returns {object} - The geojson object with the timeseries data.
   */
  getTVData = function () {

    var response, request = new XMLHttpRequest();
    request.open("GET", API_URL, false);

    request.onreadystatechange = function () {
      /*jshint evil: true */
      if (request.readyState === 4 && request.status === 200) {
        if (window.JSON) {
          response = JSON.parse(request.responseText);
        } else {
          response = eval("(" + request.responseText + ")");
        }
      }
    };
    request.send();
    return response;
  };


  /**
   * Retrieves both the index (for data representing the next animation frame
   * to be drawn) and, if succesful in the previous step, calls updateTVLayer
   *
   * @param {scope} scope - A ng scope s.t. scope.map is defined
   * @param {object} tvLayer - a Leaflet layer for the vector drawings
   * @param {object} tvData - geojson representing the timeseries data
   *
   * @returns {void}
   */
  getTimeIndexAndUpdate = function (scope, tvLayer, tvData) {

    if (tvData && mustDrawTVLayer(scope)) {

      timeIndex = getTimeIndex(
        scope,
        tvData
      );

      if (timeIndex !== undefined) {

        previousTimeIndex = 0;

        updateTVLayer(
          tvLayer,
          tvData,
          timeIndex
        );
      }
    }
  };


  /**
   * Creates svg layer in leaflet's overlaypane and adds current speed/direction
   * as arrows
   *
   * @parameter {object} scope - A ng scope s.t. scope.map is defined
   * @parameter {object} data - A geojson object representing timeseries
   *
   * @return {object} eventLayer - Leaflet layer object
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
   *
   * @returns {void}
   */
  updateTVLayer = function (tvLayer, data, timeIndex) {
    tvLayer._data = data;
    tvLayer._refreshDataForCurrents(timeIndex);
  };


  /**
   * Clears the temporal vector layer; removes all polygon elements with
   * class "current-arrow", thus clearing the layer.
   *
   * @returns {void}
   */
  clearTVLayer = function () {
    d3.selectAll("polygon.current-arrow").remove();
  };


  /**
   * @param {object} scope - A ng scope s.t. scopemap is defined
   * @param {object} tvData - A geojson object representing the timeseries data.
   *
   * @returns {integer}
   */
  getTimeIndex = function (scope, tvData) {

    var virtualNow = scope.timeState.at,
        relevantTimestamps = tvData.features[0].properties.timeseries[0].data,
        currentTimestamp,
        minTimestamp,
        maxTimestamp;

    if (relevantTimestamps.length === 0) {
      if (window.JS_DEBUG) {
        console.log("[E] we don't have any relevant timestamps (i.e. no data!)");
      }
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
            && currentTimestamp < virtualNow + STEP_SIZE) {

          return i;
        }
      }
    }
  };


  /**
   * Check whether we need to draw the temporal vector layer.
   *
   * @returns {boolean}
   */
  mustDrawTVLayer = function (scope) {
    return scope.mapState.layers.flow.active;
  };


  /**
   * Resets the previous timeStepIndex to 0, to prevent that dragging the brush
   * along the timeline only works forwards: now one may drag backwards
   *
   * @returns {void}
   */
  var resetPreviousTimeIndex = function () {

    //previousTimeIndex = undefined;
    //this.timeIndex = 0;
    this.previousTimeIndex = undefined;
  };

  return {
    createTVLayer: createTVLayer,
    resetPreviousTimeIndex: resetPreviousTimeIndex,
    clearTVLayer: clearTVLayer,
    mustDrawTVLayer: mustDrawTVLayer,
    getTVData: getTVData,
    getTimeIndex: getTimeIndex,
    getTimeIndexAndUpdate: getTimeIndexAndUpdate,
    resetTimeIndex: resetPreviousTimeIndex
  };

}]);