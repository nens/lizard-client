
angular.module('lizard-nxt')
  .service('TemporalVectorService', ['MapService',
  function (MapService) {

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
      API_URL = '/api/v1/tiles/location/5/16/10.geojson',
      USE_MOCKED_GEOJSON = true,
      MOCKED_GEOJSON = {type: "FeatureCollection", features: [{geometry: {type: "Point", coordinates: [5.2, 52.5]}, type: "Feature", properties: {id: 1, code: 67578, name: 786786, timeseries: [{data: [1230764400000, 1230850800000, 1230937200000, 1231023600000, 1231110000000, 1231196400000, 1231282800000, 1231369200000, 1231455600000, 1231542000000, 1231628400000, 1231714800000, 1231801200000, 1231887600000, 1231974000000, 1232060400000, 1232146800000, 1232233200000, 1232319600000, 1232406000000, 1232492400000, 1232578800000, 1232665200000, 1232751600000, 1232838000000, 1232924400000, 1233010800000, 1233097200000, 1233183600000, 1233270000000, 1233356400000, 1233442800000, 1233529200000, 1233615600000, 1233702000000, 1233788400000, 1233874800000, 1233961200000, 1234047600000, 1234134000000, 1234220400000, 1234306800000, 1234393200000, 1234479600000, 1234566000000, 1234652400000, 1234738800000, 1234825200000, 1234911600000, 1234998000000, 1235084400000, 1235170800000, 1235257200000, 1235343600000, 1235430000000, 1235516400000, 1235602800000, 1235689200000, 1235775600000, 1235862000000, 1235948400000, 1236034800000, 1236121200000, 1236207600000, 1236294000000, 1236380400000, 1236466800000, 1236553200000, 1236639600000, 1236726000000, 1236812400000, 1236898800000, 1236985200000, 1237071600000, 1237158000000, 1237244400000, 1237330800000, 1237417200000, 1237503600000, 1237590000000, 1237676400000, 1237762800000, 1237849200000, 1237935600000, 1238022000000, 1238108400000, 1238194800000, 1238281200000, 1238367600000, 1238454000000, 1238540400000, 1238626800000, 1238713200000, 1238799600000, 1238886000000, 1238972400000, 1239058800000, 1239145200000, 1239231600000, 1239318000000, 1239404400000, 1239490800000, 1239577200000, 1239663600000, 1239750000000, 1239836400000, 1239922800000, 1240009200000, 1240095600000, 1240182000000, 1240268400000, 1240354800000, 1240441200000, 1240527600000, 1240614000000, 1240700400000, 1240786800000, 1240873200000, 1240959600000, 1241046000000, 1241132400000, 1241218800000, 1241305200000, 1241391600000, 1241478000000, 1241564400000, 1241650800000, 1241737200000, 1241823600000, 1241910000000, 1241996400000, 1242082800000, 1242169200000, 1242255600000, 1242342000000, 1242428400000, 1242514800000, 1242601200000, 1242687600000, 1242774000000, 1242860400000, 1242946800000, 1243033200000, 1243119600000, 1243206000000, 1243292400000, 1243378800000, 1243465200000, 1243551600000, 1243638000000, 1243724400000, 1243810800000, 1243897200000, 1243983600000, 1244070000000, 1244156400000, 1244242800000, 1244329200000, 1244415600000, 1244502000000, 1244588400000, 1244674800000, 1244761200000, 1244847600000, 1244934000000, 1245020400000, 1245106800000, 1245193200000, 1245279600000, 1245366000000, 1245452400000, 1245538800000, 1245625200000, 1245711600000, 1245798000000, 1245884400000, 1245970800000, 1246057200000, 1246143600000, 1246230000000, 1246316400000, 1246402800000, 1246489200000, 1246575600000, 1246662000000, 1246748400000, 1246834800000, 1246921200000, 1247007600000, 1247094000000, 1247180400000, 1247266800000, 1247353200000, 1247439600000, 1247526000000, 1247612400000, 1247698800000, 1247785200000, 1247871600000, 1247958000000, 1248044400000, 1248130800000, 1248217200000, 1248303600000, 1248390000000, 1248476400000, 1248562800000, 1248649200000, 1248735600000, 1248822000000, 1248908400000, 1248994800000, 1249081200000, 1249167600000, 1249254000000, 1249340400000, 1249426800000, 1249513200000, 1249599600000, 1249686000000, 1249772400000, 1249858800000, 1249945200000, 1250031600000, 1250118000000, 1250204400000, 1250290800000, 1250377200000, 1250463600000, 1250550000000, 1250636400000, 1250722800000, 1250809200000, 1250895600000, 1250982000000, 1251068400000, 1251154800000, 1251241200000, 1251327600000, 1251414000000, 1251500400000, 1251586800000, 1251673200000, 1251759600000, 1251846000000, 1251932400000, 1252018800000, 1252105200000, 1252191600000, 1252278000000, 1252364400000, 1252450800000, 1252537200000, 1252623600000, 1252710000000, 1252796400000, 1252882800000, 1252969200000, 1253055600000, 1253142000000, 1253228400000, 1253314800000, 1253401200000, 1253487600000, 1253574000000, 1253660400000, 1253746800000, 1253833200000, 1253919600000, 1254006000000, 1254092400000, 1254178800000, 1254265200000, 1254351600000, 1254438000000, 1254524400000, 1254610800000, 1254697200000, 1254783600000, 1254870000000, 1254956400000, 1255042800000, 1255129200000, 1255215600000, 1255302000000, 1255388400000, 1255474800000, 1255561200000, 1255647600000, 1255734000000, 1255820400000, 1255906800000, 1255993200000, 1256079600000, 1256166000000, 1256252400000, 1256338800000, 1256425200000, 1256511600000, 1256598000000, 1256684400000, 1256770800000, 1256857200000, 1256943600000, 1257030000000, 1257116400000, 1257202800000, 1257289200000, 1257375600000, 1257462000000, 1257548400000, 1257634800000, 1257721200000, 1257807600000, 1257894000000, 1257980400000, 1258066800000, 1258153200000, 1258239600000, 1258326000000, 1258412400000, 1258498800000, 1258585200000, 1258671600000, 1258758000000, 1258844400000, 1258930800000, 1259017200000, 1259103600000, 1259190000000, 1259276400000, 1259362800000, 1259449200000, 1259535600000, 1259622000000, 1259708400000, 1259794800000, 1259881200000, 1259967600000, 1260054000000, 1260140400000, 1260226800000, 1260313200000, 1260399600000, 1260486000000, 1260572400000, 1260658800000, 1260745200000, 1260831600000, 1260918000000, 1261004400000, 1261090800000, 1261177200000, 1261263600000, 1261350000000, 1261436400000, 1261522800000, 1261609200000, 1261695600000, 1261782000000, 1261868400000, 1261954800000, 1262041200000, 1262127600000, 1262214000000, 1262300400000], type: "timestamp", name: "timestamp", unit: "ms", quantity: "time"}, {data: [0.2, 0.1, 0.1, 0.1, 0.1, 0.3, 0.4, 0.2, 0.1, 0.3, 0.4, 0.5, 0.3, 0.1, 0.3, 0.5, 0.2, 0.1, 0.1, 0.1, 0.4, 0.3, 0.1, 0.1, 0.3, 0.5, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7, 0.5, 0.2, 0.1, 0.1, 0.3, 0.6, 0.4, 0.5, 0.2, 0.1, 0.5, 0.8, 0.2, 0.8, 0.3, 0.5, 0.2, 0.7, 0.2, 0.3, 0.5, 0.4, 0.5, 0.4, 0.3, 0.8, 0.3, 0.5, 0.9, 0.7, 0.4, 0.3, 0.7, 0.8, 1.1, 1.4, 0.4, 0.3, 1.3, 0.3, 1.4, 0.7, 1.0, 1.0, 1.8, 1.5, 1.8, 2.0, 2.0, 1.6, 0.6, 1.7, 0.9, 0.4, 1.4, 1.0, 1.3, 2.0, 2.4, 2.5, 2.8, 2.7, 0.7, 1.7, 2.5, 0.8, 0.9, 1.1, 3.0, 2.2, 1.8, 2.8, 2.8, 3.4, 1.9, 2.3, 3.5, 2.5, 3.4, 3.6, 3.4, 2.6, 3.6, 2.9, 1.7, 2.3, 0.9, 2.3, 3.3, 3.4, 2.5, 1.7, 2.8, 0.9, 1.1, 2.0, 2.4, 3.0, 4.0, 3.6, 3.5, 3.5, 2.4, 1.0, 2.4, 1.6, 3.3, 2.8, 3.7, 3.0, 3.8, 3.7, 4.7, 3.9, 1.2, 2.1, 3.4, 4.9, 4.8, 4.3, 4.7, 4.8, 2.7, 2.1, 1.9, 2.6, 1.6, 3.4, 2.7, 2.3, 2.4, 4.4, 4.3, 1.9, 2.3, 3.1, 4.2, 3.8, 3.6, 2.8, 3.4, 3.2, 4.7, 4.8, 4.6, 3.3, 2.5, 2.3, 4.5, 5.1, 4.8, 4.3, 4.5, 4.7, 3.8, 3.7, 2.1, 2.6, 2.3, 1.8, 3.6, 1.7, 3.5, 3.7, 4.3, 4.6, 3.5, 1.8, 2.8, 3.5, 3.3, 2.9, 1.7, 2.5, 3.6, 3.8, 2.8, 2.9, 2.8, 3.2, 3.7, 3.8, 1.5, 3.4, 4.5, 4.2, 4.5, 3.4, 2.7, 2.3, 3.5, 2.4, 1.4, 2.9, 3.0, 4.2, 3.2, 2.5, 3.3, 3.9, 3.5, 2.8, 3.0, 3.8, 3.7, 1.1, 2.9, 1.8, 2.6, 3.0, 1.5, 2.9, 1.2, 2.4, 1.4, 1.9, 2.4, 1.4, 2.8, 3.2, 1.2, 2.5, 1.8, 2.3, 1.4, 2.0, 0.6, 1.8, 2.3, 2.6, 2.2, 1.6, 2.1, 2.1, 1.7, 2.0, 0.9, 2.0, 1.8, 1.1, 0.6, 0.5, 0.8, 0.6, 0.5, 1.5, 0.4, 0.7, 0.6, 1.4, 1.7, 0.7, 0.5, 1.4, 1.5, 1.2, 1.4, 1.0, 1.3, 1.0, 0.6, 1.2, 1.0, 0.3, 1.0, 0.3, 1.0, 0.3, 0.8, 1.1, 0.6, 0.7, 0.7, 0.3, 0.6, 0.4, 0.4, 0.3, 0.3, 0.2, 0.8, 0.3, 0.2, 0.2, 0.4, 0.2, 0.5, 0.2, 0.2, 0.4, 0.1, 0.7, 0.5, 0.7, 0.5, 0.2, 0.2, 0.1, 0.2, 0.4, 0.2, 0.1, 0.3, 0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.3, 0.3, 0.1, 0.2, 0.2, 0.4, 0.3, 0.1, 0.5, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2, 0.2, 0.2, 0.3, 0.1, 0.4, 0.2, 0.4, 0.2, 0.0, 0.1], "type": "float", "name": "speed", "unit": "amp\u00e8re", "quantity": "1,1,1,2-tetrachloor-2-fluorethaan"}, {"data": [0.0, 0.6, 0.0, 0.1, 7.8, 0.0, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 2.1, 3.0, 0.2, 0.0, 0.0, 5.4, 2.9, 5.7, 0.0, 0.0, 15.6, 13.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 3.5, 0.4, 2.9, 2.8, 2.0, 1.6, 13.9, 5.1, 0.8, 0.9, 1.5, 0.0, 4.9, 7.6, 0.4, 0.0, 1.3, 0.0, 0.2, 0.5, 0.3, 0.1, 0.8, 1.4, 1.5, 0.0, 1.6, 0.0, 0.2, 0.0, 1.3, 0.0, 7.3, 2.9, 1.3, 3.0, 0.5, 1.3, 0.0, 1.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 8.2, 12.1, 3.2, 5.3, 10.0, 4.6, 1.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.1, 0.1, 3.0, 6.2, 0.0, 0.0, 0.0, 0.0, 0.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.4, 5.6, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.7, 2.7, 8.8, 0.0, 0.0, 1.7, 0.2, 0.0, 0.0, 0.0, 2.6, 0.9, 9.4, 15.9, 4.5, 0.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 22.3, 2.5, 1.6, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.5, 0.0, 0.0, 10.7, 4.3, 0.7, 15.9, 1.5, 0.0, 0.0, 0.8, 3.9, 0.2, 0.4, 0.0, 0.0, 0.4, 1.4, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 8.1, 0.0, 2.4, 2.5, 18.3, 1.5, 2.1, 0.4, 5.6, 1.7, 0.6, 1.8, 0.0, 4.6, 1.8, 1.9, 5.2, 0.0, 1.2, 12.5, 3.0, 4.9, 0.3, 0.0, 0.0, 0.0, 2.0, 0.8, 0.0, 7.4, 0.3, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.4, 0.0, 1.4, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.4, 0.0, 0.0, 0.0, 0.9, 0.5, 0.0, 1.0, 13.5, 7.0, 0.0, 0.0, 0.6, 2.6, 7.7, 27.3, 0.9, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.6, 0.7, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.7, 5.5, 0.5, 0.1, 2.0, 0.1, 4.3, 18.0, 20.7, 0.0, 7.4, 1.5, 5.8, 0.2, 0.0, 0.0, 1.1, 1.2, 0.3, 0.2, 0.0, 0.0, 2.5, 0.9, 0.0, 5.0, 6.1, 1.0, 0.1, 0.0, 0.0, 0.0, 0.0, 13.8, 1.0, 8.4, 20.1, 8.0, 1.3, 2.6, 0.2, 0.1, 0.9, 4.0, 0.9, 1.6, 4.0, 2.8, 1.2, 0.1, 0.7, 0.0, 6.0, 5.8, 3.7, 15.1, 0.9, 7.4, 8.6, 7.0, 7.6, 2.0, 0.1, 0.0, 4.5, 6.0, 9.2, 6.4, 4.9, 3.1, 0.7, 7.4, 0.8, 0.1, 0.0, 0.0, 0.0, 0.0, 2.4, 1.0, 0.0, 1.4, 8.0, 2.2, 0.3, 0.4, 12.0, 8.9, 0.2, 2.6, 0.0, 6.0, 0.3, 0.0], type: "float", name: "direction", unit: "amp\u00e8re", quantity: "1,1,1,2-tetrachloor-2-fluorethaan"}]}}]};


  /**
   * @function
   * @description - A synchronious call to retrieve the timeseries data from the
   *                API endpoind. This uses a hardcoded URL for now, suince we dont
   *                have any actual data atm.
   *
   * @returns {object} - The geojson object with the timeseries data.
   */
  getTVData = function () {

    /*jshint evil: true */

    // tmp solution, until HBASE serves correct data //////////////////////////

    if (USE_MOCKED_GEOJSON) { return MOCKED_GEOJSON; }

    // original solution, gets geosjon from remote source /////////////////////

    var response, request = new XMLHttpRequest();
    request.open("GET", API_URL, false);

    request.onreadystatechange = function () {
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
   * @function
   * @description - Retrieves both the index (for data representing the next
   *                animation frame to be drawn) and, if succesful in the
   *                previous step, calls updateTVLayer
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

        //previousTimeIndex = timeIndex;

        updateTVLayer(
          tvLayer,
          tvData,
          timeIndex
        );
      }
    }
  };


  /**
   * @function
   * @description Creates svg layer in leaflet's overlaypane and adds current speed/direction
   *              as arrows
   * @param {object} scope - A ng scope s.t. scope.map is defined
   * @param {object} data - A geojson object representing timeseries
   *
   * @returns {object} - Leaflet layer object
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
   * @function
   * @description Updates svg layer in leaflet's overlaypane with new data object
   * @param {object} tvLayer - currentLayer object to update
   * @param {object} data - data object
   * @param {integer} timeIndex - The index for the timeseries list we want to check
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
   * @function
   * @description - gets the value for n where we wanna fix the n-th frame
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
   * @function
   * @description Check whether we need to draw the temporal vector layer.
   * @param {scope} scope - A scope s.t. scope.mapState is defined
   * @returns {boolean}
   */
  mustDrawTVLayer = function (scope) {
    return scope.mapState.layers.flow.active;
  };


  /**
   * @function
   * @description - Resets the previous timeStepIndex to 0
   * @param {scope} scope - A scope s.t. scope.mapState is defined
   * @returns {void}
   */
  var resetPreviousTimeIndex = function () {

    // this-prefix required for ng testing :/
    this.previousTimeIndex = previousTimeIndex = undefined;
  };

  return {
    STEP_SIZE: STEP_SIZE,
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