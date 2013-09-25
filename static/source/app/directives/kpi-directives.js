app.directive('kpilayer', function () {
  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      // init vars
      var areas = {};
      var styler = function (feature) {
        var style = {};
        style.fillOpacity = 0.4;
        style.fillColor = '#1a9850';
        style.color = '#1a9850';
        style.weight = 1;
        var kpi_cat = feature.properties[scope.kpi.slct_cat];
        var val_index = kpi_cat.dates.indexOf(scope.kpi.slct_date);
        var test_val = kpi_cat.values[val_index];
        if (test_val === 0) {
          style.fillColor = '#EEE';
          style.color = '#EEE';
        } else if (test_val < scope.kpi.thresholds.warning &&
            test_val > scope.kpi.thresholds.error) {
          style.fillColor = '#F87217';
          style.color = '#F87217';
        } else if (test_val <= scope.kpi.thresholds.error) {
          style.fillColor = '#d73027';
          style.color = '#d73027';
        }
        if (feature.properties.name === scope.kpi.slct_area) {
          style.fillOpacity = 0.8;
          style.weight = 5;
        }
        return style;
      };

      scope.$watch('kpi.kpiData', function () {
        // remove previous layer if available
        if (areas !== undefined) {
          mapCtrl.removeLayer(areas);
        }
        if (scope.kpi.kpiData.features !== undefined) {
          areas = L.geoJson(scope.kpi.kpiData, {
            onEachFeature: function (feature, layer) {
              var array, key, value;
              array = (function () {
                var ref, results;
                ref = feature.properties;
                results = [];
                for (var key in ref) {
                  value = ref[key];
                  results.push("" + key + ": " + value);
                }
                return results;
              })();
              layer.on('click', function (e) {
                scope.onAreaClick(value);
              });
            },
            style: styler
          });
          mapCtrl.addLayer(areas);
        }
      });

      scope.$watch('kpi.kpichanged', function () {
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.warning', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.error', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.clean', function () {
        mapCtrl.removeLayer(areas);
      });
    }
  };
});
