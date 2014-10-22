

angular.module('lizard-nxt')
  .directive('opacitySlider', function () {
    
  var link = function (scope, element, attrs) {
    var opacity = scope.layergroup.getOpacity();
    scope.percOpacity = opacity * 100;
    
    var localClick;
    var adjustOpacity = function (e) {
      e.preventDefault();
      localClick = e.offsetX;

      console.log(localClick, e);
      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].offsetX;
      }
      var newOpacity = localClick / e.target.clientWidth;
      scope.percOpacity = newOpacity * 100;
      console.log(newOpacity);
      scope.layergroup.setOpacity(newOpacity);

    }

    element.bind('mousedown', adjustOpacity);
/*    var localClick, mouseMove, clickTime;*/

    //var startClick = function (e) {
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
