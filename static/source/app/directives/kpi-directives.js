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
        if (test_val < scope.kpi.thresholds.warning &&
            test_val >= scope.kpi.thresholds.error) {
          style.fillColor = '#F87217';
          style.color = '#F87217';
        } else if (test_val < scope.kpi.thresholds.error) {
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
              layer.on('click', function(e){
                scope.onAreaClick(value);
              });
            },
            style: styler
          });
          mapCtrl.addLayer(areas);
        }
      });

      scope.$watch('kpi.kpichanged', function () {
        // set style
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
    }
  };
});


app.directive('kpipanel', function () {
  return {
    restrict: 'E',
    controller: function ($scope) {
      $scope.activate = function (date, area, category) {
        $scope.kpi.slct_cat = category;
        $scope.kpi.slct_area = area;
        $scope.kpi.slct_date = date;
        // doesn't have to be updated when date changes
        $scope.d3formatted(area, category);
        // flip the changed var
        $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
      };
    },
    template: "<div class='row'>" +
              "<button type='button' class='btn' " +
              "ng-class='{active: category == slct_cat}'" +
              "ng-repeat='category in categories'" +
              "ng-click='activate(slct_date, slct_area, category)'>{{category}}" +
              "</button>" +
              "<br />" +
              "<button type='button' class='btn' " +
              "ng-class='{active: area == slct_area}'" +
              "ng-repeat='area in areas'" +
              "ng-click='activate(slct_date, area, slct_cat)'>{{area}}" +
              "</button>" +
              "<br />" +
              "<button type='button' class='btn' " +
              "ng-class='{active: date == slct_date}'" +
              "ng-repeat='date in dates'" +
              "ng-click='activate(date, slct_area, slct_cat)'>{{date}}" +
              "</button>" +
              "<br/>" +
              "<br/>" +
              "<div class='well'>" +
              "<h4>Matig: {{thresholds.warning}} </h4>" +
              "<input type='range' ng-model='thresholds.warning' min='1' max='10'/>" +
              "<h4>Slecht: {{thresholds.error}} </h4>" +
              "<input type='range' ng-model='thresholds.error' min='1' max='10'/>" +
              "</div>" +
              "</div>"

  };
});