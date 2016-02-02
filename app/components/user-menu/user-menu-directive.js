/**
 *
 * Shows user-menu and has logout login buttons
 */
angular.module('user-menu')
  .directive('userMenu', function () {

  var link = function () {
    if (window.Lizard) { window.Lizard.startPlugins() }; // jshint ignore:line
  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'user-menu/user-menu.html'
  };
  });
