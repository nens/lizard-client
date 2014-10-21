//layer-directive.js

angular.module('lizard-nxt')
  .directive("layerChooser", ['NxtMap', 'UtilService', 'dataLayers',
    function (NxtMap, UtilService, dataLayers) {

  var link = function (scope, element, attrs) {
    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    var layerGroup = dataLayers[scope.layergroup.slug];
    var chooser = new NxtMap(element.find('.layer-img')[0], [layerGroup], {
      center: [52.39240447569775, 5.101776123046875],
      zoom: 6,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      tap: false,
      scrollWheelZoom: false,
      animate: true,
      zoomControl: false,
      attributionControl: false
    });

    chooser.toggleLayerGroup(chooser.layerGroups[Object.keys(chooser.layerGroups)[0]]);

    scope.$watch('mapState.bounds', function (n, v) {
      if (n === v) { return; }
      var zoom = scope.mapState.zoom;
      var centroid = scope.mapState.bounds.getCenter();
      chooser.setView(centroid, zoom - 2);
    });

    var localClick, mouseMove;

    var startClick = function (e) {
      localClick = e.clientX;
      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].clientX;
      }
    };

    var onMove = function (e) {
      if (localClick) {
        mouseMove = true;
      } else {
        mouseMove = false;
      }
    };

    var thismuch;

    var endClick = function (e) {
      if (!mouseMove) {
        scope.mapState.toggleLayerGroup(scope.layergroup);
        return;
      }     
      var releaseX = (e.clientX) ? e.clientX : e.originalEvent.changedTouches[0].clientX;
      thismuch = releaseX - localClick;
      var ratio = thismuch / e.target.clientWidth;
      var newOpacity;
      if (ratio > 1) {
        newOpacity = 1;
      } else if (ratio < -1) {
        newOpacity = -1;
      } else {
        newOpacity = newOpacity;
      }
      scope.layergroup.setOpacity(newOpacity);
      localClick = null;
      mouseMove = null;
    };

    element.bind('mousedown', startClick);
    element.bind('mousemove', onMove);
    element.bind('mouseup', endClick);

    element.bind('touchstart', startClick);
    element.bind('touchmove', onMove);
    element.bind('touchend', endClick);

  };

  return {
    link: link,
    templateUrl: 'templates/layer-chooser.html',
    restrict: 'E'
  };

}]);
