'use strict';
/**
 * Timeseries directive.
 */
angular.module('image-carousel')
  .directive('imageCarousel', ['State', 'UtilService','$timeout',
    function (State, UtilService, $timeout) {
  return {
      link: function (scope, element) {

        if (scope.context === 'map') {
          scope.dimensions = {
            maxWidth: '370px',
            maxHeight: '400px'
          };
        }
        else if (scope.context === 'dashboard') {
          var d = scope.graphDims;
          scope.dimensions = {
            maxWidth: d.widht - 2 * d.padding.left,
            maxHeight: d.height - 2 * d.padding.top
          };
        }

        var loadImage = function (el) {
          var src = el.dataset.lazyLoadSrc;
          el.src = src;
        };

        var tempChanged;
        var carouselChanged;

        element.on('slide.bs.carousel', function (event) {

          loadImage(event.relatedTarget.children[0]);

          if (tempChanged) {
            tempChanged = false;
          }
          else {
            carouselChanged = true;
            scope.$apply(function () {
              var timestamp = event.relatedTarget.children[0].dataset.timestamp;
              State.temporal.at = Number(timestamp);
            });
          }
        });

        scope.$watch('temporal.at', function () {
          if (carouselChanged) {
            carouselChanged = false;
          }
          else {
            tempChanged = true;
            var i = UtilService.bisect(
              scope.images,
              'timestamp',
              scope.temporal.at
            );
            element.carousel(i);
          }
        });

        $timeout(function () {
          element.carousel(
            UtilService.bisect(scope.images, 'timestamp', scope.temporal.at));
        }, 0);

      },
      restrict: 'E',
      scope: {
        context: '@', // bind to string attribute
        height: '=',
        temporal: '=',
        images: '=', // timeseries like images: {
                     //   url: <string>,
                     //   timestamp: <epoch>
                     // },
        graphDims: '=dimensions'
      },
      templateUrl: 'image-carousel/image-carousel.html',
      replace: true
    };
}]);
