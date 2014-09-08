describe('Testing TemporalVectorService', function () {

  var $scope,
    $rootScope,
    TemporalVectorService,
    MapService,
    tvData,
    tvLayer,
    map,
    result;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    TemporalVectorService = $injector.get('TemporalVectorService');
    MapService = $injector.get('MapService');
    map = MapService.createMap(
      document.querySelector('body').appendChild(document.createElement('div'))
    );
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $scope.timeState = {at: 1230764400000};
    $scope.mapState = {
      layers: {
        flow: {
          active: true
        }
      }
    };
    tvData = {"type": "FeatureCollection", "features": [{"geometry": {"type": "Point", "coordinates": [5.2, 52.5]}, "type": "Feature", "properties": {"id": 1, "code": "67578", "name": "786786", "timeseries": [{"data": [1230764400000, 1230850800000, 1230937200000], "type": "timestamp", "name": "timestamp", "unit": "ms", "quantity": "time"}, {"data": [0.2, 0.1, 0.1], "type": "float", "name": "speed", "unit": "amp\u00e8re", "quantity": "1,1,1,2-tetrachloor-2-fluorethaan"}, {"data": [0.0, 0.6, 0.0], "type": "float", "name": "direction", "unit": "amp\u00e8re", "quantity": "1,1,1,2-tetrachloor-2-fluorethaan"}]}}]};
    tvLayer = TemporalVectorService.createTVLayer($scope, tvData);
  }));

  it('should retrieve the correct timeIndex', function () {

    result = TemporalVectorService.getTimeIndex($scope, tvData);
    expect(result).toBe(0);
  });

  it('should retrieve the correct result when calling mustDrawTVLayer()', function () {

    result = TemporalVectorService.mustDrawTVLayer($scope, tvData);
    expect(result).toBe(true);
  });

  it('should create a layer with correct options when calling createTVLayer()', function () {

    var layer = TemporalVectorService.createTVLayer($scope, tvData);
    expect(layer.options.ext).toBe('d3');
    expect(layer.options.selectorPrefix).toBe('a');
  });


  it('should reset the previousTimeIndex correctly', function () {

    var initValue = 23,
        endValue = 0;

    TemporalVectorService.previousTimeIndex = initValue;
    expect(initValue).toBe(TemporalVectorService.previousTimeIndex);

    TemporalVectorService.resetPreviousTimeIndex();
    expect(endValue).toBe(TemporalVectorService.previousTimeIndex);
  });

});

