angular.module('omnibox')
  .service('DateParser', [function DateParser () {

    var FORMATTERS = [
      moment.ISO_8601, //http://en.wikipedia.org/wiki/ISO_8601
      'YYYY',       // 2014
      'YYYY-MM',    //
      'YYYY-MMM',
      'MM-YYYY',
      'MMM-YYYY',
      'DD-MM-YYYY',
      'DD-MMM-YYYY', //
    ];

    var parser = function (dString) {
      var m = window.moment(dString, FORMATTERS);
      return m;
    };

    return parser;

  }
]);
