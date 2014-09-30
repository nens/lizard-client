/**
 * Service to handle timeseries retrieval.
 */
app.service("TimeseriesService", ["Restangular",
  function (Restangular) {

    var getRandomTimeseries = function () {
      var timeseries = [
        {name: 'Debiet', data: []},
        {name: 'Zuurstofmeting', data: []},
        {name: 'Energieverbruik', data: []}
      ];
      angular.forEach(timeseries, function (series) {
        for (var i = 0; i < 25; i++) {
          series.data.push([i, Math.round(Math.random() * 10)]);
        }
      });
      return timeseries;
    };

    return {
      getRandomTimeseries: getRandomTimeseries
    };

  }

]);

