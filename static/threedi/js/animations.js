/*
Support for animations

Animated layer: keep track of an animated wms.

*/
app.factory('AnimatedLayer', [function(){
    var startedLoading,
      name,
      options,
      current_timestep;
    var current_in_map = {};  // indices if layers that are in OL.map
    var to_delete_from_map = null;
    var readyForNext = null;  // This is the layer that should be shown after stopping simulation
    var startedLoading = Date.now();  // date that the last layer started loading; for timeout construction.
    var current_anim_frame = 0;  //testing

    var max_timesteps = -1;

    var min_time_between_loads = 0; // testing with max update rate

    var layers = {}; // it will automatically be updated by setTimestep when needed
    var layerFromTs = function(timestep, extra_options) {
      // extra_options is a hashmap {option: value, ...}
      // Create layer from given timestep.
      var me = this;
      this.options.time = timestep;

      if ((extra_options !== undefined) && (extra_options !== null)) {
          for (key in extra_options) {
              this.options[key] = extra_options[key];
          }
          // console.log('Ani wms with extras: ', this.options);
      }

      // Normal wms layer with tiles
      // var layer = new L.TileLayer.WMS( 
      //     this.url, 
      //     this.options);

      // testing with single tile layer
      var layer = new L.tileLayer.wmsIncrementalSingleTile(
          this.url, this.options);

      layer.on('loading', function(e) {
          console.log('start loading layer ', this.options.time);
          me.most_recent_loading = timestep;
          //this.time_start_loading = Date.now();
      });

      layer.on('load', function(e) {
          console.log('finished loading layer ', this.options.time);
          if (this.options.time !== me.most_recent_loading) {
              if (debug){
                  console.log(
                    'this ('+this.options.time+
                    ') != most recent loading ('+me.most_recent_loading+
                    ')-> do nothing');
              }
              return;
          }
          this.setOpacity(0.8);
          var this_layer = this;

          // console.log(me.current_in_map);

          // remove existing layers which are currently on the map
          for (var ts in me.current_in_map) {
              // Remove layers other than this one. (can be different than me.current_timestep)
              // Not sure, but to prevent (temporary) vanishing layers
              // while zooming/panning we keep both parameters
              // this.options.time and me.current_timestep.
              // It is however possible that an extra layer is visible that should not be there.
              layer = me.current_in_map[ts];
              //console.log(layer);
              // console.log(
              //   'Layer ts='+ts+
              //   ' time='+this.options.time+
              //   ' curr_timestep='+current_timestep);
              //if ((parseInt(ts) !== parseInt(this.options.time)) &&
              //    (parseInt(ts) !== parseInt(current_timestep)) )  // not sure...
              if (parseInt(ts) !== parseInt(this.options.time))
              {
                  // console.log(
                  //   'Remove layer ts='+ts+
                  //   ' time='+this.options.time+
                  //   ' curr_timestep='+current_timestep);
                  this.map.removeLayer(layer);
                  delete me.current_in_map[ts];
              }
              // raise marker above anything, not necessary?
              // TODO L
              //map.raiseLayer(markers, map.layers.length);
          }


          var nextTimestep = me.readyForNext;

          setTimeout(function() {
              me.readyForNext = null;
              if ((nextTimestep !== null) && (parseInt(nextTimestep) !== parseInt(me.options.time))) {
                  if (debug){
                      console.log('nextTimestep: ', nextTimestep);
                  }
                  me.setTimestep(parseInt(nextTimestep));
              }
          }, 50);
          if (debug) {
              delta_time = Date.now() - me.startedLoading;
              fps = Math.round((1000 / delta_time) * 10) / 10;
              console.log("Frame took " + delta_time + " ms; " + fps + " fps");
          }
          me.last_loaded_layer_dt = Date.now();
      });

      return layer;
    };

    var setTimestep = function(timestep, extra_options) {

        // 5 seconds timeout
        var now = Date.now();
        if ((this.readyForNext !== null) && (now < this.startedLoading + 5000)) {
            console.log('not ready for next timestep... still busy ', timestep);
            // is the first next thing
            // Can be overwritten, which is ok.
            this.readyForNext = timestep;
            return;
        }
        if (now < this.startedLoading + this.min_time_between_loads) {
            // The client is too fast, park timestep for later.
            console.log('Client too fast.. wait', (now - (this.startedLoading + this.min_time_between_loads)));
            return;
        }
        //if (debug){ console.log('set timestep ' + timestep);
        this.current_timestep = timestep;
        if (debug){
            console.log('in setTimestep: ', timestep);
        }
        if (timestep < 0) { return; }

        var ts = timestep;
        //if (debug){ console.log('we want timestep ', ts);

        if (this.current_in_map[ts] === undefined) {
            // new layer
            if (debug){
                console.log('adding to map ', ts);
            }
            this.startedLoading = Date.now();
            //console.log(this.options);
            var new_layer = this.layerFromTs(ts, extra_options);
            this.map.addLayer(new_layer);
            this.current_in_map[ts] = new_layer;
            this.readyForNext = ts;
        }
        //if (debug){ console.log('current_in_map', this.current_in_map);

    };

    var animated_layer = function(options){
    name = options.name;
    url = options.url;
    map_object = options.map;
    options = options.options;
    console.log('created animated layer');
    console.log(options.map);
    console.log(options);
    current_timestep = 0;  // to be altered from outside
    return { 
      options: options,
      name: name,
      url: url,
      map: map_object,
      layerFromTs: layerFromTs,
      setTimestep: setTimestep,
      startedLoading: startedLoading,
      current_in_map: current_in_map,
      to_delete_from_map: to_delete_from_map,
      readyForNext: readyForNext,
      max_timesteps: max_timesteps,
      min_time_between_loads: min_time_between_loads,
      layers: layers,
      layerName: function(timestep) {
          return name + ' (' + timestep + ')';
      },    
      updateMap: function() {
          // update visible layer
          // add/remove layers
          if (debug){
              console.log('updating map');
          }
      },
      shutdown: function() {
          // make sure to remove all objects that are in memory/OL
          if (debug){
              console.log('ani layer shutting down...');
          }
          for (ts in this.current_in_map) {
              if (debug){
                  console.log('removing layer ', this.current_in_map[ts].options.time);
              }
              this.map.removeLayer(this.current_in_map[ts]);
          }
          this.current_in_map = {};
          this.current_visible = null;
        }
    }
    };
    /* Initialize animation object. We must provide model_slug to correctly
     calculate the complete wms url.*/
    var animation_init = function(map_object, model_slug, url) {
      console.log('initialize new model wms ani');
      if (model_slug === undefined) {
          if (debug){
              console.log('no animation to be initialized');
          }
          return;
      }
      
      /*
      http://localhost:5000/wms?request=getinfo&dataset=/home/user/git/nens/threedi-server/threedi_server/../var/data/subgrid_map.nc&srs=epsg:3857 */

      var options = {
          layers: model_slug + ':depth',
          format: 'image/png',
          transparent: true,
          nocache: 'yes',
          fadeAnimation: false,
          //detectRetina: true,
          opacity: 0.0};

      var ani_layer = animated_layer({
          name: name,
          url: url,
          options: options,
          map: map_object
      });

      return ani_layer
    };

    return {
      animation_init: animation_init,

    }
}]);
