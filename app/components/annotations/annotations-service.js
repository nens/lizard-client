/**
 * Service to handle annotations retrieval and creation.
 */
angular.module('annotations')
  .service("AnnotationsService", ['Restangular', '$http',
    function (Restangular, $http) {

      var annotationsURL = 'api/v2/annotations';

      var annotationsResource = Restangular.withConfig(
        function(RestangularConfigurer) {
          RestangularConfigurer.setRequestSuffix('/');
          RestangularConfigurer.addResponseInterceptor(function(response, operation) {
            return response.results;
          });
        }).all(annotationsURL);

      this.getAnnotationsForObject = function (model, id) {
        return annotationsResource.getList({
          object_type__model: model,
          object_id: id
        });
      };

      this.deleteAnnotation = function (annotation) {
        return annotation.remove();
      };

      this.addAnnotationToObject = function (asset, text) {
        var newAnnotation = {
          object_type: asset.entity_name,
          object_id: asset.id,
          text: text,
          datetime_from: new Date().toISOString(),
          datetime_until: new Date().toISOString()
          // picture_url
        };
        return $http.post(annotationsURL + '/', newAnnotation);
      };

      return this;
    }
  ]);
