// app.controller('TimelineCtrl', function ($scope, $q, $resource, $http, CabinetService) {
//   // TIMELINE START
//   // NOTE: refactor timeline stuff in it's own controller, most stuff is local
//   // to timeline scope; only temporalextent should be exposed to master / root
//   // TIMELINE END 
// });

  
//   var getEvents = function (name) {
//     $scope.timeState.timeline.data[name] = [];
// /*    CabinetService.events.get({
//       type: name,
//       start: $scope.timeState.start,
//       end: $scope.timeState.end,
//       extent: $scope.mapState.bounds
//       }, function (response) {
//         $scope.timeState.timeline.data[name] = response.results[0];
//         $scope.timeState.timeline.data[name].count = response.count;
//         $scope.timeState.timeline.data[name].active = true;
//         $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
//       }
//     );*/
//     var url = "";
//     if (name === 'Twitter') {
//       //url = '/static/data/twit.json';
//       url = '/static/data/twit_regen_normalised.geojson';
//     } else if (name === 'Meldingen') {
//       //url = 'static/data/melding.json';
//       url = 'static/data/klachten_purmerend_min_normalised.geojson';
//     } else if (name === 'Gebouwen') {
//       //url = 'static/data/gebouwen.json';
//       url = 'static/data/gebouwen.geojson';
//     }
//     $http.get(url)
//     .success(function (response) {
//       //$scope.timeState.timeline.data[name] = response.results[0];
//       //$scope.timeState.timeline.data[name].count = response.count;
//       $scope.timeState.timeline.data[name] = response;
//       $scope.timeState.timeline.data[name].count = 943;
//       $scope.timeState.timeline.data[name].active = true;
//       $scope.timeState.timeline.changed = Date.now();
//     });
//   };

//   // TIMELINE END 
// });
