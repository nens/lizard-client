'use strict';
/**
 * @module
 * @description Annotations wrapper for viewing and making annotations.
 */
angular.module('annotations')
  .directive('annotations', [function () {
    var link = function (scope, element, attrs) {
      scope.annotations = {};
    };

    return {
      restrict: 'E',
      link: link,
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

      var fetchAnnotations = function(asset) {
        scope.annotations = AnnotationsService.getAnnotationsForObject(
          asset.entity_name, asset.id
        );
      };

      /**
       * Get annotations when asset changes.
       */
      scope.$watch('asset', function () {
        fetchAnnotations(scope.asset);
      });

      /**
       * Remove annotation from database when delete icon is clicked.
       * Update the front-end to reflect a successful delete or throw an alert
       * on error.
       */

      var deleteAnnotationSuccess = function(
          annotation, value, responseHeaders) {
        scope.annotations.splice(scope.annotations.indexOf(annotation), 1);
      };

      var deleteAnnotationError = function(httpResponse) {
        console.log(httpResponse);
        $window.alert(
          gettext(
            "Oops! Something went wrong while deleting the annotation."));
        throw new Error(
          httpResponse.status + " - "
          + gettext(
            "Could not delete previously retrieved annotation:")
          + " " + httpResponse.config.url
          + ".");
      };

      scope.deleteAnnotation = function (annotation) {
        AnnotationsService.deleteAnnotation(
          annotation,
          deleteAnnotationSuccess.bind(undefined, annotation),
          deleteAnnotationError);
      };
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        annotations: '='
      },
      templateUrl: 'annotations/templates/annotations-view.html'
    };
  }]);

/**
 * @module
 * @description Create asset annotations.
 */
angular.module('annotations')
  .directive('annotationsMake',
             ['AnnotationsService', '$window', 'gettext',
              function (AnnotationsService, $window, gettext) {

    var link = function (scope, element, attrs) {

      var createAnnotationSuccess = function(value, responseHeaders){
        scope.annotations.splice(0, 0, value);
      };

      var createAnnotationError = function(httpResponse){
        $window.alert(
          gettext(
            "Oops! Something went wrong while creating the annotation."));
        throw new Error(
          httpResponse.status + " - "
          + gettext(
            "Could not create annotation."));
      };

      scope.createAnnotation = function (text) {
        AnnotationsService.addAnnotationToObject(
          scope.asset, text, createAnnotationSuccess, createAnnotationError
        );
      };
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        asset: '=',
        annotations: '='
      },
      templateUrl: 'annotations/templates/annotations-make.html'
    };

  }]);
