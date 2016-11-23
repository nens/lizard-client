
/**
 * $http interceptor to prevent rapid fire of slow requests such as timeseries.
 *
 * Intercepts all $http request to throttle when specified with a custom timeout
 * promise.
 *
 * Depends on lodash throttle and $q.
 */
angular.module('lizard-http-throttler', [])
.config(['$httpProvider', function ($httpProvider) {

  $httpProvider.interceptors.push(function($q) {

    var WAIT = 1000; // Max two request every second.
    var throttles = {};
    var timeouts = {};

    return {
      request: function(config) {
        var urlID = config.url;
        if (config.params){
          Object.keys(config.params).sort().forEach(function(key) {
            if (key)
            urlID += key;
          });
        }

        var timeout = config.timeout;
        // Only intercept when $http is called with custom timeout.
        if (!timeout) { return config; }

        // To prevent loading bar waiting for requests never firing, set ignore
        // to true and back to false when fired by throttle.
        config.ignoreLoadingBar = true;

        // Store timeout synchronously.
        timeouts[urlID] = timeout;

        // Create config promise for $http.
        var promise = $q.defer();

        // Create throttle function if necessary
        if (!throttles[urlID]) {
          throttles[urlID] = _.throttle(function (config, defer) {

            // Throttle function fires asynchronously but requires timeout of
            // last request.
            config.timeout = timeouts[config.url];
            // This request will actually fire, so stop ignoring it, and show
            // loading bar.
            config.ignoreLoadingBar = false;
            // Start $http request.
            defer.resolve(config);
          }, WAIT);
        }

        // Call throttled function.
        throttles[urlID](config, promise);

        // $http takes a promise which ignites request when resolved.
        return promise.promise;
      }
    };
  });
}]);

