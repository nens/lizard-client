'use strict';

angular.module('lizard-nxt')
  .service('ResourceModel', ['$http', function ($http) {

    function ResourceModel (url, resourceOptions) {
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

    return ResourceModel;
  }
]);
