/**
 *
 *
 */
angular.module('lizard-nxt')
  .factory('ChartContainer', ['NxtD3', function (NxtD3) {


  function ChartContainer (content, graph, temporal) {
    this._x = null;

    this._graph = graph;

    this.data = content.data;
    this.keys = {
      x: 'timestamp',
      y: { 'y0': 'min', 'y1': 'max' }
    };
    this.labels = content.labels || {x: '', y:''};

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
      this._xDomainInfo
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
      this._xDomainInfo
    );
  };

  return ChartContainer;

}]);
