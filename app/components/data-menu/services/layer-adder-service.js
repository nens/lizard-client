/**
 * Service to handle layer-group retrieval.
 */
angular.module('data-menu')
  .service("LayerAdderService", ['$resource', function ($resource) {

      /* Provide a resource for interacting with the layergroups endpoint of
       * the API.
       *
       * Use a reconfigured 'query' so it actually returns an array of items.
       */
      var layers = $resource('/api/v2/layers/:slug/', {}, {
        'query': {
          method:'GET',
          isArray:false
        }
      });

      /**
       * Get layergroups from the API.
       * @param {dict} params - A dictionary of request params (e.g.
       *                        {'page_size': 10}).
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayers = function (params, success, error) {
        layers.query(params, success, error);
      };

      /**
       * Get single layergroup from the API.
       * @param {string} params - slug for layergroup you are looking for.
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayer = function (slug, success, error) {
        layers.get({slug: slug}, success, error);
      };


      /**
       * Gets active layergroups. First creates a stub so layergroups.all does
       * not make the same request and turns layergroups off.
       *
       * Creates stubs for provided newActives, makes request, adds to ds.layer-
       * Groups and toggles layergroup to active.
       *
       * @param  {array}  newActives list of slugs.
       * @param  {DataService} ds.
       */
      this.getNonExistentActiveLayers = function (newActives, ds) {

        var addLayerFromURL = function (layer) {
          // Create the layergroup.
          var newLayerGroup = ds.createLayerGroup(layer);
          // Turn the layergroup on.
          ds.toggleLayerGroup(newLayerGroup);
        };

        // Create a stub lg for every active layegroup. Layergroup.all will
        // ignore these.
        newActives.forEach(function (slug) {
          ds.layers[slug] = {
            stub: true,
            isActive: function () { return true; },
            getOpacity: function () { return 0; },
            layers: [],
            mapLayers: []
          };
        });

        newActives.forEach(function (newLg) {
          // Get active layers from url and toggle them.
          this.fetchLayerGroup(
            newLg, addLayerFromURL, function (e) {
              // this is the error callback, which fails silently.
              console.log('Can\'t find what you\'re looking for: ', e);
          });
        }, this);

      };

      /**
       * Gets layergroups and adds to ds.layers for lg slugs.
       *
       * @param  {array}  newInactives list of slugs.
       * @param  {DataService} ds.
       */
      this.getNonExistentLayers = function (newInactives, ds) {

        var addLayer = function (layer) {
          ds.createLayerGroup(layergroup);
        };

        newInactives.forEach(function (newLg) {
          // Get missing layergroups.
          this.fetchLayerGroup(
            newLg, addLayer, function (e) {
              // this is the error callback, which fails silently.
              console.log('Can\'t find what you\'re looking for: ', e);
          });
        }, this);

      };


      return this;
    }
  ]);
