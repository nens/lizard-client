/**
 *
 * Shows user-menu and has logout login buttons
 */
angular.module("user-menu").directive("userMenu", [
  "$http",
  "UtilService",
  "MapService",
  "$location",
  "user",
  "$uibModal",
  "version",
  "notie",
  "gettextCatalog",
  'State',
  '$timeout',
  'FavouritesService',
  function(
    $http,
    UtilService,
    MapService,
    $location,
    user,
    $uibModal,
    version,
    notie,
    gettextCatalog,
    State,
    $timeout,
    FavouritesService
  ) {
    var link = function(scope, element, attrs) {

      scope.user = user;
      scope.mustShowAppsButton = false;
      scope.modal = { active: false };
      scope.inbox = [];

      var appsContainer = document.querySelector("#lizard-apps-container");
      var showAppsContainer = false;

      var CLASS_CONTAINER_ON_MAP = "lizard-apps-container-on-map";
      var CLASS_CONTAINER_ON_DB = "lizard-apps-container-on-db";

      if (State.context === 'map') {
        appsContainer.classList.add(CLASS_CONTAINER_ON_MAP);
      } else if (State.context === 'charts') {
        appsContainer.classList.add(CLASS_CONTAINER_ON_DB);
      }

      scope._state = State;

      scope.$watch('_state.context', function (n, o) {
        if (n === 'map') {
          appsContainer.classList.remove(CLASS_CONTAINER_ON_DB);
          appsContainer.classList.add(CLASS_CONTAINER_ON_MAP);
        } else if (n === 'charts') {
          appsContainer.classList.remove(CLASS_CONTAINER_ON_MAP);
          appsContainer.classList.add(CLASS_CONTAINER_ON_DB);
        }
      });

      angular.element("#lizard-apps-button").click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        showAppsContainer = !showAppsContainer;
        scope.favourites.enabled = false;
      });

      angular.element(":not(#lizard-apps-button)").click(function (e) {
        if (showAppsContainer) {
          appsContainer.classList.toggle('hidden');
          showAppsContainer = false;
        }
      });

      var appsScreenUrl = function() {
        var appsScreenSlug = UtilService.slugify($location.host());
        return "//apps.lizard.net/screens/" + appsScreenSlug + ".js";
      };

      var script = document.createElement("script");
      script.src = appsScreenUrl();
      script.onload = function() {
        if (typeof window.Lizard.startPlugins === "function") {
          window.Lizard.startPlugins(); // jshint ignore:line

          scope.mustShowAppsButton =
            element.find("#lizard-apps-button").children().length > 0;
          scope.$digest();

          // Preventy injected clickhandler for button:
          document.getElementById('lizard-apps-button').onclick = null;
        }
      };

      document.head.appendChild(script);

      scope.openAbout = function(size) {
        var modalInstance = $uibModal.open({
          animation: true,
          templateUrl: "about.html", // This is really the 'id' of the modal.
          size: size,
          controller: function() {
            this.version = version;
          },
          controllerAs: "about"
        });

        modalInstance.rendered.then(function () {
          var linkies = $(".modal-body a");
          linkies.attr("target", "_blank");
        });
      };

      var domain =
        location.protocol + "//" + location.host.replace(":9000", ":8000");

      var setLogOutUrl = function() {
        window.location =
          "/accounts/logout/?domain=" +
          domain +
          "/&next=" +
          window.location.href;
      };

      scope.logOut = function() {
        notie.confirm(
          gettextCatalog.getString("Are you sure you want to log out?"),
          gettextCatalog.getString("Yes"),
          gettextCatalog.getString("No"),
          setLogOutUrl
        );
      };

      scope.logIn = function() {
        window.location =
          "/accounts/login/?domain=" +
          domain +
          "/&next=" +
          window.location.href;
      };

      /**
       * toggleExport - start the modal with export stuff
       */
      scope.toggleExport = function() {
        scope.modal.active = true;
      };

      /**
       * archiveMessage - archives a stored message based on id
       *
       * @param  {any} id string or integer representing the id e.g. "1"
       */
      var archiveMessage = function(id) {
        $http.post("/api/v3/inbox/{id}/read/".replace(/\{id\}/g, id));
        scope.inbox = scope.inbox.filter(function(message) {
          return message.id !== id;
        });
      };

      /**
       * goToMessageUrl - opens the URL that the message contains and archives
       * the message subsequently
       *
       * @param  {object} message as it comes from the server
       */
      var goToMessageUrl = function(message) {
        window.open(message.url, "_blank");
        archiveMessage(message.id);
      };

      /**
       * showMessage - show the message as a notie notification
       * with the question: download or archive message
       *
       * @param  {object} message as it is retrieved from the server
       */
      scope.showMessage = function(message) {
        notie.confirm.apply(message, [
          message.message,
          gettextCatalog.getString("Download"),
          gettextCatalog.getString("Delete message"),
          function () {
            goToMessageUrl(message);
          },
          function() {
            archiveMessage(message.id);
          }
        ]);
      };

      var requestAnimationFrame =
        window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;

      var cancelAnimationFrame =
        window.cancelAnimationFrame || window.mozCancelAnimationFrame;

      /**
       * Retrieves messages from the server /inbox/ endpoint and put the
       * messages on the scope without being in the way of the browsers
       * rendering and only when the browser tab is active.
       */
      var poll = requestAnimationFrame.bind(null, function() {
        $http.get("/api/v3/inbox/").then(function(response) {
          scope.inbox = (
            (response.data && response.data.results) ?
              response.data.results :
              []
          );
        });
      });

      // do initial call
      var pollFrame = poll();

      /**
       * getMessages - if user is authenticated, cancel previous request for
       * poll and request browser to schedule another poll.
       */
      var getMessages = function() {
        if (user.authenticated) {
          cancelAnimationFrame(pollFrame);
          pollFrame = poll();
        }
      };

      var POLL_INTERVAL = 10000; // in milliseconds

      // poll for more messages
      setInterval(getMessages, POLL_INTERVAL);

      // Bind mapservice functions for zoom buttons;
      scope.zoomIn = MapService.zoomIn;
      scope.zoomOut = MapService.zoomOut;

      scope.menuState = {
        'apps': false,
        'favs': false,
        'user': false
      };

      scope.showAppsContainer = function (e) {
        // console.log("[F] showAppsContainer");

        if (scope.menuState.favs)
          scope.hideFavsContainer(e);

        if (scope.menuState.user)
          scope.hideUserContainer(e);

        if (!scope.menuState.apps) {
          if (appsContainer.classList.contains('hidden')) {
            // OK
            appsContainer.classList.remove('hidden');
            scope.menuState.apps = true;
          } else {
            // Inconsistency detected!
            console.error("[E] Tried to *show* appsContainer but classList doesn't contain 'hidden'!");
          }
        } else {
          // Inconsistency detected!
          console.error("[E] Tried to *show* appsContainer when local state already says it should be shown!");
        }
      };

      scope.hideAppsContainer = function (e) {
        // console.log("[F] hideAppsContainer");

        if (scope.menuState.apps) {
          if (!appsContainer.classList.contains('hidden')) {
            // OK
            appsContainer.classList.add('hidden');
            scope.menuState.apps = false;
          } else {
            // Inconsistency detected!
            console.error("[E] Tried to *hide* appsContainer but classList already contains 'hidden'!");
          }
        } else {
          console.error("[E] Tried to *hide* appsContainer when local state already says it should be hidden!");
        }
      };

      scope.showFavsContainer = function (e) {
        console.log("[F] showFavsContainer");
        // scope.toggleFavourites(e);


        if(!scope.menuState.favs) {
          FavouritesService.showFavsContainer();
          scope.menuState.favs = true;
        } else
          console.error("[E] Tried to *show* favsContainer when local state already says it should be shown!");

        if (scope.menuState.apps)
          scope.hideAppsContainer(e);

        if (scope.menuState.user)
          scope.hideUserContainer(e);
      };

      scope.hideFavsContainer = function (e) {
        console.log("[F] hideFavsContainer");
        if(scope.menuState.favs) {
          FavouritesService.hideFavsContainer();
          scope.menuState.favs = false;
        } else
          console.error("[E] Tried to *hide* favsContainer when local state already says it should be already hidden");

      };
    };

    return {
      restrict: "E",
      link: link,
      templateUrl: "user-menu/user-menu.html"
    };
  }
]);
