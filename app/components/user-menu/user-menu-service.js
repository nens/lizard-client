angular.module('user-menu')
.service('UserMenuService', ['State', function (State) {

  var service = {
    isShowingAppsWindow: {
      value: false
    },
    showAppsWindow: function () {
      console.log("[F] showAppsWindow");
      this.isShowingAppsWindow.value = true;
      var appsWindow = document.querySelector('#lizard-apps-container');
      appsWindow.classList.add('hidden');
    },
    hideAppsWindow: function () {
      console.log("[F] hideAppsWindow");
      this.isShowingAppsWindow.value = false;
      var appsWindow = document.querySelector('#lizard-apps-container');
      appsWindow.classList.remove('hidden');
    },
    toggleAppsWindow: function () {
      console.log("[F] toggleAppsWindow");
      if (this.isShowingAppsWindow.value) {
        this.hideAppsWindow();
      } else {
        this.showAppsWindow();
      }
    }
  };

  angular.element(':not(#lizard-apps-button)').click(function (e) {
    if (service.isShowingAppsWindow.value) {
      console.log("isShowingAppsWindow? TRUE");
      service.hideAppsWindow();
      e.stopPropagation();
      e.preventDefault();
    } else {
      console.log("isShowingAppsWindow? FALSE");
    }
  });

  return service;
}]);