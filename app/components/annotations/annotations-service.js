/**
 * Service to handle annotations retrieval and creation.
 */
angular.module('annotations')
  .service("AnnotationsService", ['$resource',
    function ($resource) {

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

      this.getAnnotationsForObject = function (model, id) {
        return Annotations.query({
          object_type__model: model,
          object_id: id
        });
      };

      this.deleteAnnotation = function (annotation, success, error) {
        return Annotations.delete({id: annotation.id}, success, error);
      };

      this.addAnnotationToObject = function (
          asset, text, file, success, error) {
        var fd = new FormData();
        fd.append('attachment', file);
        fd.append('object_type', asset.entity_name);
        fd.append('object_id', asset.id);
        fd.append('text', text);
        fd.append('datetime_from', new Date().toISOString());
        fd.append('datetime_until', new Date().toISOString());
        return Annotations.save(fd, success, error);
      };

      return this;
    }
  ]);
