describe('Testing lizard-nxt directive', function() {
  var scope,
      elem,
      directive,
      compiled,
      html,
      httpBackend;
      
  beforeEach(function (){
    //load the module
    module('omnibox', 'templates-main');

    //set our view html.
    html = '<box-content type="egg"></box-content>';
    
    inject(function($compile, $rootScope, $templateCache) {
      //create a scope (you could just use $rootScope, I suppose)
      scope = $rootScope.$new();

      var templateLocus = 'lizard_nxt/client/static/templates/egg.html'
      template = $templateCache.get(templateLocus);
      $templateCache.put('/static/source/app/templates/empty.html', template);

      
      //get the jqLite or jQuery element
      elem = angular.element(html);
      
      //compile the element into a function to 
      // process the view.
      compiled = $compile(elem);
      
      //run the compiled view.
      compiled(scope);
      
      //call digest on the scope!
      scope.$digest();
    });
  });

  it('Should retrieve and draw an empty template', function() {
    //set a value (the same one we had in the html)
    scope.foo = 'bar';
    //check to see if it's blank first
    expect(elem[0].getAttribute('type')).toBe('egg');
    
    //click the element.
    // elem[0].click();
    
    // //test to see if it was updated.
    // expect(elem.text()).toBe('bar');
  });
});