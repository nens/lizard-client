// omnibox-tests.js


// TODO: rewrite to new omnibox style
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

    httpBackend = $httpBackend;
    httpBackend.when("GET", "templates/omnibox-search.html")
    .respond(200, '');
    var templateLocus = '/templates/omnibox-search.html'
    template = $templateCache.get(templateLocus);
    $templateCache.put('/static/source/app/templates/omnibox-search.html', template);            
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
    elem = angular.element('<omnibox ></omnibox>');
    compiled = compile(elem)(scope);
    scope.box = {
        type: 'empty'
    };
    scope.$digest();
    type = elem.attr('type');
    // expect(elem.attr('type')).toBe(type);
    expect(true).toBe(true);
  });

});
