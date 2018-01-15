'use strict';

/**
 * Lizard-nxt angular filters. See https://docs.angularjs.org/guide/filter
 *
 * Lizard filters are used in two ways in lizard:
 *
 * 1. As ligitimate ways to parse objects or primitives in templates.
 *    (niceNumberOrEllipsis, capitalize, ...)
 * 2. As hacks because we have a halve-assed asset database/serializers, which
 *    do not translate attributes properly. (lookupManholeShape,
 *    lookupWeirControl, ...)
 *
 * TODO: move logic to the serializers and further implement
 * internationalization in the backend.
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
 * Filter to uppercase a complete string.
 */
angular.module('lizard-nxt-filters')
  .filter('upper', function () {
  return function (s) {
    return s.toUpperCase();
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
    case 0:
      out = 'rond';
      break;
    case 1:
      out = 'eivorm';
      break;
    case 2:
      out = 'rechthoek';
      break;
    case 3:
      out = 'muilvorm';
      break;
    case 4:
      out = 'vierkant';
      break;
    case 5:
      out = 'heul';
      break;
    case 6:
      out = 'trapezium';
      break;
    case 98:
      out = 'Vorm afwijkend';
      break;
    case 99:
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
    case 0:
      out = 'beton';
      break;
    case 1:
      out = 'PVC';
      break;
    case 2:
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
    case 1:
      out = 'Vast';
      break;
    case 2:
      out = 'Regelbaar, niet auto';
      break;
    case 3:
      out = 'Regelbaar, auto';
      break;
    case 4:
      out = 'Handmatig';
      break;
    case 98:
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


angular.module('lizard-nxt-filters')
  .filter('objectTitle', ['gettext', function (gettext) {

  return function (input) {

    return {
      'building': gettext('Building'),
      'bridge': gettext('Bridge'),
      'channel': gettext('Channel'),
      /// Boezemkanaal
      'channel_Boezem': gettext('Bosom channel'),
      'channel_Primair': gettext('Primary channel'),
      'crossprofile': gettext('Crossprofile'),
      'culvert': gettext('Culvert'),
      'filter': gettext('Filter'),
      'groundwaterstation': gettext('Groundwater station'),
      'levee': gettext('Levee'),
      'leveecrosssection': gettext('Levee cross section'),
      'leveereferencepoint': gettext('Levee reference point'),
      'manhole': gettext('Manhole'),
      'measuringstation': gettext('Measuring station'),
      'monitoringwell': gettext('Monitoring well'),
      'orifice': gettext('Orifice'),
      'outlet': gettext('Outlet'),
      'overflow': gettext('Overflow'),
      'pipe': gettext('Pipe'),
      'pressurepipe': gettext('Pressure pipe'),
      'pump': gettext('Pump'),
      'pumpstation': gettext('Pump station'),
      'pumpeddrainagearea': gettext('Pumped drainage area'),
      'road': gettext('Road'),
      'sluice':gettext('Sluice'),
      'wastewatertreatmentplant': gettext('Wastewater treatment plant'),
      'weir': gettext('Weir')
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

angular.module('lizard-nxt-filters')
  .filter('truncate', function () {
  return function (input, maxLen) {
    if (input.length > maxLen - 3) {
      return input.slice(0, maxLen - 3) + "...";
    } else {
      return input;
    }
  };
});
