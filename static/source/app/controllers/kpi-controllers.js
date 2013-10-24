app.controller("KpiCtrl",
  ["$scope", "$http", function ($scope, $http)  {

  /**
   * Setup scope variables
   *
   */

  $scope.d3kpi = {'dates': {name: 'Date', values: [], units: 'Year'},
                  'kpis': {name: '', values: [], units: ''}};
  /**
   * Load KPI data from server for neighbourhoods and municipalities
   *
   */
  $scope.kpiLoader = function () {
    var wijkdata = '/static/data/wijken_apeldoorn.geojson';
    var gemeentedata = '/static/data/gemeenten_apeldoorn.geojson';
    var events = '/static/data/klachten_purmerend_min.geojson';
    $scope.kpi.areaData = {'wijk': {}, 'gemeente': {}};

    //$http.get(events)
      //.success(function (data) {
        //$scope.kpi.events = data;  
        //console.log($scope.kpi.events);
        //$scope.kpi.panZoom = {
          //lat: 52.5185894148, 
          //lng: 4.9557002060,
          //zoom: 16
        //}
      //});
    
    //NOTE: write a failure function
    $http.get(wijkdata)
        .success(function (data) {
          $scope.kpi.areaData.wijk = data;
        });

    $http.get(gemeentedata)
        .success(function (data) {
          $scope.kpi.areaData.gemeente = data;
          // initialise gemeente as first view
          $scope.kpiFormatter('gemeente');
          //$scope.kpi.panZoom = {
            //lat: 52.2114246,
            //lng: 5.8998043,
            //zoom: 11
          //};
        });
  };

  /**
   * Format KPI data so it can be used in the view
   *
   */
  $scope.kpiFormatter = function (area_level) {

    //reset map
    //KpiService.clean = Date.now();
    $scope.kpi.kpiData = $scope.kpi.areaData[area_level];
    // later als get categories from kpi source
    //$scope.categories = [];
    //NOTE: buttugly crap
    $scope.kpi.dates = $scope.kpi.kpiData.features[0].properties.planrealisatie.dates;
    $scope.kpi.areas = [];
    // get unique areas
    for (var j in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[j];
      if ($scope.kpi.areas.join(" ").indexOf(feature.properties.name) === -1) {
        $scope.kpi.areas.push(feature.properties.name);
      }
    }

    // initialise selected states only the first time
    if ($scope.kpi.slct_cat === undefined) {
      $scope.kpi.slct_cat =  $scope.kpi.categories[0];
      $scope.kpi.slct_area = $scope.kpi.areas[0];
      $scope.kpi.slct_date = $scope.kpi.dates[4];
    }
    if ($scope.area_level !== area_level) {
      //for (var i in $scope.kpi.categories) {
        //console.log($scope.kpi.categories[i]);
        //var category = $scope.kpi.categories[i];
        //$scope.kpi.slct_cat = category;
      //}
      $scope.kpi.slct_area = $scope.kpi.areas[0];
    }
    $scope.area_level = area_level;
  };

  $scope.activate = function (date, area, category) {
    $scope.kpi.slct_cat = category;
    $scope.kpi.slct_area = area;
    $scope.kpi.slct_date = date;
    // doesn't have to be updated when date changes
    $scope.d3formatted(area, category);
    $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
  };

  // prepare data for graph and badge values
  // NOTE: refactor so function below is included
  $scope.d3formatted = function (area, category) {
    $scope.d3kpi.kpis.name = category;
    $scope.badgevalues = {};
    $scope.d3kpi.kpis.values = [];
    $scope.d3kpi.dates.values = $scope.kpi.dates;
    for (var i in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[i];
      // skip this if, just put it in the cat
      if (feature.properties.name === area) {
        $scope.d3kpi.kpis.values = feature.properties[category].values;
        $scope.formatted_data = $scope.format_data($scope.d3kpi);
      }
    }
  };

  //NOTE: refactor so this is included in d3formatted function
  $scope.format_data = function (d3kpi) {
    var formatted_data = [];
    for (var i = 0; i < d3kpi.dates.values.length; i++) {
      var xyobject = {
        date: d3kpi.dates.values[i],
        value: d3kpi.kpis.values[i]
      };
      formatted_data.push(xyobject);
    }
    return formatted_data;
  };

  $scope.labelValue = function (date, area, category) {
    $scope.labelValues = {};
    for (var i in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[i];
      if (feature.properties.name === area) {
        // ugly crap, make nicer data model for this
        $scope.labelValues[category] = feature.properties[category].values;
      }
    }
    var value = $scope.labelValues[category][$scope.kpi.dates.indexOf($scope.kpi.slct_date)];
    return value;
  };

  // Load KPI data
  $scope.kpiLoader();



  //NOTE: watches and event handlers that I intuitively say don't belong here
  $scope.$on('clean', function () {
    $scope.kpi.clean = Date.now();
  });

  $scope.$watch('kpi.slct_area', function () {
    if ($scope.kpi.slct_area !== undefined) {
      $scope.activate($scope.kpi.slct_date, $scope.kpi.slct_area, $scope.kpi.slct_cat);
    }
  });

  $scope.$watch('kpi.slct_date', function () {
    if ($scope.kpi.slct_date !== undefined) {
      $scope.activate($scope.kpi.slct_date, $scope.kpi.slct_area, $scope.kpi.slct_cat);
    }
  });

}]);
