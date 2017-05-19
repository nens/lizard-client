
angular.module('omnibox')
  .directive('dbCards', [
    'State',
    'DataService',
    'DragService',
    'gettextCatalog',
    'notie',
    'getNestedAssets',
    'TimeseriesService',
    'DBCardsService',
    function (
      State,
      DataService,
      DragService,
      gettextCatalog,
      notie,
      getNestedAssets,
      TimeseriesService,
      DBCardsService) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (el) {
        // other plottable item. Toggle on drag to put element in their own
        // plot.
        element.find('#' + el.getAttribute('data-uuid')).click();
      };

      scope.$watch('omnibox.data.assets', function () {
        // get rid of dupes with nested assets
        var nestedAssets = [];
        scope.omnibox.data.assets.forEach(function (asset) {
          nestedAssets = nestedAssets
          .concat(getNestedAssets(asset)
            .map(function (nestedAsset) {
              return nestedAsset.entity_name + '$' + nestedAsset.id;
            })
          );
        });

        // set it locally so it doesn't show all the dupes
        scope.localAssets = _.filter(scope.omnibox.data.assets, function (asset) {
          var hasTheSame = nestedAssets.some(function (nesAs) {
            return asset.entity_name + '$' + asset.id === nesAs;
          });
          return !hasTheSame;
        });
      });

      var getTsMetaData = function (uuid) {
        var tsMetaData;
        _.forEach(DataService.assets, function (asset) {
          tsMetaData = _.find(asset.timeseries, function (ts) {
            return ts.uuid === uuid;
          });
          return !tsMetaData;
        });
        return tsMetaData;
      };

      /**
       * Turn ts on and give it the order of the dropped plot. Ts could already
       * be part of a plot above or below it, if so rearrange existing plots.
       * And make sure ts gets the right order.
       *
       * @param  {DOM}    el      Dragged element.
       * @param  {DOM}    target  Plot in drop.
       */
      DragService.on('drop', function (el, target) {
        if (target === null) {
          // Dropping outside of dropzone
          return;
        }
        console.log("*** GoGoGo! *******************************************");
        console.log("*** arg 'el' =", el);
        console.log("*** arg 'target' =", target);

        // Order for el/target: ///////////////////////////////////////////////
        var orderEl = Number(el.getAttribute('data-order'));
        console.log("*** orderEl =", orderEl);
        var orderTarget = Number(target.getAttribute('data-order'));
        console.log("*** orderTarget =", orderTarget);

        var uuidEl = el.getAttribute('data-uuid');

        // Timeseries representend by el/target: //////////////////////////////
        var tsEl = _.find(State.selected.timeseries, function (ts) {
          return ts.uuid === uuidEl;
        });
        var tsTarget = _.find(State.selected.timeseries, function (ts) {
          return ts.order === orderTarget && ts.active;
        });
        console.log("*** tsEl =", tsEl);
        console.log("*** tsTarget =", tsTarget);

        // UUID for el/target ts: /////////////////////////////////////////////
        var uuidTarget = tsTarget.uuid;
        console.log("*** uuidEl =", uuidEl);
        console.log("*** uuidTarget =", uuidTarget);

        if (uuidTarget === uuidEl) {
          // Same graph, just return.
          console.log("[E] uuidEl === uuidTarget; return!");
          return;
        }

        // Reset order since we now have sensible values to be read:
        orderEl = tsEl.order;
        orderTarget = tsTarget.order;
        console.log("*** orderEl (2) =", orderEl);
        console.log("*** orderTarget (2) =", orderTarget);

        var hasDataEl = TimeseriesService.tsHasData(tsEl.uuid);
        var hasDataTarget = TimeseriesService.tsHasData(tsTarget.uuid);

        if (!hasDataEl && !hasDataTarget) {
          return;
        } else {
          if (orderEl < orderTarget) {
            if (!hasDataEl) {
              target.parentNode.removeChild(target);
              el.setAttribute('data-order', orderEl || 0);
              TimeseriesService.syncTime();
              return;
            }
          } else if (orderEl > orderTarget) {
            if (!hasDataTarget) {
              target.parentNode.removeChild(target);
              el.setAttribute('data-order', orderEl || 0);
              TimeseriesService.syncTime();
              return;
            }
          }
        }

        if (tsEl.active) {
          var otherTSInOriginalPlot = _.find(
            State.selected.timeseries,
            function (_ts) {
              return _ts.active
                && _ts.order === orderEl
                && _ts.uuid !== uuidEl;
            }
          );

          console.log("****** otherTSInOriginalPlot =", otherTSInOriginalPlot);

          if (otherTSInOriginalPlot === undefined) {
            // Plot where ts came from is now empty and removed.
            console.log("****** orderTarget (1):", orderTarget);
            orderTarget = orderTarget < orderEl ? orderTarget : orderTarget - 1;
            console.log("****** orderTarget (2):", orderTarget);
          }

          tsEl.active = false; // ??? O RLY?
          DBCardsService.removeItemFromPlot(tsEl);

          var tsMetaData = getTsMetaData(uuidEl);
          var otherGraphTsMetaData = getTsMetaData(uuidTarget);
          if (tsMetaData.value_type !== otherGraphTsMetaData.value_type) {
            notie.alert(2,
              gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
            emulateClick(tsEl);
          } else {
            // Set new order and tell TimeSeriesService to get data.
            tsEl.order = orderTarget || 0; // dashboard could be empty
            tsEl.active = true;
            TimeseriesService.syncTime();
          }
        }
        el.parentNode.removeChild(el);
      });

      scope.$on('$destroy', function () {
        DragService.destroy();
      });
    },
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/db-cards.html'
  };
}]);
