describe('Testing lizard-nxt omnibox directive', function() {
  var scope,
      elem,
      directive,
      compiled,
      html,
      httpBackend,
      template,
      type;
      
  beforeEach(function (){
    //load the module
    module('omnibox', 'templates-main');

    //set our view html.
    html = '<box-content type="graph"></box-content>';
    
    inject(function($compile, $rootScope, $httpBackend, $templateCache) {
      //create a scope (you could just use $rootScope, I suppose)
      scope = $rootScope.$new();

      //get the jqLite or jQuery element
      elem = angular.element(html);

      httpBackend = $httpBackend;
      httpBackend.when("GET", "/static/source/app/templates/empty.html")
        .respond('');
      type = elem.attr('type')
      var templateLocus = '../lizard_nxt/client/static/source/app/templates/' + type + '.html'
      template = $templateCache.get(templateLocus);
      console.log(template)
      $templateCache.put('/static/source/app/templates/empty.html', template);
            
      //compile the element into a function to 
      // process the view.
      compiled = $compile(elem)(scope);
      
      //run the compiled view.
      // compiled(scope)(scope);
      
      //call digest on the scope!
      scope.$digest();
    });
  });

  it('Should retrieve and draw an empty template', function() {
    //set a value (the same one we had in the html)
    // scope.type = 'egg';
    //check to see if it's blank first
    expect(elem.attr('type')).toBe(type);
    
    //click the element.
    // elem[0].click();
    
    // //test to see if it was updated.
    // expect(elem.text()).toBe('bar');
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

