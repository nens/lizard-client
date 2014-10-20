"use strict";

describe('Testing LineCtrl', function () {
  var $rootScope,
    $controller,
    UtilService,
    result,
    boxScope,
    lineScope;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    UtilService = $injector.get('UtilService');
    var NxtMap = $injector.get('NxtMap');

    result = [[1, [2, 3, 4]], [2, [3, 4, 5]], [3, [4, 5, 6]]];

    var timeState = {
      start: 1,
      end: 6,
      at: 3
    };

    boxScope = $rootScope.$new();

    boxScope.box = {
      content: undefined,
      type: 'point'
    };

    boxScope.mapState = new NxtMap(angular.element('<div></div>')[0], data_layers, {
      zoomControl: false
    });

    var MockClickFeedbackService = {
      emptyClickLayer: function () {return true; },
      drawLine: function () {return true; }
    };

    $controller('OmniboxCtrl', {$scope: boxScope});
    lineScope = boxScope.$new();
    $controller('LineCtrl', {
      $scope: lineScope,
      ClickFeedbackService: MockClickFeedbackService
    });
  }));

  it('should have an empty line', function () {
    expect(lineScope.box.content).toBeDefined();
  });

});
