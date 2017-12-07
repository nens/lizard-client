angular.module('export').service('ExportTimeseriesService', function () {
  return {
    isPolling: { value: false },
    setIsPolling: function (newValue) {
      this.isPolling.value = newValue;
    }
  };
});
