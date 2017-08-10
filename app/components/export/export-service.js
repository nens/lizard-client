angular.module('export').service('ExportService', function () {

  return {
    isPolling: { value: false },
    setIsPolling: function (newValue) {
      this.isPolling.value = newValue;
    }
  }
});