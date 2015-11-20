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

      this.addAnnotationToObject = function (asset, text, success, error) {
        return Annotations.save({
          object_type: asset.entity_name,
          object_id: asset.id,
          text: text,
          datetime_from: new Date().toISOString(),
          datetime_until: new Date().toISOString()
          // picture_url
        }, success, error);
      };

      return this;
    }
  ]);
