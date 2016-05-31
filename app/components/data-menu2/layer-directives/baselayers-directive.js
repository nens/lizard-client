//layer-directive.js

angular.module('data-menu')
.directive('baselayers', ['MapService', function (MapService) {
  var link = function (scope) {

    var topography = 'http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa98k8k';
    var sattelite = 'http://{s}.tiles.mapbox.com/v3/nelenschuurmans.iaa79205';

    var BASELAYERS = [
      {
        name: 'Topography',
        slug: 'topography',
        layer: MapService.initializers.tms(topography)
      },
      {
        name: 'Sattelite',
        slug: 'sattelite',
        layer: MapService.initializers.tms(sattelite)
      }
    ];

    var current = BASELAYERS.length - 1;

    scope.$watch('layer.baselayer', function () {
      _.forEach(BASELAYERS, function (layer) {
        MapService.removeLeafletLayer(layer);
        if (layer.slug === scope.layer.baselayer) {
          MapService.addLeafletLayer(layer);
          scope.name = layer.name;
        }
      });
    });

    scope.next = function () {
      current = (current + 1) % BASELAYERS.length -1;
      scope.layer.baselayer = BASELAYERS[current].slug;
    };

  };

  return {
    link: link,
    scope: {
      layer: '='
    },
    templateUrl: 'data-menu/templates/baselayers.html',
    restrict: 'E',
  };

}]);
