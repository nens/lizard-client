/**
 *
 *
 */
angular.module('lizard-nxt')
  .factory('ChartContainer', ['NxtD3', function (NxtD3) {

  var DEFAULT_GREEN = '#16a085';

  var defaultKeys = {
    x: 'timestamp',
    y: { 'y0': 'min', 'y1': 'max' }
  };

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
  function ChartContainer (chartContent) {

    this.id = chartContent.id;
    this.keys = chartContent.keys || defaultKeys;
    this.color = chartContent.color || DEFAULT_GREEN;
    this.unit = chartContent.unit;
    this.thresholds = chartContent.thresholds;
    this.location = chartContent.location;
    this.labels = chartContent.labels;
    this.setContentUpdateY(chartContent);

    return;
  }

  ChartContainer.prototype.setContentUpdateY = function (chartContent) {
    this.data = chartContent.data;
    this.keys = chartContent.keys || defaultKeys;
    this.color = chartContent.color || DEFAULT_GREEN;
    this.yMaxMin = NxtD3.prototype._maxMin(this.data, this.keys.y);
  };

  return ChartContainer;

}]);
