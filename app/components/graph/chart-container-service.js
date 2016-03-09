/**
 *
 *
 */
angular.module('lizard-nxt')
  .factory('ChartContainer', ['NxtD3', function (NxtD3) {


  /**
   * Charts are are small objects that are drawn on the graph canvas
   * They are a way to keep track of all of the lines or that are being drawn.
   *
   * NOTE: this might have to change because the api of graphs is crappy
   *
   * It should be something like this:
   * <graph>
   *  <line data="data" etc.. </line>
   * </graph>
   *
   * For now this is a way to keep track of the scales, domains and xy's of the graph
   */
  function ChartContainer (chartContent, graph, temporal) {

    var DEFAULT_GREEN = '#16a085';

    this._graph = graph;

    var defaultKeys = {
      x: 'timestamp',
      y: { 'y0': 'min', 'y1': 'max' }
    };
    this.keys = chartContent.keys || defaultKeys;
    this.labels = chartContent.labels || {x: '', y:''};

    this.color = chartContent.color || DEFAULT_GREEN;

    this.unit = chartContent.unit;

    var xscale = (temporal) ? 'time' : 'linear';
    this.options = {
      x: {
        scale: xscale,
        orientation: 'bottom'
      },
      y: {
        scale: 'linear',
        orientation: 'left'
      }
    };

    this.updateXY(chartContent);
    return;
  }

  ChartContainer.prototype.updateXY = function (chartContent) {
    this.data = chartContent.data;
    this.y = { maxMin: this._graph._maxMin(this.data, this.keys.y) };
    this.x = { maxMin: this._graph._maxMin(this.data, this.keys.x) };
  };

  return ChartContainer;

}]);
