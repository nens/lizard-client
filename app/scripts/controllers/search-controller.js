angular.module('lizard-nxt')
  .controller('SearchCtrl', function ($scope, $timeout, CabinetService, ClickFeedbackService) {
  /**
   * Refactor and design this cruft
   */

  var KeyCodes = {
    BACKSPACE : 8,
    TABKEY : 9,
    RETURNKEY : 13,
    ESCAPE : 27,
    SPACEBAR : 32,
    LEFTARROW : 37,
    UPARROW : 38,
    RIGHTARROW : 39,
    DOWNARROW : 40,
  };

  var boxTypeBeforeSearching = $scope.box.type;

  $scope.onKeydown = function (item, $event) {
    var e = $event;
    var $target = $(e.target);
    var nextTab;
    switch (e.keyCode) {
    case KeyCodes.BACKSPACE:
      angular.element('#searchboxinput')[0].focus();
      break;
    case KeyCodes.ESCAPE:
      $target.blur();
      break;
    case KeyCodes.UPARROW:
      nextTab = - 1;
      break;
    case KeyCodes.RETURNKEY:
      //$scope.box.type = 'area'; // Hides the results
      e.preventDefault();
      break;
    case KeyCodes.DOWNARROW:
      nextTab = 1;
      break;
    }
    if (nextTab !== undefined) {
      // do this outside the current $digest cycle
      // focus the next element by tabindex
      $timeout(function () {
        var el = $('[tabindex=' + (parseInt($target.attr("tabindex"), 10) + nextTab) + ']').focus();
      }, 30);
    }
  };
  $scope.onFocus = function (item, $event) {
    $scope.showDetails(item);
  };

  $scope.searchMarkers = [];
  $scope.search = function ($event) {
    console.log('[F] search');
    if ($scope.box.query.length > 1) {

      CabinetService.geocode.get({q: $scope.box.query}).then(function (data) {
        console.log('received response from CabSvc.geocode; data =', data);
        $scope.box.type = "location";
        $scope.box.content = data;
        angular.element('#searchboxinput')[0].focus();
        //console.log('---- $scope.box =', $scope.box);
      });
      // $scope.box.type = "location";
    }
  };

  $scope.bbox_update = function (bl_lat, bl_lon, tr_lat, tr_lon) {
    $scope.searchMarkers.filter(function (v, i, a) {
      return a.indexOf(v) === i;
    });
    var search = CabinetService.bboxSearch.query({
      bottom_left: bl_lat + ',' + bl_lon,
      top_right: tr_lat + ',' + tr_lon
    }, function (data) {
      $scope.searchMarkers = [];
      for (var i in data) {
        if (data[i].geometry) {
          $scope.searchMarkers.push(data[i]);
        }
      }
    });
  };

  $scope.showDetails = function (obj) {
    if (obj.boundingbox) {
      var southWest = new L.LatLng(obj.boundingbox[0], obj.boundingbox[2]);
      var northEast = new L.LatLng(obj.boundingbox[1], obj.boundingbox[3]);
      var bounds = new L.LatLngBounds(southWest, northEast);
      $scope.mapState.fitBounds(bounds);

      $scope.box.type = $scope.tools.active;
      delete $scope.box.content;

    } else {
      if (window.JS_DEBUG) {
        console.error('Oops, no boundingbox on this result - TODO: show a proper message instead of this console error...');
      }
    }
  };

  // Note: Watch is called too often
  $scope.$watch('keyIsPressed', function (newVal, oldVal) {
    if (newVal !== oldVal && $scope.keyTarget.id === "searchboxinput"
      && $scope.keyPressed === 13) {
      $scope.search();
    }
  });
});
