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
            maxWidth: d.width - 2 * d.padding.left,
            maxHeight: d.height - 2 * d.padding.top
          };
        }

        /**
         * Replace dataset lazyloadsrc with the real src to trigger browser to
         * load image.
         * @param  {DOM element} el img
         */
        var loadImage = function (el) {
          var src = el.dataset.lazyLoadSrc;
          el.src = src;
        };

        var tempChanged;
        var carouselChanged;

        /**
         * Prevents slide carousel from being triggered and sets the right
         * image to active after the first digest renders the whole ng-repeat
         * tree.
         */
        var setImagesToTimeAfterDigest = function () {
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

            $timeout(function () {
              var activeElement = element
                .find('.carousel-inner')
                .children()[i];
              if (activeElement) {
                var activeImg = activeElement.children[0];
                // First shift carousel, then start loading the image. The
                // browser might already have the image, and we should not show
                // two at the same time.
                element.carousel(i);
                loadImage(activeImg);
              }
            }, 0, false);
          }
        };

        scope.slide = function (direction) {
          element.carousel(direction);
        };

        /**
         * On sliding through carousel, set time
         */
        element.on('slide.bs.carousel', function (event) {
          if (tempChanged) {
            tempChanged = false;
          }
          else {
            carouselChanged = true;
            loadImage(event.relatedTarget.children[0]);
            var timestamp = event.relatedTarget.children[0].dataset.timestamp;
            State.temporal.at = Number(timestamp);
          }
        });

        scope.$watch('temporal.at', function (n, o) {
          if (n === o) { return; }
          setImagesToTimeAfterDigest();
        });

        scope.$watchCollection('images', function (images) {
          if (images.length) {
            setImagesToTimeAfterDigest();
          }
        });

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
