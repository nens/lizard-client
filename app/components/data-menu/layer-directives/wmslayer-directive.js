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
          LayerAdderService.fetchLayer(scope.layer.type + 's', scope.layer.uuid, scope.layer.name)
          .then(function (response) {

            // If the layer did not have a name, check if the backend has one.
            if (scope.layer.name === scope.layer.type + ' ' + scope.layer.uuid
              && response.name) {
              scope.layer.name = response.name;
              scope.layer.legendUrl = response.legend_url;// adds legendUrl to legend-service.js #226
            }

            MapService.mapLayers.push(wmsMapLayer({
              uuid: scope.layer.uuid,
              slug: response.slug,
              minZoom: response.min_zoom,
              maxZoom: response.max_zoom,
              complexWmsOptions: response.options,
              url: response.url,
              getFeatureInfoUrl: response.get_feature_info_url,
              zIndex: LayerAdderService.getZIndex(scope.layer),
              legendUrl: response.legend_url
            }));

            if (response.get_feature_info) {
              DataService.dataLayers.push(wmsFeatureInfoDataLayer({
                uuid: scope.layer.uuid,
                name: scope.layer.name,
                slug: response.slug,
                url: response.url,
                getFeatureInfoUrl: response.get_feature_info_url,
                legendUrl: response.legend_url
              }));
            }

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
        _.pull(DataService.dataLayers, {uuid: scope.layer.uuid });
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
