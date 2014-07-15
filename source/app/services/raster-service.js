/**
 * Service to handle raster requests.
 */
app.service("RasterService", ["Restangular", "UtilService", "CabinetService",
  function (Restangular, UtilService, CabinetService) {

  /**
   * Hard coded rain variables.
   *
   * timeResolution: smallest time resolution for rain in ms (5 min.)
   * minTimeBetweenFrames: minimum time between frames in ms.
   * imageUrlBase: url to  get WMS rain images.
   */
  var rainInfo = {
    "timeResolution": 300000,
    "minTimeBetweenFrames": 250,
    "imageUrlBase": 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=demo%3Aradar&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME='
  };

  // Set by rain controller and get by timeline
  var intensityData;

  var setIntensityData = function (data) {
    intensityData = data;
  };

  var getIntensityData = function () {
    return intensityData;
  };

  /**
   * Gets rain from server.
   *
   * @param  {int} start    start of rainserie
   * @param  {int} stop     end of rainserie
   * @param  {object} geom   location of rainserie in {lat: int, lng: int} or leaflet bounds object
   * @param  {int} aggWindow width of the aggregation
   * @param  {string} agg aggregation method eg. 'sum', 'rrc'
   * @return {promise} returns a thennable promise which may resolve with rain data on response
   */
  var getRain = function (start, stop, geom, aggWindow, agg) {
    var stopString = stop.toISOString().split('.')[0];
    var startString = start.toISOString().split('.')[0];
    var wkt;
    if (geom.lat && geom.lng) {
      // geom is a latLng object
      wkt = "POINT(" + geom.lng + " " + geom.lat + ")";
    } else {
      wkt = "POLYGON(("
            + geom.getWest() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getSouth()
            + "))";
    }
    return CabinetService.raster().get({
        raster_names: 'demo:radar',
        geom: wkt,
        srs: 'EPSG:4326',
        start: startString,
        stop: stopString,
        window: aggWindow,
        agg: agg
      });
  };


  /**
   * Get raster data from server.
   * NOTE: maybe add a callback as argument?
   */
  var formatRasterCurve = function (data) {
    var formatted = [];
    for (var i in data[0]) {
      var datarow = [data[0][i], data[1][i]];
      formatted.push(datarow);
    }
    return formatted;
  };
  
  var getRasterData = function (raster_names, linestring_wkt, srs, agg, timeout) {
    // build url
    // NOTE: first part hardcoded
    var url = "api/v1/rasters/";
    url += "?raster_names=" + raster_names;
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    if (agg !== undefined) {
      url += "&agg=" + agg;
    }
    var config = {
      method: 'GET',
      url: url
    };
    if (timeout) {
      config.timeout = $scope.mapState.timeout.promise;
    }
    // get aggregated raster data from serverr
    $http(config)
      .success(function (data) {
        if (agg === 'curve') {
          $scope.data = formatRasterCurve(data);
          $scope.box.content = {
            yLabel: 'hoogte [mNAP]',
            xLabel: '[%]'
          };
        } else if (agg === 'counts') {
          $scope.data = data;
        } else if (raster_names === 'elevation' && agg === undefined) {
          $scope.box.type = "profile";
          $scope.box.content = {
            data: data,
            yLabel: 'hoogte [mNAP]',
            xLabel: 'afstand [m]'
          };
        } else {
          $scope.box.content = {
            data: data
          };
        }
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        if (!timeout) {
          console.info("failed getting profile data from server");
        }
      });
  };

  return {
    rainInfo: rainInfo,
    getIntensityData: getIntensityData,
    setIntensityData: setIntensityData,
    getRain: getRain,
    getRasterData: getRasterData,
  };

}]);
