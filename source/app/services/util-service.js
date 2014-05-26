/**
 * Generic utilities
 */
app.service("UtilService", function () {

  /**
   * Round javascript timestamp to nearest coefficient.
   *
   * For example, if you want to round timestamp to the nearest 5 minutes,
   * coefficient = 1000 * 60 * 5 = 30000
   *
   * @param {integer} timestamp - javascript timestamp in ms.
   * @param {integer} coefficient - coefficient to round to in ms.
   * @param {boolean} tzOffset - true if you want to correct for timezone
   * offset.
   * @returns {integer} roundedTimestamp - timestamp rounded to nearest
   * coefficient.
   */
  this.roundTimestamp = function (timestamp, coefficient, tzOffset) {
    var roundedTimestamp = parseInt((timestamp + (coefficient / 2)) /
                                    coefficient) * coefficient;

    if (tzOffset === true) {
      var timeZoneOffset = (new Date(roundedTimestamp)).getTimezoneOffset() *
        1000 * 60;
      roundedTimestamp = roundedTimestamp - timeZoneOffset;
    }

    return roundedTimestamp;
  };

  this.getZoomlevelLabel = function(zoomlevel) {
      var zoomLevel = zoomlevel;
      switch (true) {
        case (zoomLevel>=18):
          console.log('Objectniveau'); // fa-building
          return 'object';
          break;
        case (zoomLevel>=17):
          console.log('Straatniveau'); // fa-road
          return 'street';
          break;
        case (zoomLevel>=15):
          console.log('Gemeenteniveau'); // fa-university
          return 'municipal';
          break;
        case (zoomLevel>=10):
          console.log('Provincieniveau'); // fa-university
          return 'provincial';
          break;
        case (zoomLevel>=8):
          console.log('Landniveau'); // fa-university
          return 'country';
          break;        
        case (zoomLevel>=5):
          console.log('Continentniveau'); // fa-globe
          return 'continental';
          break;              
        case (zoomLevel>=2):
          console.log('Wereldniveau'); // fa-globe
          return 'global';
          break;
      }
      var attrib = $('.leaflet-control-attribution');
      attrib.html(zoomLevel);
  }

});
