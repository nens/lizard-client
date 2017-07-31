angular.module('export').service('ExportService', function () {

  return {
    isPolling: { value: false },
    setIsPolling: function (newValue) {
      console.log("[F] setIsPolling; newValue =", newValue);
      this.isPolling.value = newValue;
    }
  }
});