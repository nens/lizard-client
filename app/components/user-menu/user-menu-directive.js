/**
 *
 * Shows user-menu and has logout login buttons
 */
angular.module('user-menu')
  .directive('userMenu',
             ['UtilService', '$location', 'user', '$uibModal', 'versioning',
              function (UtilService, $location, user, $uibModal, versioning) {

    var link = function (scope, element, attrs) {

      scope.user = user;
      scope.showApps = false;

      /**
       * Turn off either favourites or apps when click the on or the other
       */
      var toggleDashboardOrApps = function (e) {
        var favs = e === true;
        var lApps = document.querySelector('#lizard-apps-container');
        if (!lApps.classList.contains('hidden') && favs) {
          lApps.classList.toggle('hidden');
        } else if (!favs) {
          scope.favourites.enabled = false;
        }
      };

      var appsScreenUrl = function () {
        var appsScreenSlug = UtilService.slugify($location.host());
        return "//apps.lizard.net/screens/" + appsScreenSlug + ".js";
      };

      var script = document.createElement('script');
      script.src = appsScreenUrl();
      script.onload = function () {
        if (typeof window.Lizard.startPlugins === 'function') {
          window.Lizard.startPlugins(); // jshint ignore:line
          scope.showApps = (element
            .find('#lizard-apps-button')
            .children().length > 0);
          scope.$digest();

          element.find('#lizard-apps-button').click(toggleDashboardOrApps);
        }
      };

      scope.$watch('favourites.enabled', toggleDashboardOrApps);

      document.head.appendChild(script);

      scope.openAbout = function (size) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'about.html',  // This is really the 'id' of the modal.
          size: size,
          resolve: {versioning: versioning}
        });
      };

    };

    return {
      restrict: 'E',
      link: link,
      templateUrl: 'user-menu/user-menu.html'
    };
  }]);
