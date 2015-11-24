'use strict';

angular.module('lizard-nxt')
  .service('Resource', ['$http', function ($http) {

    function Resource (url, resourceOptions) {
      this.get = function (params) {
        var options = {
          url: url,
          method: 'GET',
          params: params
        };
        if (options) {
          angular.extend(options, resourceOptions);
        }

        return $http(options)
          .then(function (response) {
            return response.data;
          });
      };

      return this;
    }

    return Resource;
  }
]);
