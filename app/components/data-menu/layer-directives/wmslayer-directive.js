//layer-directive.js

angular.module('data-menu')
.directive('wmslayer', [
  'MapService',
  'DataService',
  'LayerAdderService',
  'wmsMapLayer',
  'wmsFeatureInfoDataLayer',
  function (
    MapService,
    DataService,
    LayerAdderService,
    wmsMapLayer,
    wmsFeatureInfoDataLayer
  ) {
    var link = function (scope) {

      scope.remove = LayerAdderService.remove;

      // Set defaults.
      if (!scope.layer.opacity) { scope.layer.opacity = 1; }
      if (!scope.layer.name) {
        scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid
      }

      var cancelFirstActive = scope.$watch('layer.active', function () {
        if (scope.layer.active) {
          LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid, scope.layer.name)
          .then(function (response) {

            // If the layer did not have a name, check if the backend has one.
            if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
              && response.name) {
              scope.layer.name = response.name;
            }

            MapService.mapLayers.push(wmsMapLayer({
              uuid: scope.layer.uuid,
              wmsOptions: response.options,
              url: response.url
            }));

            DataService.dataLayers.push(wmsFeatureInfoDataLayer({

            }));

            MapService.updateLayers([scope.layer]);
          })

          .catch(function () {
            scope.invalid = true;
          });

          cancelFirstActive();
        }
      });

      scope.$on('$destroy', function () {
        // Remove layer from mapLayers and DataService
      });

    };

    return {
      link: link,
      scope: {
        layer: '=',
      },
      templateUrl: 'data-menu/templates/layer.html',
      restrict: 'E',
    };

  }
]);
