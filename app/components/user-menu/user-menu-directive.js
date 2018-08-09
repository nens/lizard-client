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

      // scope.hideOtherDropDowns = function (e) {
      //   console.log("[F] hideOtherDropdowns", scope.menuState);
      //   var dummieEvent = {
      //     preventDefault: function(){},
      //     stopPropagation: function(){}
      //   };

      //   //e.preventDefault();
      //   //e.stopPropagation();

      //   scope.hideAppsContainer(dummieEvent);
      //   scope.hideFavsContainer(dummieEvent);
      // };

      angular.element("#lizard-apps-button").click(function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      angular.element(":not(#lizard-apps-button)").click(function (e) {
        if (scope.menuState.apps)
          scope.hideAppsContainer(e);
      });

      // angular.element("#favs-menu-button").click(function (e) {
      //   // e.preventDefault();
      //   // e.stopPropagation();
      // });
      angular.element(":not(#favs-menu-button)").click(function (e) {
        // console.log("[C] Clicked something else than favs-button!");
        if (scope.menuState.favs)
          scope.hideFavsContainer(e);
      });


      // angular.element("#user-menu-button").click(function (e) {
      //   console.log("[C] clicked on user-menu-button");
      //   e.preventDefault();
      //   e.stopPropagation();
      // });
      // angular.element(":not(#user-menu-button)").click(function (e) {
      //   console.log("[C] clicked, but not on user-menu-button");
      //   if (scope.menuState.user)
      //     scope.hideUserContainer(e);
      // });

      // angular.element(":not(#lizard-apps-button)").click(function (e) {
      //   console.log(':not(#lizard-apps-button onclick', e);
      //   for (
      //     var htmlElementIndex = 0;
      //     htmlElementIndex < e.currentTarget.childNodes.length;
      //     htmlElementIndex++
      //   ) {
      //     if (e.currentTarget.childNodes[htmlElementIndex].id === 'lizard-apps-button') {
      //       e.preventDefault();
      //       e.stopPropagation();
      //       return;
      //     }
      //   }
      //   e.currentTarget.childNodes.forEach(function(element){
      //     console.log(element.id);
      //   });

      //   //if (showAppsContainer) {
      //   if (scope.menuState.apps!=false) {
      //     //appsContainer.classList.toggle('hidden');
      //     if (!appsContainer.classList.contains('hidden')) {
      //       // OK
      //       appsContainer.classList.add('hidden');
      //       scope.menuState.apps=false;
      //     }
      //     // showAppsContainer = false;

      //   }
      // });

      // var selector = ":not(#lizard-apps-button),:not(#user-menu-button),:not(#favs-menu-button)";
      // var elems = document.querySelectorAll(selector);
      // var handler = function (e) {
      //   e.preventDefault();
      //   e.stopPropagation();
      //   console.log("[!] Clicked on something else than the 3 buttons!");
      // };

      // for (var i = 0; i < elems.length; i++) {
      //   elems[i].addEventListener('click', handler)
      // }

      // ).onclick(function () {
      //   console.log("[!] Clicked on something else than the 3 buttons!");
      // });

      scope.showAppsContainer = function (e) {
        console.log("[F] showAppsContainer", scope.menuState);
        // e.preventDefault();
        // e.stopPropagation();

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

      scope.hideAppsContainer = function (e, mustPreventBubbling) {
        console.log("[F] hideAppsContainer", scope.menuState);

        if (mustPreventBubbling) {
          e.preventDefault();
          e.stopPropagation();
        }

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

      scope.showFavsContainer = function (e, mustPreventBubbling) {
        console.log("[F] showFavsContainer", scope.menuState);

        if (mustPreventBubbling) {
          e.preventDefault();
          e.stopPropagation();
        }

        if(!scope.menuState.favs) {
          FavouritesService.showFavsContainer(); // !!!!
          scope.menuState.favs = true;
        } else
          console.error("[E] Tried to *show* favsContainer when local state already says it should be shown!");

        if (scope.menuState.apps)
          scope.hideAppsContainer(e);

        if (scope.menuState.user)
          scope.hideUserContainer(e);
      };

      scope.hideFavsContainer = function (e) {
        console.log("[F] hideFavsContainer", scope.menuState);
        if(scope.menuState.favs) {
          FavouritesService.hideFavsContainer();
          scope.menuState.favs = false;
        } else
          console.error("[E] Tried to *hide* favsContainer when local state already says it should be already hidden");
      };

      // The ":not(#user-menu-button)" click handler
      angular.element(":not(#user-menu-button)").click(function (e) {
        if (scope.menuState.user) {
          scope.hideUserContainer(e);
        }
      });

      scope.showUserContainer = function (e, mustPreventDefault, mustPreventPropagation) {
        console.log("[F] showUserContainer", scope.menuState);

        // Prevent page-reload (since the button is an <a>-tag):
        if (mustPreventDefault)
          e.preventDefault();

        // Prevent the ":not(#user-menu-button)" click handler from triggering:
        if (mustPreventPropagation)
          e.stopPropagation();

        if (scope.menuState.apps)
          scope.hideAppsContainer(e, false);

        if(scope.menuState.favs)
          scope.hideFavsContainer(e);

        if (scope.menuState.user)
          console.error("[E] Tried to *show* user-container when local state already says it should be shown!");
        else {
          scope.menuState.user = true;
          var domElem = document.getElementById('user-menu-dropdown');
          if (domElem.classList.contains('open')) {
            console.error("[E] Tried to *show* user-container but it already has class 'open'");
          } else
            domElem.classList.add('open');
        }
      };

      scope.hideUserContainer = function (e, mustPreventDefault, mustPreventPropagation) {
        console.log("[F] hideUserContainer", scope.menuState);

        // Prevent page-reload (since the button is an <a>-tag):
        if (mustPreventDefault)
          e.preventDefault();

        // Prevent the ":not(#user-menu-button)" click handler from triggering
        if (mustPreventPropagation)
          e.stopPropagation();

        if (scope.menuState.user) {
          scope.menuState.user = false;
          var domElem = document.getElementById('user-menu-dropdown');
          if (domElem.classList.contains('open')) {
            domElem.classList.remove('open');
          } else
            console.error("[E] Tried to *hide* user-container but it didn't have class 'open'");
        } else
          console.error("[E] Tried to *hide* user-container when local state says it already should be hidden!");
      };

    };

    return {
      restrict: "E",
      link: link,
      templateUrl: "user-menu/user-menu.html"
    };
  }
]);
