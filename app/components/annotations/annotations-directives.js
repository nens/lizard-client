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
 * @description Directive for a file field.
 */
angular.module('annotations')
.directive('fileModel', ['$parse', function ($parse) {

  var link = function(scope, element, attrs) {
    var model = $parse(attrs.fileModel);
    var modelSetter = model.assign;

    element.bind('change', function(){
      var file = element[0].files[0];
      scope.$apply(function(){
        modelSetter(scope, file);
        scope.annotationform.attachment.$dirty = true;
        scope.annotationform.attachment.$pristine = false;
        // use .$setDirty() when angular > 1.3.4?
      });
    });
  };

  return {
    restrict: 'A',
    link: link
  };
}]);

/**
 * @module
 * @description Max size validation on file field.
 */
angular.module('annotations')
  .directive('maxSize', [function() {

    var link = function(scope, element, attrs, ngModel) {
      scope.$watch(attrs.fileModel, function() {
        var file = element[0].files[0];
        ngModel.$setValidity('maxsize', !(file && file.size > attrs.maxSize));
      });
    };

    return {
      require: 'ngModel',
      link: link
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

      scope.resetForm = function() {
        scope.text = angular.copy({});
        scope.attachment = angular.copy({});
        angular.forEach(
          angular.element("input[type='file']"),
            function(inputElem) {
            angular.element(inputElem).val(null);
        });
        scope.annotationform.$setPristine();
      };

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

      scope.createAnnotation = function () {
        AnnotationsService.addAnnotationToObject(
          scope.asset,
          scope.text,
          scope.attachment,
          createAnnotationSuccess,
          createAnnotationError
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
