//layer-directive.js

angular.module('data-menu')
.directive('wmslayer', ['MapService', 'DataService', 'LayerAdderService', 'wmsMapLayer', 'wmsFeatureInfoDataLayer', function (MapService, DataService, LayerAdderService, wmsMapLayer, wmsFeatureInfoDataLayer) {
  var link = function (scope) {

    scope.remove = LayerAdderService.remove;

    var cancelFirstActive = scope.$watch('layer.active', function () {
      if (scope.layer.active) {
        LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid)
        .then(function (response) {

          MapService.mapLayers.push(wmsMapLayer({
            uuid: scope.layer.uuid,
            wmsOptions: response.options,
            url: response.url
          }));

          DataService.dataLayers.push(wmsFeatureInfoDataLayer({

          }));

          MapService.updateLayers([scope.layer]);
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

}]);
