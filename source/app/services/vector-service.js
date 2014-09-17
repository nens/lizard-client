'use strict';

/**
 * @ngdoc service
 * @class VectorService
 * @memberof app
 * @name VectorService
 * @summary Receives and returns vector data, as a service (or VDaaS).
 * @description VectorService is responsible for retreiving, storing
 * and exposing vector typed data.
 *
 */

app.service('VectorService', ['Restangular',
  function (Restangular) {

    var getData, bla;

    /**
     * @memberof app.VectorService
     * @function 
     * @description gets data from backend
     * @param  {string} layer layername
     * @param  {object} geom  geometry that it needs to get (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise} 
     */
    getData = function (layer, geom, time) {
      var start, stop;
      
      if (time) {
        start = time.start;
        stop = time.stop;
      }

      var eventResource = Restangular.all('api/v1/events/');

      return eventResource.get({
        geom: geom,
        start: start,
        stop: stop,
        object: layer.object_type + '$' + layer.object_pk
      });
    };

    return {
      getData: getData
    }
  }
]);