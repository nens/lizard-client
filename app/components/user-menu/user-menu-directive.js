/**
 *
 * Shows user-menu and has logout login buttons
 */
angular.module('user-menu')
  .directive('userMenu',
             ['UtilService', '$location', 'user', '$uibModal', 'version', 'notie', 'gettextCatalog',
              function (UtilService, $location, user, $uibModal, version, notie, gettextCatalog) {

    var link = function (scope, element, attrs) {

      scope.user = user;
      scope.showApps = false;

      scope.modal = {
        active: false,
      };

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
          controller: function () {
            this.version = version;
          },
          controllerAs: 'about'
        });
      };

      var domain = location.protocol +
        '//' +
        location.host.replace(':9000', ':8000') ;

      var setLogOutUrl = function () {
        window.location = '/accounts/logout/?domain=' +
          domain +
          '/&next=' +
          window.location.href;
      };

      scope.logOut = function () {
        notie.confirm(
          gettextCatalog.getString(
            "Are you sure you want to log out?"),
          gettextCatalog.getString("Yes"),
          gettextCatalog.getString("No"),
          setLogOutUrl
        );
      };

      scope.logIn = function () {
        window.location = '/accounts/login/?domain=' +
          domain +
          '/&next=' +
          window.location.href;
      };

      scope.toggleExport = function () {
        scope.modal.active = true;
      };

    };

    return {
      restrict: 'E',
      link: link,
      templateUrl: 'user-menu/user-menu.html'
    };
  }]);
