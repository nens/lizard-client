angular.module('omnibox')
.controller("OmniboxCtrl", ["DataService", "State", "$scope",
  function (DataService, State, $scope) {

    this.data = DataService;
    this.state = State;

    // Store explicit reference to context. To change context, reinstantiate
    // omnibox. This prevents errors when interacting with the map when the map
    // does not exist yet.
    this.context = State.context;

    /**
     * Adds a unique identifier to asset objects for keeping track of angular
     * scopes. Without this, the close-card-dir may remove the wrong asset.
     *
     * @param  {object} asset
     * @return {string}       asset id.
     */
    this.trackAssets = function (asset) {
      return asset.entity_name + '$' + asset.id;
    };

  }

]);
