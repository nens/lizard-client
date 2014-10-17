angular.module('lizard-nxt')
  .controller("rain", ['$scope', function ($scope) {

  /**
   * Format the CSV (exporting rain data for a point in space/interval in
   * time) in a way that makes it comprehensible for les autres.
   *
   */
  $scope.formatCSVColumns = function (data) {
    var i,
      formattedDateTime,
      formattedData = [],
      lat = $scope.mapState.here.lat,
      lng = $scope.mapState.here.lng,
      _formatDate = function (epoch) {

        var d = new Date(parseInt(epoch, 1));

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
  };

}]);
