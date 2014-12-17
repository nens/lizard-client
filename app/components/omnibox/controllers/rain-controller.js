angular.module('lizard-nxt')
  .controller("rain",
      ['RasterService', 'State', '$scope',
  function (RasterService, State, $scope) {

  /*
   * @description
   * angular isolate scope is messed with
   * when you using ng-if. This looks to parent
   * model and sets the local fullDetails.
   */ 
  $scope.$watch('box.fullDetails.rain', function (n) {
    $scope.fullDetails = n;
  });

  var getRecurrenceTime = function () {
    var data = [{"max": 28.139999894425273, "end": 1418413200000.0, "t": "T <= 1", "td_window": "2 dag(en)", "start": 1418240400000.0}, {"max": 22.94999991171062, "end": 1418386800000.0, "t": "T <= 1", "td_window": "1 dag(en)", "start": 1418300400000.0}, {"max": 8.579999996349216, "end": 1418349600000.0, "t": "T <= 1", "td_window": "3 uur", "start": 1418338800000.0}, {"max": 3.800000010058284, "end": 1418349300000.0, "t": "T <= 1", "td_window": "1 uur", "start": 1418345700000.0}];
    
    RasterService.getData({
      agg: 'rrc',
      start: 1 
    });
    return data;
  };

  /**
   * Format the CSV (exporting rain data for a point in space/interval in
   * time) in a way that makes it comprehensible for les autres.
   *
   */
  $scope.formatCSVColumns = function (data) {
    var i,
        formattedDateTime,
        formattedData = [],
        lat = State.spatial.here.lat,
        lng = State.spatial.here.lng,
        _formatDate = function (epoch) {
          var d = new Date(parseInt(epoch));
          return [
            [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('-'),
            [d.getHours() || "00", d.getMinutes() || "00", d.getSeconds() || "00"].join(':')
          ];
        };

    for (i = 0; i < data.length; i++) {

      formattedDateTime = _formatDate(data[i][0]);

      formattedData.push([
        formattedDateTime[0],
        formattedDateTime[1],
        Math.floor(100 * data[i][1]) / 100 || "0.00",
        lat,
        lng
      ]);
    }

    return formattedData;
  };

}]);
