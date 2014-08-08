//layer-directive.js

app.directive("layerChooser", function () {
  var link, buildImageURL;
  link = function (scope, element, attrs) {
    scope.$watch('mapState.pixelCenter', function (n, v) {
      if (n === v) { return; }
      if (scope.layer.type === 'WMS') {
        // Copying getTileURL behavior of Leaflet
        // Otherwise WMS tiles don't correspond with TMS'
        // Takes the bounds and calculates a tile around the center.
        var bbox, tileSize, nwPoint, nw, sePoint, se, crsString, crs;

        nwPoint = L.point(scope.mapState.pixelCenter.x - 256, scope.mapState.pixelCenter.y - 256)
        sePoint = nwPoint.add([256, 256]);

        // if 
        if (scope.layer.leafletLayer.wmsParams.hasOwnProperty('srs')) {
          crsString = scope.layer.leafletLayer.wmsParams.srs;
          crsString = crsString.split(':').join('');
          crs = L.CRS[crsString]; 
        } else {
          crs = L.CRS.EPSG4326;
        }
        nw = crs.project(scope.map.unproject(nwPoint, scope.map.getZoom()));
        se = crs.project(scope.map.unproject(sePoint, scope.map.getZoom()));

        bbox = scope.layer.leafletLayer._wmsVersion >= 1.3 && crs === L.CRS.EPSG4326 ?
            [se.y, nw.x, nw.y, se.x].join(',') :
            [nw.x, se.y, se.x, nw.y].join(',');

        scope.layer.imageURL = scope.layer.url + L.Util.getParamString(
          scope.layer.leafletLayer.wmsParams, 
          scope.layer.url, 
          true) + '&BBOX=' + bbox + '&SRS=' + crs.code; 
    } else {
      scope.layer.imageURL = buildImageURL(scope.layer.url, {
        x: Math.floor(scope.mapState.pixelCenter.x / 256),
        y: Math.floor(scope.mapState.pixelCenter.y / 256),
        z: scope.mapState.zoom,
        s: scope.layer.leafletLayer.options.subdomains[0],
        slug: scope.layer.slug,
        type: scope.layer.type,
        ext: 'png'
        });
      }
      scope.layer.imageStyle = {'background': 'url(' + scope.layer.imageURL + ')'};
    });
  };

  buildImageURL = function (url, data) {
    var changedURL;
    changedURL = L.Util.template(url, data);
    if (data.type === 'ASSET') {
      return changedURL;
    } else if (data.type === 'WMS') {
      // debugger
    }
    changedURL = changedURL + '.png';
    return changedURL;
  };

  return {
    link: link,
    templateUrl: 'templates/layer-chooser.html',
    restrict: 'E'
  }

});