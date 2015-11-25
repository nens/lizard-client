
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
   '$timeout',
   'CabinetService',
   'UtilService',
   'ClickFeedbackService',
   'user',
   'versioning',
   'State',
   'MapService',

  function ($scope,
            $controller,
            $timeout,
            CabinetService,
            UtilService,
            ClickFeedbackService,
            user,
            versioning,
            State,
            MapService) {

  $scope.user = user;
  $scope.versioning = versioning;
  $scope.tooltips = CabinetService.createTooltips();

  // When the language changes we remake the tooltips for the current language.
  $scope.$on('gettextLanguageChanged', function () {
    $scope.tooltips = CabinetService.createTooltips();
  });

  // CONTEXT

  /**
   * Switch between contexts.
   *
   * @param {string} context - Context name to switch to
   */
  $scope.transitionToContext = function (context) {
    if (context !== State.context) {
      var overlay = angular.element('#context-transition-overlay')[0];
      overlay.style.minHeight = window.innerHeight + 'px';
      overlay.style.transition = 'ease .3s';
      $timeout(function () {
        overlay.style.opacity = 1;
      }, 300);
      $timeout(function () {
        State.context = context;
        $scope.context = State.context;
        overlay.style.opacity = 0;
      }, 600, true);
      $timeout(function () {
        overlay.style.transition = null;
        overlay.style.minHeight = 0;
      }, 900);
    }
  };

  // initialise context.
  $scope.context = State.context;

  $scope.toggleDashboard = function () {
    $scope.transitionToContext(($scope.context === 'map') ? 'dashboard' : 'map');
  };

  // END CONTEXT

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
