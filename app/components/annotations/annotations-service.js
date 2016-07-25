/**
 * Service to handle annotations retrieval and creation.
 */
angular.module('annotations')
  .service("AnnotationsService", ['$resource', 'State', 'MapService',
    function ($resource, State, MapService) {

      /**
       * Date formatter that formats the date based on the timeline window.
       */
      this.formatDatetime = function () {
        var range = State.temporal.end - State.temporal.start;
        if (range > 31536000000) {  // more than a year
          return "d MMM ''''yy";
        } else if (range > 86400000) {  // more than a day
          return "d MMM";
        } else {  // less than a day
          return "H:mm:ss";
        }
      };

      /* Create a resource for interacting with the annotations endpoint of the
       * API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       * Use a reconfigured 'save' to be able to send an attachment file using
       * 'multipart/form-data' content-type headers.
       */
      var Annotations = $resource('/api/v2/annotations/:id/', {}, {
        'query': {
          method:'GET',
          isArray:true,
          transformResponse:
            function (data, headers) {
              return angular.fromJson(data).results;
            }
        },
        'save': {
          method: 'POST',
          transformRequest: angular.identity,
          headers: { 'Content-Type': undefined }
        }
      });

      /* Create a resource for interacting with the organisations endpoint of
       * the API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var Organisations = $resource('/api/v2/organisations/:uuid/', {}, {
        'query': {
          method:'GET',
          isArray:true,
          transformResponse:
            function (data, headers) {
              return angular.fromJson(data).results;
            }
        }
      });

      /**
       * Get all organisations of a user.
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on a failed GET.
       */
      this.getOrganisations = function(success, error) {
        return Organisations.query({'page_size': 1000}, success, error);
      };

      /**
       * Get all annotations for an asset.
       * @param {string} model - The model name of the asset (e.g. manhole).
       * @param {integer} id - The ID of the asset.
       * @param {integer} limit - Limit the number of returned annotations.
       * @param {Date} start - Filter the annotations on a start-end date
       *                       range.
       * @param {Date} end - Filter the annotations on a start-end date range.
       * @param {function} success - Execute this function on a successful
       *                             GET.
       * @returns {array} - An array of annotations.
       */
      this.getAnnotationsForObject = function (
          model, id, limit, start, end, success) {
        return Annotations.query({
          object_type__model: model,
          object_id: id,
          limit: limit,
          start: start,
          end: end,
          ordering: '-timestamp_start'
        }, success);
      };

      /**
       * Remove an annotation from the API.
       * @param {object} annotation - The annotation to be deleted.
       * @param {function} success - Execute this function on a successful
       *                             DELETE.
       * @param {function} error - Execute this function when something goes
       *                           wrong with the DELETE.
       */
      this.deleteAnnotation = function (annotation, success, error) {
        return Annotations.delete({id: annotation.id}, success, error);
      };

      /**
       * Add a new annotation to the API.
       * @constructor
       * @param {object} asset - The asset to which the annotation is related.
       * @param {string} text - The actual annotation message.
       * @param {string} file - An optional attachment for the annotation.
       * @param {Date} timelineat - A date to use for timestamp_start and
       *                            timestamp_end.
       * @param {object} organisation - The organisation to which the
       *                                annotation is related.
       * @param {function} success - Execute this function on a successful
       *                             POST.
       * @param {function} error - Execute this function when something goes
       *                           wrong with the POST.
       * @returns {object} - The new annotation.
       */
      this.addAnnotationToObject = function (
          asset, text, file, timelineat, organisation, success, error) {

        var fd = new FormData();
        if (file) {
          fd.append('attachment', file);
        }
        if (asset.entity_name) {
          fd.append('object_type', asset.entity_name);
        }
        if (asset.id) {
          fd.append('object_id', asset.id);
        }
        fd.append('text', text);
        fd.append('timestamp', timelineat);
        fd.append('organisation', organisation.unique_id);
        fd.append('location', JSON.stringify(asset.geometry));

        return Annotations.save(fd, success, error);
      };


      /**
       * Refresh the annotationlayer if present. Event layer clear data when
       * turned off. So turn off and on.
       */
      this.refreshAnnotationLayer = function () {
        if (State.annotations.active) {
          State.annotations.active = false;
          MapService.updateAnnotations();
          State.annotations.active = true;
          MapService.updateAnnotations();
        }
      };

      return this;
    }
  ]);
