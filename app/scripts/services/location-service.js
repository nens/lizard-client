'use strict';

/**
 * @ngdoc service
 * @name lizardClientApp.locationService
 * @description
 * # locationService
 * Service in the lizardClientApp.
 */
angular.module('lizard-nxt')
  .service('LocationService', ['CabinetService', function LocationService(CabinetService) {

    this.search = function (searchString) {
      if (searchString.length > 1) {
        return CabinetService.geocode.get({q: searchString});
      }
    };

  }
]);
