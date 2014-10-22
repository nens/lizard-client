

angular.module('lizard-nxt')
  .directive('OpacitySlider', function () {
    
  var link = function (scope, element, attrs) {
/*    var localClick, mouseMove, clickTime;*/

    //var startClick = function (e) {
      //e.preventDefault();
      //localClick = e.clientX;
      //clickTime = e.timeStamp;
      //if (localClick === undefined) {
        //localClick = e.originalEvent.changedTouches[0].clientX;
      //}
      //mouseMove = false;
    //};

    //var onMove = function (e) {
      //console.log(e.timeStamp - clickTime, localClick, clickTime)
      //if (localClick && (e.timeStamp - clickTime > 150)) {
        //mouseMove = true;
      //}
    //};

    //var thismuch;

    //var endClick = function (e) {
        //var releaseX = (e.clientX) ? e.clientX : e.originalEvent.changedTouches[0].clientX;
        //thismuch = releaseX - localClick;
        //var ratio = ((thismuch / 100) + 1) / 2;
        //var newOpacity;
        //if (ratio > 1) {
          //newOpacity = 1;
        //} else if (ratio < 0.1) {
          //newOpacity = 0.1;
        //} else {
          //newOpacity = ratio;
        //}
        //console.log('this is now active:', scope.layergroup._active, scope.layergroup.slug);
        //if (scope.layergroup._active) {
        //console.log(newOpacity);
          //scope.layergroup.setOpacity(newOpacity);
        //}
        //localClick = null;
        //clickTime = null;
        
    //};

//[>    element.bind('mousedown', startClick);<]
    ////element.bind('mousemove', onMove);
    ////element.bind('mouseup', endClick);

    //element.bind('touchstart', startClick);
    //element.bind('touchmove', onMove);
    /*element.bind('touchend', endClick);*/
  };

  return {
    link: link,
    templateUrl: 'templates/opacity.html',
    restrict: 'E'
  }
});
