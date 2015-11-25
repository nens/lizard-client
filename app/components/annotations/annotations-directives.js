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

      /**
       * Get all annotations for an asset.
       * @param {object} asset - The asset to get the annotations for.
       * @returns {array} - An array of annotations.
       */
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
       * Update the front-end to reflect a successful delete of an annotation.
       * @param {object} id - The ID of the asset.
       * @param {?} value - Not actually used but required by $resource.
       * @param {dict} responseHeaders - Not actually used but required
       *                                       by $resource.
       */
      var deleteAnnotationSuccess = function(
          annotation, value, responseHeaders) {
        scope.annotations.splice(scope.annotations.indexOf(annotation), 1);
      };

      /**
       * Throw an alert and error when something went wrong with the deletion
       * of the annotation.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              DELETE.
       */
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

      /**
       * Remove annotation from database when delete icon is clicked.
       * Update the front-end to reflect a successful delete or throw an alert
       * on error.
       * @param {object} annotation - The annotation to be deleted.
       */
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

    /**
     * Add the file to the scope after a change on the file input field
     * (someone selected a file on their system).
     */
    element.bind('change', function(){
      var file = element[0].files[0];
      scope.$apply(function(){
        modelSetter(scope, file);
        scope.annotationform.attachment.$setDirty();
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

    /**
     * Validate a file on its size with the max-size attribute on file upload
     * fields.
     * @param {string} scope - The scope.
     * @param {array} element - The input field HTML element.
     * @param {dict} attrs - The attributes on the input field.
     * @param {controller} ngModel - The Angular ngModel controller.
     */
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

      /**
       * Reset (empty) the annotation form.
       * Otherwise if a user has once selected a file to upload and decides he
       * no longer wants an attachment he won't be able to remove the
       * attachment.
       */
      scope.resetForm = function() {
        scope.text = angular.copy(null);
        scope.attachment = angular.copy(null);
        angular.forEach(
          angular.element("input[type='file']"),
            function(inputElem) {
            angular.element(inputElem).val(null);
        });
        scope.annotationform.$setPristine();
      };

      /**
       * Update the front-end to reflect a successful creation of an
       * annotation.
       * @param {object} value - The newly created annotation.
       * @param {dict} responseHeaders - The response headers returned by POST.
       */
      var createAnnotationSuccess = function(value, responseHeaders){
        scope.annotations.splice(0, 0, value);
      };

      /**
       * Throw an alert and error when something went wrong with the creation
       * of the annotation.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              POST.
       */
      var createAnnotationError = function(httpResponse){
        $window.alert(
          gettext(
            "Oops! Something went wrong while creating the annotation."));
        throw new Error(
          httpResponse.status + " - "
          + gettext(
            "Could not create annotation."));
      };

      /**
       * Create a new annotation on an asset.
       */
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
