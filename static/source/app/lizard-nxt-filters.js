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

app.filter('niceNumberOrDash', function () {
    return function (input, decimals) {
      var out;
      if (typeof(input) === 'number') {
        var factor = 1;
        if (decimals) {
          factor = Number(factor + decimals * '0');
        }
        out = Math.round(input * factor) / factor;
      } else {
        out = '-';
      }
      return out;
    };
  });