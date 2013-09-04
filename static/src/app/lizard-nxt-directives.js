app.directive('ngHistogram', function(){
  // turns the <histogram/> element into an interactive crossfilter
  // depends on crossfilter.js
  return function($scope, element){
    element[0].focus();
  };
});




app.directive('ngFocus', function(){
  // focus()es on the element you put this directive on
  return function($scope, element){
    element[0].focus();
  };
});

app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.onEnter);
                });
                event.preventDefault();
            }
        });
    };
});