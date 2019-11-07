//layer-directive.js

angular.module('data-menu')
.directive('assetlayer', ['MapService', 'LayerAdderService', 'assetMapLayer',
  function (MapService, LayerAdderService, assetMapLayer) {
    var link = function (scope) {

      scope.remove = function (layer) { 
        layer.active = !layer.active;
        // the following line is in a timeout because the previous line to remove(inactivate) also the legend does otherwise not work.
        // The timeout has as effect that we first wait untill the entire code execution is finished and only after remove the layer.
        // Effectively we thus first wait for  the layer to be inactivated before we remove it. 
        // Inactivating the layer will remove the legend of the layer.
        // https://nelen-schuurmans.atlassian.net/browse/FRNT-469
        window.setTimeout(function() { LayerAdderService.remove(layer); }, 0); 
      };

      // Set defaults.
      if (!scope.layer.opacity) { scope.layer.opacity = 1; }
      if (!scope.layer.name) {
        scope.layer.name = scope.layer.type + ' ' + scope.layer.uuid;
      }

      var cancelFirstActive = scope.$watch('layer.active', function () {
        if (scope.layer.active) {
          LayerAdderService.fetchLayer(
            scope.layer.type + 's',
            scope.layer.uuid, scope.layer.name
          )
          .then(function (response) {

            // If the layer did not have a name, check if the backend has one.
            if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
              && response.name) {
              scope.layer.name = response.name;
            }

            // Create maplayer, add maplayer to mapservice.
            MapService.mapLayers.push(assetMapLayer({
              uuid: scope.layer.uuid,
              url: 'api/v3/tiles/' + scope.layer.uuid,
              zIndex: LayerAdderService.getZIndex(scope.layer)
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
        scope.layer.active = false;
        MapService.updateLayers([scope.layer]);
        _.pull(MapService.mapLayers, {uuid: scope.layer.uuid });
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
