'use strict';

/**
 * Lizard-nxt filters
 *
 * Overview
 * ========
 *
 * Defines custom filters
 *
 */

angular.module('lizard-nxt-filters', []);

/**
 * Filter to order objects instead of angulars orderBy
 * that only orders array
 */
angular.module('lizard-nxt-filters')
  .filter('orderObjectBy', function () {
  return function (items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function (item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if (reverse) { filtered.reverse(); }
    return filtered;
  };
});

/**
 * Filter to capitalize first letter of string.
 */
angular.module('lizard-nxt-filters')
  .filter('capitalize', function () {
  return function (string) {
    return _.capitalize(string);
  };
});

/**
 * Returns a rounded number or a '...' based on input type.
 *
 * @param {string} input to round or convert to dash, can be string or number
 * @param {number} optional decimals to round the number to
 * @return {string} when input is a number: returns a number
 * rounded to specified decimals else returns '-'
 */
angular.module('lizard-nxt-filters')
  .filter('niceNumberOrEllipsis', function () {
  return function (input, decimals) {
    var out;
    if (typeof(input) === 'number') {
      var factor = 1;
      if (decimals) {
        factor = Math.pow(10, decimals);
      }
      out = Math.round(input * factor) / factor;
    } else {
      out = '...';
    }
    return out;
  };
});

// lookups: manhole

angular.module('lizard-nxt-filters')
  .filter('lookupManholeShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'vierkant';
      break;
    case '1.0':
      out = 'rond';
      break;
    case '2.0':
      out = 'rechthoekig';
      break;
    case '00':
      out = 'vierkant';
      break;
    case '01':
      out = 'rond';
      break;
    case '02':
      out = 'rechthoekig';
      break;
    default:
      out = 'Afwijkende vorm';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('lookupManholeMaterial', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'beton';
      break;
    case '1.0':
      out = 'PVC';
      break;
    case '2.0':
      out = 'gres';
      break;
    case '00':
      out = 'beton';
      break;
    case '01':
      out = 'PVC';
      break;
    case '02':
      out = 'gres';
      break;
    default:
      out = 'Materiaal afwijkend';
    }
    return out;
  };
});

// lookups: culvert

angular.module('lizard-nxt-filters')
  .filter('lookupCulvertShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0':
      out = 'rond';
      break;
    case '1':
      out = 'eivorm';
      break;
    case '2':
      out = 'rechthoek';
      break;
    case '3':
      out = 'muilvorm';
      break;
    case '4':
      out = 'vierkant';
      break;
    case '5':
      out = 'heul';
      break;
    case '6':
      out = 'trapezium';
      break;
    case '98':
      out = 'Vorm afwijkend';
      break;
    case '99':
      out = 'Vorm onbekend';
      break;
    default:
      out = 'Vorm afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('lookupCulvertMaterial', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0':
      out = 'beton';
      break;
    case '1':
      out = 'PVC';
      break;
    case '2':
      out = 'gres';
      break;
    default:
      out = 'Materiaal afwijkend';
    }
    return out;
  };
});

// lookups: weir

angular.module('lizard-nxt-filters')
  .filter('lookupWeirControl', function () {
  return function (input) {
    var out;
    switch (input) {
    case '1':
      out = 'Vast';
      break;
    case '2':
      out = 'Regelbaar, niet auto';
      break;
    case '3':
      out = 'Regelbaar, auto';
      break;
    case '4':
      out = 'Handmatig';
      break;
    case '98':
      out = 'Overig';
      break;
    default:
      out = 'Niet bekend';
    }
    return out;
  };
});


// lookups: levee

