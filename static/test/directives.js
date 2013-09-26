describe('Testing lizard-nxt omnibox directive', function() {
  var scope,
      elem,
      directive,
      compile,
      html,
      httpBackend,
      template, 
      type;
      
  beforeEach(function (){
    //load the module
     module('lizard-nxt', 
      'templates-main');

    
    inject(function($compile, $rootScope, $httpBackend, $templateCache) {
      //create a scope (you could just use $rootScope, I suppose)
      scope = $rootScope.$new();
      compile = $compile;
      //get the jqLite or jQuery element

      httpBackend = $httpBackend;
      httpBackend.when("GET", "/static/source/app/templates/empty.html")
        .respond('');
      var templateLocus = '../lizard_nxt/client/static/source/app/templates/' + type + '.html'
      template = $templateCache.get(templateLocus);
      $templateCache.put('/static/source/app/templates/'+ type + '.html', template);
            
      //compile the element into a function to 
      // process the view.
      
      //run the compiled view.
      // compiled(scope)(scope);
      
      //call digest on the scope!
    });
  });

  it('Should retrieve and draw a template of the type graph', function() {
    //set a value (the same one we had in the html)

    // TODO: OMnibox needs refactoring. Test will follow
    elem = angular.element('<box-content type="graph"></box-content>');
    compiled = compile(elem)(scope);
    scope.$digest();
    type = elem.attr('type');
    expect(elem.attr('type')).toBe(type);
  });


});

describe('Testing leaflet directive', function() {

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  it('should have loaded leaflet library inside the directive', function() {
    var element = angular.element('<map></map>');
    element = $compile(element)($rootScope);
    expect(element.text()).toEqual('Leaflet');
  });

  it('should have no layers', function() {
    var element = angular.element('<map></map>');
    element = $compile(element)($rootScope);
    var map = element.scope().map;
    expect(map._layers).toEqual({});
  });

  it('should be tested thoroughly', function() {
    var element = angular.element('<map></map>');
    element = $compile(element)($rootScope);
    var map = element.scope().map;
    expect(true).toEqual(false);
  });

});


