app.controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  function ($scope, UtilService) {

    $scope.toggleThisCard = UtilService.toggleThisCard;

  }
]);