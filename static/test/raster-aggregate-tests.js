// raster-aggregate-tests.js

describe('Testing raster requests directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend;

  beforeEach(module('lizard-nxt',
    'graph',
    'lizard-nxt.services'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  // copied from templates.js this prevents the directive from doing a GET
  // draws the template from 'cache'
  angular.module("templates/raster-aggregate.html", []).run(["$templateCache", function($templateCache) {
        $templateCache.put("templates/raster-aggregate.html",
          "<div id=\"raster-aggregate\">\n" +
          "    <div ng-switch on=\"box.type\">\n" +
          "        <graph ng-switch-when=\"landuse\" pie data=\"data\"></graph>\n" +
          "        <graph ng-switch-when=\"elevation\" line data=\"data\" title=\"\" xlabel=\"box.content.xLabel\" ylabel=\"box.content.yLabel\"></graph>\n" +
          "    </div>\n" +
          "</div>");
      }]);

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
    $httpBackend.when("GET", "/static/data/klachten_purmerend_min.geojson").respond('');
    $httpBackend.when("GET", "api/v1/rasters/?raster_names=landuse&geom=POLYGON((5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725, 5.570068359375 52.09975692575725))&srs=EPSG:4326&agg=counts").respond('');

    scope.$digest();

    // After the digest the content.agg variable should be set to
    // counts, because of the type: landuse
    expect('counts').toEqual(scope.box.content.agg);
  });

  // it('should look for data based on the layername', function() {
  //   var element = angular.element('<body ng-controller="MasterCtrl"><map></map>'
  //     + '<omnibox></omnibox></body>');
  //   element = $compile(element)($rootScope);
  //   var scope = element.scope();

            

  //   scope.$digest();
  //   scope.keyPressed = 4;
  //   scope.$digest();
  //   expect(scope).toEqual(4);
  // });


  // it('should have a place in the omnibox', function() {
    
  // });

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

    // scope.data = [{"color": "#000000", "data": 256786, "label": 0}, {"color": "#e7e3e7", "data": 5089, "label": 241}, {"color": "#a5ff73", "data": 73, "label": "41 - LGN - Agrarisch Gras"}, {"color": "#0071ff", "data": 39, "label": "21 - Top10 - Water"}, {"color": "#c65d63", "data": 27, "label": "63 - CBS - Woongebied"}, {"color": "#734d00", "data": 17, "label": "46 - LGN - Overige akkerbouw"}, {"color": "#6b696b", "data": 13, "label": "23 - Top10 - Secundaire wegen"}, {"color": "#00714a", "data": 12, "label": "25 - Top10 - Bos/Natuur"}, {"color": "#f7385a", "data": 11, "label": "65 - CBS - Bedrijventerrein"}, {"color": "#ffffff", "data": 77.0, "label": "Overig"}];
    // // scope.data = scope.format_rastercurve(response);
    // console.info(scope.data);
    // scope.$digest();
    // console.info(scope.data);

    /*
    * Not sure how to test this.. the data is not compiled
    * and the graph directive does not seem to be draw a svg..
    */

    expect(scope.data).toEqual(element[0]);
  });


});
