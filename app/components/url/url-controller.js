'use strict';

/**
 * @ngdoc controller
 * @class UrlController
 * @memberof app
 * @name UrlController
 * @summary Sets and gets the url to the state and vice versa.
 * @description UrlController reacts to $locationChangeSucces to read
 * the url and configure lizard-nxt state accordingly. Writes state
 * changes to url. At initial load of app, url leads. Afterwards the
 * state leads the url.
 */
angular.module('lizard-nxt')
.controller('UrlController', [
  '$scope',
  '$timeout',
  'LocationGetterSetter',
  'UrlState',
  'UtilService',
  'dataBounds',
  'defaultLocale',
  'DataService',
  'MapService',
  'NxtRegionsLayer',
  'State',
  'LeafletService',
  'gettextCatalog',
  'FavouritesService',
  function (
    $scope,
    $timeout,
    LocationGetterSetter,
    UrlState,
    UtilService,
    dataBounds,
    defaultLocale,
    DataService,
    MapService,
    NxtRegionsLayer,
    State,
    LeafletService,
    gettextCatalog,
    FavouritesService
  ) {

    // Configuration object for url state.
    var state = {
      language: {
        part: 'path',
        index: 0
      },
      context: { // Locally used name for the state
        value: 'map', // default
        part: 'path', // Part of the url where this state is stored,
        index: 1, // Position of the state in the part
      },
      layers: {
        part: 'path',
        index: 2,
      },
      boxType: {
        part: 'path',
        index: 3,
      },
      geom: {
        part: 'path',
        index: 4,
      },
      mapView: {
        part: 'at',
        index: 0,
      },
      timeState: {
        part: 'at',
        index: 1,
      },
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Enables or disables layers on the basis of the url.
    * @description Takes the layers as defined in the url to turn
    *              layers on afterwards it initializes all other
    *              layers. This is done here so MapService does not turn
    *              on layers which are turned of later by this controller.
    * @param {string} String representation of layers on url
    */
    var enablelayers = function (layerString) {
      if (layerString) {
        State.layers.active = layerString.split(',');
      }
      UrlState.setlayersUrl(state, State.layers.active);
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Sets the mapView on the url or the url on the mapView
    * @description If mapView as string from the url is a parseable
    *              mapView, the map is set to this view. Else the map
    *              is set to bounds of data as defined by the server.
    * @param {string} String representation of mapView on url
    */
    var enableMapView = function (mapView) {
      if (mapView) {
        var view = UrlState.parseMapView(mapView);
        if (view) {
          State.spatial.view = {
            lat: view.latLng[0],
            lng: view.latLng[1],
            zoom: view.zoom
          };
        }
      }
    };

    /**
     * Attempts to set the language based on what is provided, what is the
     * Injected default value or the hardcoded value in this function.
     *
     * If all fails, their will be no translation and all text will be in
     * English.
     *
     * @param {str} lang language code according to ISO-639-1.
     */
    var setLanguage = function (lang) {
      var defaultLang = State.language;

      if (lang === undefined && defaultLocale) {
        lang = defaultLocale.slice(0,2); // language is the first 2 places of
                                         // locale e.g.: nl_NL;
      } else if (lang === undefined) {
        lang = defaultLang;
      }

      // Check if this language exists, otherwise use the default.
      if (!gettextCatalog.strings[lang]
        && lang !==gettextCatalog.baseLanguage) {
        lang = defaultLang;
      }

      gettextCatalog.setCurrentLanguage(lang);

      // Store language in global state object. Among other, it is used for
      // searchresults.
      State.language = lang;
    };

    /**
     * set layer(s) when these change.
     */
    $scope.$watch(State.toString('layers.active'),
      function (n, o) {
        if (n === o) { return true; }
        UrlState.setlayersUrl(state, State.layers.active);
      }
    );

    /**
     * Set location when map moved.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o || !State.spatial.view.lat) { return true; }
      UrlState.setCoordinatesUrl(state,
        State.spatial.view.lat,
        State.spatial.view.lng,
        State.spatial.view.zoom
      );
    });

    /**
     * Set timeState, when timeState changed. The helper serves eliminating
     * redundant code, within this file.
     */
    var setTimeStateUrlHelper = function () {
      if (!State.temporal.timelineMoving) {
        if (Date.now() - State.temporal.start > 7 * UtilService.day) {
          State.temporal.relative = false;
        } else {
          State.temporal.relative = true;
        }
        UrlState.setTimeStateUrl(
          state,
          State.temporal.start,
          State.temporal.end,
          State.temporal.relative
        );
      }
    };

    /**
     * Set timeState, when timeState changed in response to panning/zooming the
     * timeline and in response to the user clicking the 3 timeline buttons.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      setTimeStateUrlHelper();
    });

    /*
     * Set boxType when box.type changed
     */
    $scope.$watch(State.toString('box.type'), function (n, old) {
      if (n === old) { return true; }
      LocationGetterSetter.setUrlValue(
        state.boxType.part, state.boxType.index, State.box.type
      );

      if (['point', 'line', 'region', 'multi-point'].indexOf(old) !== -1) {
        // Remove geometry from url
        LocationGetterSetter.setUrlValue(
          state.geom.part, state.geom.index, undefined);
      }

    });

    /*
     * Set context when context changed
     */
    $scope.$watch(State.toString('context'), function (n, old) {
      if (n === old) { return true; }
      state.context.update = true;

      LocationGetterSetter.setUrlValue(
        state.context.part, state.context.index, State.context
      );
    });

    $scope.$watch(State.toString('selected'), function (n, o) {
      if (n === o) { return true; }
      UrlState.setSelectedUrl(state, State.selected);
    });

    /**
     * @function
     * @description Checks if the url is a `favourite url`. And then proceeds to
     * fetch the favourites as it is asked.
     * return {object} - thennable promise which resolves to true/false
     */
    var favouritesFromUrl = function () {
      var firstUrlPart = LocationGetterSetter.getUrlValue(
        'path', 0);
      if (firstUrlPart !== 'favourites') {
        return false;
      } else {
        var favouriteUUID = LocationGetterSetter.getUrlValue(
          'path',
          1
        );
        return favouriteUUID;
      }
    };

    /**
     * Set the state from the url on init or set the url from the default state
     * when the url is empty.
     */
    var setStateFromUrl = function (favouriteURL) {
      var language;
      var boxType;
      var geom;
      var layersFromURL;
      var mapView;
      var time;
      var context;
      if (!favouriteURL) {
        language = LocationGetterSetter.getUrlValue(
          state.language.part,
          state.language.index
        );
        boxType = LocationGetterSetter.getUrlValue(
          state.boxType.part,
          state.boxType.index
        );
        geom = LocationGetterSetter.getUrlValue(
          state.geom.part,
          state.geom.index
        );
        layersFromURL = LocationGetterSetter.getUrlValue(
          state.layers.part,
          state.layers.index
        );
        mapView = LocationGetterSetter.getUrlValue(
          state.mapView.part,
          state.mapView.index
        );
        time = LocationGetterSetter.getUrlValue(
          state.timeState.part,
          state.timeState.index
        );
        context = LocationGetterSetter.getUrlValue(
          state.context.part,
          state.context.index
        );
      }

      setLanguage(language);

      LocationGetterSetter.setUrlValue(
        state.language.part,
        state.language.index,
        gettextCatalog.getCurrentLanguage()
      );

      // If language === 'favourites' something went wrong with the favourite
      // ignore it and default.
      if (context && language !== 'favourites') {
        $scope.transitionToContext(context);
      } else if (!favouriteURL) {
        LocationGetterSetter.setUrlValue(
          state.context.part, state.context.index, state.context.value);
        $scope.transitionToContext(state.context.value);
      }

      if (boxType) {
        State.box.type = boxType;
      } else {
        LocationGetterSetter.setUrlValue(
          state.boxType.part, state.boxType.index, State.box.type);
      }

      if (geom) {
        State.selected = UrlState.parseSelection(geom, State.selected);
        if (boxType === 'region') {
          NxtRegionsLayer.setActiveRegion(parseInt(geom));
        }
      }

      enablelayers(layersFromURL);
      enableMapView(mapView);

      if (time) {
        State.temporal = UrlState.parseTimeState(time, State.temporal);
      } else {
        state.timeState.update = false;
        UrlState.setTimeStateUrl(
          state,
          State.temporal.start,
          State.temporal.end,
          State.temporal.relative
        );
      }

      UtilService.announceMovedTimeline(State);

    };


    var favouriteUUID = favouritesFromUrl();
    if (favouriteUUID) {
      FavouritesService.getFavourite(
        favouriteUUID,
        function (favourite, getResponseHeaders) {
          FavouritesService.applyFavourite(favourite);
          setStateFromUrl(true);
        },
        function () {
          setStateFromUrl(false);
        }
      );
    }
    else {
      setStateFromUrl(false);
    }

  }
]);
