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


/**
 * Nice number or ellipsis returns a rounded number or a '...'.
 *
 * @param {string or number} input to round or convert to dash
 * @param {number} optional decimals to round the number to
 * @return {string or number} when input is a number: returns a number
 * rounded to specified decimals else returns '-'
 */
app.filter('niceNumberOrEllipsis', function () {
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

app.filter('lookupManholeShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case 0.0:
      out = 'vierkant';
      break;
    case 1.0:
      out = 'rond';
      break;
    case 2.0:
      out = 'rechthoekig';
      break;
    default:
      out = '...';
    }
    return out;
  };
});

app.filter('lookupManholeMaterial', function () {
  return function (input) {
    var out;
    out = '...';
    return out;
  };
});

app.filter('truncate', function () {
  return function (text, length, end) {
    if (isNaN(length)) {
      length = 10;
    }
    if (end === undefined) {
      end = "...";
    }
    if (text.length <= length || text.length - end.length <= length) {
      return text;
    }
    else {
      return String(text).substring(0, length - end.length) + end;
    }
  };
});


app.filter('allowedFlowDirection', function () {
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

app.filter('pipeTypeOrEllipsis', function () {
  return function (input) {
    var out;
    switch (input) {
    case '00':
      out = 'gemengd';
      break;
    case '01':
      out = 'regenwater';
      break;
    case '02':
      out = 'DWA';
      break;
    default:
      out = '...';
    }
    return out;
  };
});

app.filter('lookupPipeShape', function () {
  return function (input) {
    var out;
    out = '...';
    return out;
  };
});

app.filter('pipeMaterialOrEllipsis', function () {
  return function (input) {
    var out;
    out = '...';
    return out;
  };
});
