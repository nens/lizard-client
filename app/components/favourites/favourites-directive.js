/**
 * @module
 * @description Show favourites menu.
 */
angular.module('favourites')
  .directive('favourites', ['$rootScope','$timeout','FavouritesService', function ($rootScope, $timeout, FavouritesService) {

  var link = function (scope, element, attrs) {

    scope.favourites = {
      isEnabled: FavouritesService.isShowingFavsContainer
    };

    scope.favsContainerEnabled = FavouritesService.favsContainerEnabled;
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
             ['$window', 'FavouritesService', 'notie', 'gettextCatalog', 'State',
              function ($window, FavouritesService, notie, gettextCatalog, State) {

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
      console.error("Error while fetching favorite:", httpResponse);
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
      console.error("[E] deleteFavouriteError:", httpResponse);
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
      // Actually *redirect* to the 'share favourite' link.
      // That way we can always be sure everything currently happening
      // in the application is reset to a pristine state.
      var newLocation = $window.location.origin +
                        '/favourites/' +
                        favourite.uuid;
      $window.location = newLocation;
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
      // after creating new favourite is succesfull empty form
      if (scope.favourite.name === favourite.name) {
        scope.resetForm();
      }
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

    /*
    if a favourite is typed into the new favourites input then it returns true if
    the name of this new favourite is unique (not already used by an existing favourite)
    */
    scope.isNameUniqueAmongFavourites = function () {
      if (!scope.favourite) {
        return true;
      } else {
        return scope.favourites.data.map(function(e){return e.name;})
          .indexOf(scope.favourite.name) === -1;
      }
    };

    /*
    Decide if + (new) button should be disabled
    */
    scope.createNewButtonShouldBeDisabled = function () {
      return (!scope.isNameUniqueAmongFavourites()) || scope.favouritesForm.$invalid;
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