angular.module('lizard-nxt-filters')
  .filter('lookupLeveeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case 1:
      out = 'Primair';
      break;
    case 2:
      out = 'Regionaal';
      break;
    case 3:
      out = 'c-type';
      break;
    default:
      out = 'Afwijkend type';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('lookupLeveeReferencePointType', function () {
  return function (input) {
    var out;
    switch (input) {
    case 1:
      out = 'Dijkpaal';
      break;
    case 2:
      out = 'Virtueel';
      break;
    default:
      out = 'Afwijkend type';
    }
    return out;
  };
});


angular.module('lizard-nxt-filters')
  .filter('allowedFlowDirection', function () {
  return function (input) {
    var out;
    if (input !== null && input !== undefined) {
      out = input;
    } else {
      out = '...';
    }
    return out;
  };
});


angular.module('lizard-nxt-filters')
  .filter('lookupPumpStationType', function () {
  return function (input) {
      switch (input) {
      case 'HOUSEHOLD':
        return 'Drukgemaal';
      case 'SEWER':
        return 'Rioolgemaal';
      case 'TRANSPORT':
        return 'Transportgemaal';
      case 'UNDER':
        return 'Onderbemaling';
      case 'POLDER':
        return 'Poldergemaal';
      case 'BOSOM':
        return 'Boezemgemaal';
      case 'OTHER':
        return 'Gemaaltype afwijkend';
      default:
        return 'Gemaaltype onbekend';
      }
    };
});

angular.module('lizard-nxt-filters')
  .filter('lookupPipeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case '00':
      out = 'Gemengde leiding';
      break;
    case '01':
      out = 'Regenwaterleiding';
      break;
    case '02':
      out = 'Vuilwaterleiding';
      break;
    case '03':
      out = 'Transportleiding';
      break;
    case '04':
      out = 'Overstortleiding';
      break;
    case '05':
      out = 'Zinker';
      break;
    case '06':
      out = 'Bergingsleiding';
      break;
    case '07':
      out = 'Berg-/Bezinkleiding';
      break;
    default:
      out = 'Leidingtype afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('lookupPipeShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'rond';
      break;
    case '1.0':
      out = 'eivorm';
      break;
    case '2.0':
      out = 'rechthoek';
      break;
    case '4.0':
      out = 'vierkant';
      break;
    case '00':
      out = 'rond';
      break;
    case '01':
      out = 'eivorm';
      break;
    case '02':
      out = 'rechthoek';
      break;
    case '04':
      out = 'vierkant';
      break;
    default:
      out = 'Vorm afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('lookupPressurePipeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case '1':
      out = 'Drukriolering';
      break;
    case '2':
      out = 'Persleiding';
      break;
    case '3':
      out = 'Pers-/transportleiding';
      break;
    default:
      out = 'Persleidingtype afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('pipeMaterialOrEllipsis', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'beton';
      break;
    case '1.0':
      out = 'PVC';
      break;
    case '2.0':
      out = 'gres';
      break;
    case '00':
      out = 'beton';
      break;
    case '01':
      out = 'PVC';
      break;
    case '02':
      out = 'gres';
      break;
    default:
      out = 'Materiaal afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt-filters')
  .filter('aggWinToYLabel', ['gettext', function (gettext) {
  return function (input) {
    var out;
    switch (input) {
    case 300000:
      out = gettext('mm / 5 min');
      break;
    case 3600000:
      out = gettext('mm / hour');
      break;
    case 86400000:
      out = gettext('mm / day');
      break;
    case 2635200000:
      out = gettext('mm / month');
      break;
    default:
      out = '...';
    }
    return out;
  };
}]);

/**
 * Truncates a string to have no more than maxLength characters.
 * Used in the righthand menu for truncating lengthy layer names.
 *
 * @param {integer} maxLength - Length at which string gets truncated.
 * @return {string} The truncated layer name
 */
angular.module('lizard-nxt-filters')
  .filter('truncate', function () {

  return function (input, maxLength) {

    if (input === undefined) { return ''; }

    var MAX_LENGTH = maxLength || 20;

    if (input.length > MAX_LENGTH) {
      return input.slice(0, MAX_LENGTH - 3) + "...";

    } else {
      return input;
    }
  };
});

/**
 * For the n timeseries related to a structure, remove the ones with an
 * insufficient amount of measurements to be able draw a graph. Since ts events
 * have a max and a min, it is possible to draw a line between 1 data point.
 *
 * @param {Object[]} A list of timeseries
 * @return  {Object[]} A list of timeseries with sufficient data
 */
angular.module('lizard-nxt-filters')
  .filter('rmZeroDatumTimeseries', function () {

  return function (input) {
    var result = [];
    angular.forEach(input, function (datum) {
      if (datum.events.length > 0) { result.push(datum); }
    });
    return result;
  };
});


angular.module('lizard-nxt-filters')
  .filter('objectTitle', ['gettext', function (gettext) {

  return function (input) {

    return {
      'bridge': gettext('Bridge'),
      'channel': gettext('Channel'),
      /// Boezemkanaal
      'channel_Boezem': gettext('Bosom channel'),
      'channel_Primair': gettext('Primary channel'),
      'crossprofile': gettext('Crossprofile'),
      'culvert': gettext('Culvert'),
      'groundwaterstation': gettext('Groundwater station'),
      'manhole': gettext('Manhole'),
      'measuringstation': gettext('Measuring station'),
      'orifice': gettext('Orifice'),
      'outlet': gettext('Outlet'),
      'overflow': gettext('Overflow'),
      'pipe': gettext('Pipe'),
      'pumpstation': gettext('Pump station'),
      'weir': gettext('Weir'),
      'pressurepipe': gettext('Pressure pipe'),
      'sluice':gettext('Sluice'),
      'wastewatertreatmentplant': gettext('Wastewater treatment plant'),
      'levee': gettext('Levee'),
      'leveecrosssection': gettext('Levee cross section'),
      'leveereferencepoint': gettext('Levee reference point'),
      'monitoringwell': gettext('Monitoring well'),
      'pump': gettext('Pump'),
      'filter': gettext('Filter')
    }[input] || input;
  };

}]);

/**
 * Expects a string of '<anything - ...> - <source> - <value>' or only '<value>'
 * Return the last part (value).
 */
angular.module('lizard-nxt-filters')
  .filter('discreteRasterType', function () {
  return function (input) {
    if (input) {
      var labelParts = input.split(' - ');
      return labelParts[labelParts.length - 1];
    }
    else {
      return '';
    }
  };
});

/**
 * Expects a string of '<anything - ...> - <source> - <value>' or only '<value>'
 * Try to return the 2nd to last part (source), if it does not have so many
 * parts, return empty string.
 */
angular.module('lizard-nxt-filters')
  .filter('discreteRasterSource', function () {
  return function (input) {
    if (input) {
    var labelParts = input.split(' - ');
    var output = labelParts[labelParts.length - 2];
    if (output === undefined) { output = ''; }
    return output;
    }
    else {
      return '';
    }
  };
});

