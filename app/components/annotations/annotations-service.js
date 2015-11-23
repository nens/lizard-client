/**
 * Service to handle annotations retrieval and creation.
 */
angular.module('annotations')
  .service("AnnotationsService", ['Restangular',
    function (Restangular) {

      var annotationsResource = Restangular.withConfig(
        function(RestangularConfigurer) {
          RestangularConfigurer.setRequestSuffix('/');
          RestangularConfigurer.addResponseInterceptor(function(response, operation) {
            return response.results;
          });
        }).all('api/v2/annotations');

      this.getAnnotationsForObject = function (model, id) {
        return annotationsResource.getList({
          object_type__model: model,
          object_id: id
        });
      };

      this.deleteAnnotation = function (annotation) {
        return annotation.remove();
      };

      return this;
    }
  ]);
