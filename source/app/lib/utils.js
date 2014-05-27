
  function isDefined(value) {
    return typeof value !== 'undefined';
  }

  function tryDecodeURIComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch(e) {
      // Ignore any invalid uri component
    }
  }

  function encodeUriQuery(val, pctEncodeSpaces) {
    return encodeURIComponent(val).
               replace(/%40/gi, '@').
               replace(/%3A/gi, ':').
               replace(/%24/g, '$').
               replace(/%2C/gi, ',').
               replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
  }

  function parseKeyValue(keyValue) {
    var obj = {}, key_value, key;
    angular.forEach((keyValue || "").split('&'), function(keyValue){
      if ( keyValue ) {
        key_value = keyValue.split('=');
        key = tryDecodeURIComponent(key_value[0]);
        if ( angular.isDefined(key) ) {
          var val = angular.isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : true;
          if (!obj[key]) {
            obj[key] = val;
          } else if(angular.isArray(obj[key])) {
            obj[key].push(val);
          } else {
            obj[key] = [obj[key],val];
          }
        }
      }
    });
    return obj;
  }

  function toKeyValue(obj) {
    var parts = [];
    angular.forEach(obj, function(value, key) {
      if (angular.isArray(value)) {
        angular.forEach(value, function(arrayValue) {
          parts.push(encodeUriQuery(key, true) +
                     (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true)));
        });
      } else {
      parts.push(encodeUriQuery(key, true) +
                 (value === true ? '' : '=' + encodeUriQuery(value, true)));
      }
    });
    return parts.length ? parts.join('&') : '';
  }

