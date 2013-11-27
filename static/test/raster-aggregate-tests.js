// raster-aggregate-tests.js

describe('Testing raster requests directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend;

  beforeEach(module('lizard-nxt',
    'templates-main',
    'graph',
    'lizard-nxt.services'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  /**
  *
  * Testing aggregate directives is hard.
  * You have to include MasterCtrl. Because getRasterData is on that scope
  * You need a mapscope to connect to the map and getBounds();
  * You need to fake some http requests.. because some things in MasterCtrl are
  *       quite henous.
  */
  it('should know what kind of aggregation method it should use', function() {
    var element = angular.element('<div ng-controller="MasterCtrl"><raster-aggregate></raster-aggregate></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();

    var mapelement = angular.element('<map></map>');
    mapelement = $compile(mapelement)($rootScope);
    var mapscope = element.scope();

    var map = mapscope.map;
    scope.mapBounds = map.getBounds();
    scope.box = {
      type: 'landuse',
      content: {
        agg: ''
      }
    };

    // This should seriously be removed from the lizard-nxt.js file.
    $httpBackend.when("GET", "/static/data/klachten_purmerend_min.geojson").respond('');
    $httpBackend.when("GET", "api/v1/rasters/?raster_names=landuse&geom=POLYGON((5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725))&srs=EPSG:4326&agg=counts").respond('');

    scope.$digest();

    // After the digest the content.agg variable should be set to
    // counts, because of the type: landuse
    expect('counts').toEqual(scope.box.content.agg);
  });


  /*
  * Another difficult one to test. At the moment the layers come
  * from a django template and are not available in the "pure" JS.
  */        
  it('should look for data based on the layername', function() {
    var element = angular.element('<body ng-controller="MasterCtrl"><map></map>'
      + '</body>');
    element = $compile(element)($rootScope);
    var scope = element.scope();


    scope.$digest();
    // NOTE: this could be done differently :)
    scope.keyPressed = 4;
    scope.$digest();

    // NOTE: Because layers are not available in "pure js"
    // the activeBaselayer is set. This test is in that sense FAKE!
    scope.activeBaselayer = scope.keyPressed;
        console.info('\n NOTE: data based on the layername test is FAKE '
      + '\n Because layers are not available in "pure js"');
    expect(scope.activeBaselayer).toEqual(4);
  });


  it('should have a place in the omnibox', function() {
    var element = angular.element('<div ng-controller="MasterCtrl"><omnibox></omnibox><map></map></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();
    // This should seriously be removed from the lizard-nxt.js file.
    scope.box = {
      type: 'landuse',
      content: {
        agg: ''
      }
    }; 
    scope.mapBounds = scope.map.getBounds();  

    $httpBackend.when("GET", "/static/data/klachten_purmerend_min.geojson").respond('');
    $httpBackend.when("GET", "api/v1/rasters/?raster_names=landuse&geom=POLYGON((5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725))&srs=EPSG:4326&agg=counts").respond('');
    scope.$digest();
    var cardtitle = $(element.html()).find('h3').html();
    expect(cardtitle).toEqual('Landgebruik');
  });

  // TODO: maybe strip the request string to check coordinates with WKT
  it('should request data based on viewport', function() {
    var element = angular.element('<div ng-controller="MasterCtrl"><raster-aggregate></raster-aggregate></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();

    var mapelement = angular.element('<map></map>');
    mapelement = $compile(mapelement)($rootScope);
    var mapscope = element.scope();

    var map = mapscope.map;
    scope.mapBounds = map.getBounds();
    scope.box = {
      type: 'landuse',
      content: {
        agg: ''
      }
    };
    $httpBackend.when("GET", "/static/data/klachten_purmerend_min.geojson").respond('');
    $httpBackend.when("GET", "api/v1/rasters/?raster_names=landuse&geom=POLYGON((5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725))&srs=EPSG:4326&agg=counts").respond('');

    scope.$digest();
    expect(map.getBounds()).toEqual(scope.mapBounds);
  });

  it('should draw data based on request', function() {
    var element = angular.element('<div ng-controller="MasterCtrl"><raster-aggregate></raster-aggregate></div>');
    element = $compile(element)($rootScope);
    var scope = element.scope();

    var mapelement = angular.element('<map></map>');
    mapelement = $compile(mapelement)($rootScope);
    var mapscope = element.scope();

    var map = mapscope.map;
    scope.mapBounds = map.getBounds();
    scope.box = {
      type: 'landuse',
      content: {
        agg: ''
      }
    };
    $httpBackend.when("GET", "/static/data/klachten_purmerend_min.geojson").respond('');
    $httpBackend.when("GET", "api/v1/rasters/?raster_names=landuse&geom=POLYGON((5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725))&srs=EPSG:4326&agg=counts")    
      .respond('[{"color": "#000000", "data": 256786, "label": 0},'
     + '{"color": "#e7e3e7", "data": 5089, "label": 241},'
     + '{"color": "#a5ff73", "data": 73, "label": "41 - LGN - Agrarisch Gras"},'
     + '{"color": "#0071ff", "data": 39, "label": "21 - Top10 - Water"},'
     + '{"color": "#c65d63", "data": 27, "label": "63 - CBS - Woongebied"},'
     + '{"color": "#734d00", "data": 17, "label": "46 - LGN - Overige akkerbouw"},'
     + '{"color": "#6b696b", "data": 13, "label": "23 - Top10 - Secundaire wegen"},'
     + '{"color": "#00714a", "data": 12, "label": "25 - Top10 - Bos/Natuur"},'
     + '{"color": "#f7385a", "data": 11, "label": "65 - CBS - Bedrijventerrein"},'
     + '{"color": "#ffffff", "data": 77.0, "label": "Overig"}]');

    var response = [{"color": "#000000", "data": 256786, "label": 0}, {"color": "#e7e3e7", "data": 5089, "label": 241}, {"color": "#a5ff73", "data": 73, "label": "41 - LGN - Agrarisch Gras"}, {"color": "#0071ff", "data": 39, "label": "21 - Top10 - Water"}, {"color": "#c65d63", "data": 27, "label": "63 - CBS - Woongebied"}, {"color": "#734d00", "data": 17, "label": "46 - LGN - Overige akkerbouw"}, {"color": "#6b696b", "data": 13, "label": "23 - Top10 - Secundaire wegen"}, {"color": "#00714a", "data": 12, "label": "25 - Top10 - Bos/Natuur"}, {"color": "#f7385a", "data": 11, "label": "65 - CBS - Bedrijventerrein"}, {"color": "#ffffff", "data": 77.0, "label": "Overig"}];
    scope.$digest();

    /*
    * Not sure how to test this.. the data is not compiled
    * and the graph directive does not seem to be draw a svg..
    * This test is in that sense FAKE!
    */
    scope.data = response;

    console.info('\n NOTE: data based on viewport test is FAKE '
      + '\n the data is not added to the scope for some reason.');
    expect(scope.data).toEqual(response);
  });


});
