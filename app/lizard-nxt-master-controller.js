
/**
 *
 * @name MasterController
 * @class MasterCtrl
 * @memberOf app
 *
 * @summary Master controller
 *
 * @description Binds logic and attributes to the global $scope. Keep
 *              this clean and put stuff in specific component controllers
 *              if it is not global.
 *
 */
angular.module('lizard-nxt')
  .controller('MasterCtrl',

  ['$scope',
   '$controller',
   'CabinetService',
   'UtilService',
   'ClickFeedbackService',
   'user',
   'versioning',
   'State',

  function ($scope,
            $controller,
            CabinetService,
            UtilService,
            ClickFeedbackService,
            user,
            versioning,
            State) {

  $scope.user = user;
  $scope.versioning = versioning;
  $scope.tooltips = CabinetService.tooltips;

  // CONTEXT

  /**
   * Switch between contexts.
   *
   * @param {string} context - Context name to switch to
   */
  $scope.switchContext = function (context) {
    State.context = context;
  };

  /*
   * Set context on scope.
   */
  $scope.$watch(State.toString('context'), function (n, o) {
    if (n === o) { return true; }
    $scope.context = State.context;
  });

  // initialise context.
  $scope.context = State.context;

  // END CONTEXT


  // KEYPRESS

  // If escape is pressed close box
  // NOTE: This fires the watches too often
  $scope.keyPress = function ($event) {

    if ($event.target.nodeName === "INPUT" &&
      ($event.which !== 27 && $event.which !== 13
       && $event.which !== 32)) {
      return;
    }

    // pressed ESC
    if ($event.which === 27) {

      State.box.type = "point";
      State.spatial.here = undefined;
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);

      // This does NOT work, thnx to Angular scoping:
      // $scope.geoquery = "";
      //
      // ...circumventing-angular-weirdness teknique:
      document.querySelector("#searchboxinput").value = "";
    }
    // TODO: move
    // // play pause timeline with Space.
    // if ($event.which === 32) {
    //   $scope.timeState.playPauseAnimation();
    // }

  };

  $scope.toggleVersionVisibility = function () {
    $('.navbar-version').toggle();
  };

  UtilService.preventOldIEUsage();

  // catch window.load event
  window.addEventListener("load", function () {
    window.loaded = true;
    $scope.$apply(function () {
      $controller('UrlController', {$scope: $scope});
    });
  });


}]);
