'use strict';

angular.module("omnibox", ["templates-main"])
  .directive("omnibox", ["$compile", "$templateCache",
    function ($compile, $templateCache) {

    var getTemplate = function (contentType) {
      if (contentType === undefined) {
        contentType = 'empty';
      }

      var template,
          templateUrl = 'templates/' + contentType + '.html';

      template = $templateCache.get(templateUrl);

      return template;
    };

    var linker = function (scope, element, attrs) {

      var replaceTemplate = function () {
        var template = getTemplate(scope.box.type);
        // we don't want the dynamic template to overwrite the search box.
        // NOTE: the reason for selecting the specific child is jqLite does 
        // not support selectors.
        angular.element(element.children()[1]).html(template);
        $compile(element.contents())(scope);
      };

      scope.$watch('box.type', function () {
        replaceTemplate();
        if (scope.box.type !== 'empty') {
          scope.box.showCards = true;
        } else {
          scope.box.showCards = false;
        }
      });

      replaceTemplate();

    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: 'templates/omnibox-search.html'
    };
  }])
  .directive('streetview', ['$compile', '$timeout', function($compile, $timeout){
    return {
      scope: true,
      link: function(scope, $element, $attrs, $transclude) {

        scope.svWidth = 300;
        scope.svHeight = 150;

        scope.$watch('box.largeCard', function(o,n) {
          console.log('watch', scope.$parent.$parent.box.largeCard);
          if(o===n) { return false; }
          if(scope.$parent.$parent.box.largeCard) {
            scope.svWidth = 500;
            scope.svHeight = 250;
            var omnibox = angular.element(document.querySelector('.card'));
            var height = 0;
            angular.forEach(omnibox.children(), function(value, key) {
              // console.log(value, key);
              height = height + value.clientHeight;
            });
            omnibox[0].style.height = 100 + height + 'px';
            // debugger;
          } else {
            scope.svWidth = 300;
            scope.svHeight = 150;
            var omnibox = angular.element(document.querySelector('.card'));
            var height = 0;
            angular.forEach(omnibox.children(), function(value, key) {
              // console.log(value, key);
              height = height + value.clientHeight;
            });
            omnibox[0].style.height = 30 + height + 'px';
          }
        });

        $timeout(function() {
          scope.svLat = $attrs.lat;
          scope.svLon = $attrs.lon;
        }, 400);
      },
      restrict: 'E',
      template: '<img src="http://maps.googleapis.com/maps/api/streetview?fov=120&pitch=-40&heading=90&size=<% svWidth %>x<% svHeight %>&location=<% svLat %>,<% svLon %>&sensor=false&key=AIzaSyCnhiYnIG6gN6SwiXltQ3vUGrr9WGovfzo" />',
      replace: true
    };
  }]);

