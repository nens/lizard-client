'use strict';

/**
 * @class Resource
 * @memberof lizard-nxt
 * @description Helper functions for getting data from places
 */
angular.module('lizard-nxt')
  .service('Resource', ['$http', function ($http) {

  this.baseUrl = '';

  /**
   * @function
   * @description sets Base url of resource (application wide)
   * @params {string} baseurl e.g. https://demo.lizard.net/
   */
  this.setBaseUrl = function (baseUrl) {
    this.baseUrl = baseUrl;
  };

  /**
   * @functtion
   * @description makes an url based on base url and the url param
   * @params {string} url e.g. api/v2/search/
   * @params {string} baseurl - optional e.g. https://demo.lizard.net/
   */
  this.makeUrl = function (url, baseUrl) {
    if (baseUrl) {
      return baseUrl + url;
    } else {
      return this.baseUrl + url;
    }
  };

  this.options = {};
  
  /**
   * @function
   * @description sets $http settings application wide like default Headers
   * @params {object} - options object e.g. {withCredentials: true}
   */
  this.setDefaultHttpFields = function (options) {
    this.options = angular.extend(this.options, options);
  };

  /**
   * @function
   * @description helper function for options that $http uses
   * @params {string} url - e.g. 'api/v2/timeseries/'
   * @params {object} params - url parameters e.g. {q: 'this-is-a-query-param'}
   * @params {string} method - HTTP method e.g. 'PUT'
   */
  this.buildOptions = function (url, params, method) {
    var options = angular.copy(this.options);
    angular.extend(options, {
      url: this.makeUrl(url),
      method: (method) ? method : 'GET',
      params: params
    });

    return options; 
  };

  var self = this;

  /**
   * @memberof Resource
   * @class Endpoint
   * @description Wrapper for $http to do stuff on the REST API
   */
  this.Endpoint = function (url, resourceOptions) {
    this.url = url;

    /**
     * @function
     * @description GET method on rest api
     */
    this.get = function (params) {
      var newUrl = self.makeUrl(this.url, this.baseUrl);
      var options = self.buildOptions(newUrl, params, 'GET');

      if (resourceOptions) {
        angular.extend(options, resourceOptions);
      }

      return $http(options)
        .then(function (response) {
          return response.data;
        }, function (error) {
          throw error;
        });
    };

    /**
     * @function
     * @description only set base url for this endpoint not for all resources
     */
    this.setBaseUrl = function (url) {
      this.baseUrl = url;
      return this;
    };

  };

}]);
