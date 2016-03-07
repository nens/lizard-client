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
  function ChartContainer (content, graph, temporal) {

    var DEFAULT_GREEN = '#16a085';

    this._x = null;

    this._graph = graph;

    this.data = content.data;
    var defaultKeys = {
      x: 'timestamp',
      y: { 'y0': 'min', 'y1': 'max' }
    };
    this.keys = content.keys || defaultKeys;
    this.labels = content.labels || {x: '', y:''};

    this.color = content.color || DEFAULT_GREEN;

    var options = {
      x: {
        scale: 'time',
        orientation: 'bottom'
      },
      y: {
        scale: 'linear',
        orientation: 'left'
      }
    };
    this._xy = this._graph._createXYGraph(
      this.data,
      this.keys,
      this.labels,
      temporal ? options : undefined,
      this._graph._xDomainInfo
    );
    return;
  }

  ChartContainer.prototype.updateXY = function (content) {
    this.data = content.data;
    this._xy = this._graph.rescale(
      this._graph._svg,
      this._graph.dimensions,
      this._xy,
      this.data,
      this.keys,
      null,
      this._graph._xDomainInfo
    );
  };

  return ChartContainer;

}]);
