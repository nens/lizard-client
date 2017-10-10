/**
 * Binds logic and attributes to the global $scope. Keep this clean and put
 * stuff in specific component controllers if it is not global or state-service.
 */
angular.module('lizard-nxt').controller('MasterCtrl',
  ['$scope',
   '$rootScope',
   '$timeout',
   '$window',
   'CabinetService',
   'UtilService',
   'version',
   'State',
   'UrlService',
   'AssetService',
   'ChartCompositionService',
  function (
    $scope,
    $rootScope,
    $timeout,
    $window,
    CabinetService,
    UtilService,
    version,
    State,
    UrlService,
    AssetService,
    ChartCompositionService
  ) {

  // Bind to the global scope
  $scope.version = version;
  $scope.tooltips = CabinetService.createTooltips();

  // When the language changes we remake the tooltips for the current language.
  $scope.$on('gettextLanguageChanged', function () {
    $scope.tooltips = CabinetService.createTooltips();
  });

  $scope.state = State;

  $scope.$watch('state', function () {
    UrlService.setUrl($scope.state);
  }, true);

  /**
   * Switch between contexts.
   *
   * Set State.context with param context.
   *
   * When going from dashboard to map, decide on changing "tool" from point to
   * multi-point.
   *
   * When going to or from map, create a "curtain" to make the transition more
   * visually pleasing.
   *
   * @param {string} context - Context name to switch to
   */
  $scope.transitionToContext = function (context) {
    if (context !== State.context) {
      State.context = context;
      if (context === 'map' &&
        AssetService.getAllNonNestedAssetNames().length > 1) {
        // If more than one asset became selected when user was in db context,
        // we switch the box-type/tool to 'multi-point':
        State.box.type = 'multi-point';
      }
    }
    var overlay = angular.element('#context-transition-overlay')[0];
    overlay.style.transition = null;
    overlay.style.minHeight = window.innerHeight + 'px';
    $rootScope.context = State.context;
    $timeout(function () {
      overlay.style.transition = 'ease .3s';
      overlay.style.opacity = 1;
    }, 10);
    $timeout(function () {
      overlay.style.opacity = 0;
    }, 300);
    $timeout(function () {
      overlay.style.transition = null;
      overlay.style.minHeight = 0;
    }, 600, true);
  };

  $scope.$watch(State.toString('context'), function () {
    $scope.transitionToContext(State.context);
  });

  $scope.toggleDashboard = function () {
    $scope.transitionToContext(($scope.context === 'map') ? 'dashboard' : 'map');
  };

  $scope.getContextComplement = function () {
    return $scope.context === 'map' ? 'Dashboard' : 'Map';
  };

  $scope.getContextComplementIcon = function () {
    return $scope.context === 'map' ? 'fa-bar-chart' : 'fa-globe';
  };

  $scope.toggleVersionVisibility = function () {
    $('.navbar-version').toggle();
  };

  /**
   * Returns (Lizard || DDSC) + the Subdomain.
   */
  $scope.getDocumentTitle = function () {
    var application = 'Lizard';
    if ($window.location.host === 'portal.ddsc.nl') {
      application = 'DDSC';
    }
    var portal = $window.location.host.split('.')[0];
    portal = portal.charAt(0).toUpperCase() + portal.slice(1);
    return application + ' ' + portal;
  };

  // End bind to global scope.

  // Do some things that need to happen, but IMHO not necessarily here.
  UtilService.preventOldIEUsage();
  UtilService.preventMousewheelZoom();

  // catch window.load event
  window.addEventListener("load", function () {
    window.loaded = true;
  });

    window.debug = function () {
      // The parse / stringify is to turn it into an object without properties,
      // for the Firefox console.
    console.log("Currently, the State object looks like:",
                JSON.parse(JSON.stringify(State, null, 4)));
  };

  window.chartComposition = function () {
    console.log("The chart composition is:", ChartCompositionService.composedCharts);
  };
}]);
