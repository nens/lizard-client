/**
 * @module
 * @description Show favourites menu.
 */
angular.module('favourites')
  .directive('favourites', [function () {

  var link = function (scope, element, attrs) {

    scope.favourites = {
      enabled: false
    };

    /**
     * Toggle the favourites.
     * @param {object} $event - Click event object.
     */
    scope.toggleFavourites = function($event) {
      $event.stopPropagation();
      scope.favourites.enabled = !scope.favourites.enabled;
    };

    /**
     * Collapse favourites on click outside the box.
     */
    scope.$watch('favourites.enabled', function () {
      if (scope.favourites.enabled === true) {
        $(document).bind('click', function(event){
          var isClickedElementChildOfPopup = element
            .find(event.target)
            .length > 0;

          if (!isClickedElementChildOfPopup) {
            scope.$apply( function () {
              scope.favourites.enabled = false;
            });
          }
        });
      }
    });
  };

  return {
    restrict: 'E',
    link: link,
    templateUrl: 'favourites/templates/favourites.html'
  };
  }]);

/**
 * @module
 * @description Show and delete favourites.
 */
angular.module('favourites')
  .directive('showFavourites',
             ['FavouritesService', 'notie', 'gettextCatalog', 'State',
              function (FavouritesService, notie, gettextCatalog, State) {

  var link = function (scope, element, attrs) {

    /**
     * Fill the favourites list with all the favourites returned by the
     * GET request.
     * @param {array} allFavourites - The array of favourite objects
     *                                returned by the GET request.
     * @param {dict} responseHeaders - Not actually used but required
     *                                 by $resource.
     */
    var fetchFavouritesSuccess = function (allFavourites, responseHeaders) {
      scope.favourites.data = allFavourites;
    };

    /**
     * Throw an alert and error when something went wrong with fetching the
     * favourites.
     * @param {dict} httpResponse - The httpResponse headers returned by the
     *                              GET request.
     */
    var fetchFavouritesError = function(httpResponse) {
      console.log(httpResponse);
      notie.alert(
        3, gettextCatalog.getString(
          "Oops! Something went wrong while fetching the favourites."));
      throw new Error(
        httpResponse.status + " - "
        + "Could not retrieve favourites:"
        + " " + httpResponse.config.url
        + ".");
    };

    FavouritesService.fetchAllFavourites(
      {'page_size': 0},
      fetchFavouritesSuccess,
      fetchFavouritesError);

    /**
     * Update the front-end to reflect a successful delete of an favourite.
     * @param {object} favourite - The deleted favourite.
     * @param {?} value - Not actually used but required by $resource.
     * @param {dict} responseHeaders - Not actually used but required
     *                                       by $resource.
     */
    var deleteFavouriteSuccess = function(
        favourite, value, responseHeaders) {
      scope.favourites.data.splice(
        scope.favourites.data.indexOf(favourite),
        1);
    };

    /**
     * Throw an alert and error when something went wrong with the deletion
     * of the favourite.
     * @param {dict} httpResponse - The httpResponse headers returned by the
     *                              DELETE.
     */
    var deleteFavouriteError = function(httpResponse) {
      console.log(httpResponse);
      notie.alert(3,
        gettextCatalog.getString(
          "Oops! Something went wrong while deleting the favourite."));
      throw new Error(
        httpResponse.status + " - "
        + "Could not delete previously retrieved favourite:"
        + " " + httpResponse.config.url
        + ".");
    };

    /**
     * Remove favourite from database when delete icon is clicked.
     * Update the front-end to reflect a successful delete or throw an alert
     * on error.
     * @param {object} favourite - The favourite to be deleted.
     */
    scope.deleteFavourite = function (favourite) {
      FavouritesService.deleteFavourite(
        favourite,
        deleteFavouriteSuccess.bind(undefined, favourite),
        deleteFavouriteError);
    };

    scope.selectFavourite = function (favourite) {
      FavouritesService.applyFavourite(favourite);
    };
  };

  return {
    restrict: 'E',
    link: link,
    templateUrl: 'favourites/templates/favourites-show.html'
  };
  }]);

/**
 * @module
 * @description Create favourites.
 */
angular.module('favourites')
  .directive('addFavourites',
             ['FavouritesService', 'notie', 'gettextCatalog', 'State',
              function (FavouritesService, notie, gettextCatalog, State) {

  var link = function (scope, element, attrs) {
    /**
     * Reset (empty) the favourites form.
     */
    scope.resetForm = function() {
      scope.favourite.name = angular.copy(null);
      scope.favouritesForm.$setPristine();
    };

    /**
     * Update the front-end to reflect a successful creation of a favourite.
     * @param {object} favourite - The newly created favourite.
     * @param {dict} responseHeaders - The response headers returned by POST.
     */
    var createFavouriteSuccess = function(favourite, responseHeaders){
      scope.favourites.data.splice(0, 0, favourite);
    };

    /**
     * Throw an alert and error when something went wrong with the creation
     * of the favourite.
     * @param {dict} httpResponse - The httpResponse headers returned by the
     *                              POST.
     */
    var createFavouriteError = function(httpResponse){
      notie.alert(3,
        gettextCatalog.getString(
          "Oops! Something went wrong while creating the favourite."));
      throw new Error(
        httpResponse.status + " - " + "Could not create favourite.");
    };

    /**
     * Create a new favourite with the current portal state.
     */
    scope.createFavourite = function () {
      var oldRelativeVal = !!State.temporal.relative;
      State.temporal.relative = scope.favourite.relative;

      // if the time is temporal save the now to calculate the
      // intervals
      if (State.temporal.relative) {
        State.temporal.now = Date.now();
      }

      FavouritesService.createFavourite(
        scope.favourite.name,
        State,
        createFavouriteSuccess,
        createFavouriteError
      );
      State.temporal.relative = oldRelativeVal;
    };
  };

  return {
    restrict: 'E',
    link: link,
    templateUrl: 'favourites/templates/favourites-add.html'
  };
  }]);

/**
 * @module
 * @description Share favourites.
 */
angular.module('favourites')
  .directive('shareFavourites', ['$window', function ($window) {

    var link = function (scope, element, attrs) {

      scope.shareFavourite = function (favourite) {
        scope.favouriteURL = $window.location.origin +
          '/favourites/' +
          favourite.uuid;
      };
    };

    return {
      restrict: 'E',
      link: link,
      templateUrl: 'favourites/templates/favourites-share.html'
    };
  }]);
