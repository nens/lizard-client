'use strict';
/**
 * @module
 * @description Annotations wrapper for viewing and making annotations.
 */
angular.module('annotations')
  .directive('annotations', [function () {
    var link = function (scope, element, attrs) {
      scope.annotations = [];
    };

    return {
      restrict: 'E',
      scope: {
        data: '=',
        timeState: '=',
      },
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
             ['AnnotationsService', '$window', 'gettextCatalog', 'notie',
              function (AnnotationsService, $window, gettextCatalog, notie) {

    var link = function (scope, element, attrs) {

      /**
       * Provide a date time formatter for the annotations templates.
       */
      scope.formatDatetime = function() {
        return AnnotationsService.formatDatetime();
      };

      /**
       * Update front-end upon successful GET of the annotations.
       * @param {array} value - annotations returned by the request.
       * @param {dict} responseHeaders - Not actually used but required
       *                                       by $resource.
       */
      var fetchAnnotationsSuccess = function(value, responseHeaders) {
        scope.annotations = value;
      };

      /**
       * Get all annotations for an asset or geometry.
       * @returns {array} - An array of annotations.
       */
      var fetchAnnotations = function() {
        if (scope.data.properties && scope.data.properties.annotations) {
          var events = scope.data.properties.annotations.data;
          var annotations = scope.data.properties.annotations.data;
          fetchAnnotationsSuccess(annotations);
        }

        else if (scope.data && scope.data.entity_name && scope.data.id) {
          AnnotationsService.getAnnotationsForObject(
            scope.data.entity_name,
            scope.data.id,
            5,
            scope.timeState.start,
            scope.timeState.end,
            fetchAnnotationsSuccess
          );
        }

        else {
          scope.annotations = [];
        }

      };

      /**
       * Get annotations when asset changes.
       */
      scope.$watch('data', function () {
        fetchAnnotations();
      });

      /**
       * Update annotations when timeline has moved.
       */
      scope.$watch('timeState.timelineMoving', function (off) {
        if (!off) {
          fetchAnnotations();
        }
      });
      /**
       * Update the front-end to reflect a successful delete of an annotation.
       * Both on the map and timeline as in the box.
       * @param {object} id - The ID of the asset.
       * @param {?} value - Not actually used but required by $resource.
       * @param {dict} responseHeaders - Not actually used but required
       *                                       by $resource.
       */
      var deleteAnnotationSuccess = function(
          annotation, value, responseHeaders) {
        scope.annotations.splice(scope.annotations.indexOf(annotation), 1);
        AnnotationsService.refreshAnnotationLayer();
      };

      /**
       * Throw an alert and error when something went wrong with the deletion
       * of the annotation.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              DELETE.
       */
      var deleteAnnotationError = function(httpResponse) {
        notie.alert(3,
          gettextCatalog.getString(
            "Oops! Something went wrong while deleting the annotation."));
        throw new Error(
          httpResponse.status + " - "
          + "Could not delete previously retrieved annotation:"
          + " " + httpResponse.config.url
          + ".");
      };

      /**
       * Remove annotation from database when delete icon is clicked.
       * Update the front-end to reflect a successful delete or throw an alert
       * on error.
       * @param {object} annotation - The annotation to be deleted.
       */
      var deleteAnnotation = function (annotation) {
        AnnotationsService.deleteAnnotation(
          annotation,
          deleteAnnotationSuccess.bind(undefined, annotation),
          deleteAnnotationError);
      };

      /**
       * Delete a notification after request for confirmation.
       * @param {object} annotation - The annotation to be deleted.
       */
      scope.deleteAnnotation = function (annotation) {
        notie.confirm(
            gettextCatalog.getString(
              "Are you sure you want to delete this annotation?"),
            gettextCatalog.getString("Yes"),
            gettextCatalog.getString("No"),
            deleteAnnotation.bind(undefined, annotation));
      };
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        data: '=',
        annotations: '=',
        timeState: '='
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
 * @description Max file size validation on file field.
 */
angular.module('annotations')
  .directive('maxFileSize', [function() {

    /**
     * Validate a file on its size with the max-file-size attribute on file
     * upload fields.
     * @param {string} scope - The scope.
     * @param {array} element - The input field HTML element.
     * @param {dict} attrs - The attributes on the input field.
     * @param {controller} ngModel - The Angular ngModel controller.
     */
    var link = function(scope, element, attrs, ngModel) {
      scope.$watch(attrs.fileModel, function() {
        var file = element[0].files[0];
        ngModel.$setValidity('maxFileSize',
                             !(file && file.size > attrs.maxFileSize));
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
             ['AnnotationsService', '$window', 'gettextCatalog', 'notie',
              'user', 'State',
              function (AnnotationsService, $window, gettextCatalog, notie,
                        user, State) {

    var link = function (scope, element, attrs) {

      scope.user = user;

      /**
       * Provide a date time formatter for the annotations templates.
       */
      scope.formatDatetime = function() {
        return AnnotationsService.formatDatetime();
      };

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
        scope.resetForm();
        AnnotationsService.refreshAnnotationLayer();
      };

      /**
       * Throw an alert and error when something went wrong with the creation
       * of the annotation.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              POST.
       */
      var createAnnotationError = function(httpResponse){
        notie.alert(3,
          gettextCatalog.getString(
            "Oops! Something went wrong while creating the annotation."));
        throw new Error(
          httpResponse.status + " - " + "Could not create annotation.");
      };

      /**
       * Create a new annotation on an asset.
       */
      scope.createAnnotation = function () {
        AnnotationsService.addAnnotationToObject(
          scope.data,
          scope.text,
          scope.attachment,
          scope.timelineat,
          scope.selectedOrganisation,
          createAnnotationSuccess,
          createAnnotationError
        );
      };

      /**
       * Update the scope to reflect a successful fetch of the user's
       * organisations.
       * @param {array} value - The organisations.
       * @param {dict} responseHeaders - The response headers returned by GET.
       */
      var getOrganisationsSuccess = function(value, responseHeaders) {
        user.organisations = value;
        scope.selectedOrganisation = user.organisations[0];
      };

      /**
       * Throw an alert and error when something went wrong with getting the
       * organisations.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              GET.
       */
      var getOrganisationsError = function(httpResponse) {
        notie.alert(3,
            gettextCatalog.getString(
              "Oops! Something went wrong while fetching your organisations.")
        );
        throw new Error(
          httpResponse.status + " - " + "Could not get organisations.");
      };

      /**
       *  Get the user's organisations if they haven't already been retrieved.
       */
      var getUserOrganisations = function () {
        if (!user.hasOwnProperty('organisations')) {
          AnnotationsService.getOrganisations(
            getOrganisationsSuccess, getOrganisationsError);
        } else {
          scope.selectedOrganisation = user.organisations[0];
        }
      };
      getUserOrganisations();
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        data: '=',
        annotations: '=',
        timelineat: '='
      },
      templateUrl: 'annotations/templates/annotations-make.html'
    };

  }]);
