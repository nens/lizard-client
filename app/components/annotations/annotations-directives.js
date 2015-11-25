'use strict';
/**
 * @module
 * @description Annotations wrapper for viewing and making annotations.
 */
angular.module('annotations')
  .directive('annotations', [function () {
    return {
      restrict: 'E',
      templateUrl: 'annotations/templates/annotations.html'
    };
  }]);

/**
 * @module
 * @description Show asset annotations.
 */
angular.module('annotations')
  .directive('annotationsView',
             ['AnnotationsService', '$window', 'gettext',
              function (AnnotationsService, $window, gettext) {

    var link = function (scope, element, attrs) {
      scope.annotations = {};

      var fetchAnnotations = function(asset) {
        AnnotationsService.getAnnotationsForObject(
          asset.entity_name, asset.id
        ).then(function (response) {
          scope.annotations = response;
        });
      };

      /**
       * Get annotations when asset changes.
       */
      scope.$watch('asset', function () {
        fetchAnnotations(scope.asset);
      });

      /**
       * Remove annotation from database when delete icon is clicked.
       * Update the front-end to reflect a successful delete.
       */
      scope.deleteAnnotation = function (annotation) {
        AnnotationsService.deleteAnnotation(
          annotation
        ).then(function (response) {
          scope.annotations.splice(scope.annotations.indexOf(annotation), 1);
        }, function (response) {
          $window.alert(
            gettext(
              "Oops! Something went wrong while deleting the annotation."));
          throw new Error(
            response.status + " - "
            + gettext(
              "Could not delete previously retrieved annotation with id:")
            + " " + annotation.id
            + ".");
        });
      };
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        annotations: '@'
      },
      templateUrl: 'annotations/templates/annotations-view.html'
    };
  }]);

  /**
   * @module
   * @description Create asset annotations.
   */
angular.module('annotations')
  .directive('annotationsMake', [function () {
    return {
      restrict: 'E',
      templateUrl: 'annotations/templates/annotations-make.html'
    };
  }]);
