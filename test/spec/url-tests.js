
describe('Testing LocationGetterSetter', function () {
  var $location,
    service;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    service = $injector.get('LocationGetterSetter');
  }));

  it('should return the relevant part of the path', function () {
    $location.path('/first/second/@1234,5678/november-18');
    expect(service.getUrlValue('path', 1)).toBe('second');
    expect(service.getUrlValue('at', 1)).toBe('november-18');
    expect(service.getUrlValue('path', 0)).toBe('first');
  });

  it('should return undefined when the index in the path is not set', function () {
    $location.path('/first/second/@1234,5678/november-18');
    expect(service.getUrlValue('path', 3)).toBeUndefined();
  });

  it('should throw an error when requesting non-supported parts', function () {
    $location.path('/first/second/@1234,5678/november-18');
    var part = 'hash';
    expect(function () {
      service.getUrlValue(part, 1);
    }).toThrowError(part + ' is not a supported part of the url');
  });

  it('should set values on the relevant part of the url', function () {
    $location.path('/first/second/@1234,5678/november-18');
    var value = 3;
    service.setUrlValue('path', 1, value);
    expect(service.getUrlValue('path', 1)).toBe(String(value));
    service.setUrlValue('at', 3, value);
    expect(service.getUrlValue('at', 3)).toBe(String(value));
  });

  it('should return undefined between set and non-set indexes', function () {
    $location.path('/first/second/@1234,5678/november-18');
    var value = 3;
    service.setUrlValue('path', 3, value);
    expect(service.getUrlValue('path', 2)).toBeUndefined();
  });

  it('should set empty values on the url when provided undefined', function () {
    $location.path('/first/second/@1234,5678/november-18');
    var value = undefined;
    service.setUrlValue('path', 0, value);
    expect($location.path()).toEqual('//second/@1234,5678/november-18');
    service.setUrlValue('at', 1, value);
    expect($location.path()).toEqual('//second/@1234,5678');
  });

});


describe('Testing UrlService', function () {
  var $location, State, service;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    State = $injector.get('State');
    service = $injector.get('UrlService');

    State.layers.push(
      {
        'active': false,
        'type': 'raster',
        'uuid': 'd053078',
        'name': 'dem'
      },
      {
        'active': true,
        'type': 'assetgroup',
        'uuid': '0037b5f',
        'name': 'Water'
      }
    );
    State.language = 'en';
  }));

  it('should set the url', function () {
    var url = '/portal/en/map/topography,assetgroup$0037b5f/point/@0.0000,0.0000,0/' +
      '-2Days0Hours+0Days3Hours';
    service.setUrl(State);
    expect($location.path()).toEqual(url);
  });

  it('should get the state', function () {
    var url = '/portal/vi/dashboard/neutral,annotations,assetgroup$0037b5f/region/@4,6,8/' +
      'Jan,04,2008-Jul,14,2016';
    $location.path(url);
    var expectedUrlState = {
      language: 'vi', // url-service makes no assumptions on available
                      // languages, it returns the first part of the path.
      context: 'dashboard',
      baselayer: 'neutral',
      annotationsActive: true,
      activeLayers: ['assetgroup$0037b5f'],
      boxType: 'region',
      view: { lat: 4, lng: 6, zoom: 8 },
      assets: [],
      geometries: [],
      temporal: { start :1199401200000, end :1468447200000 }
    };
    var state = service.getDataForState();

    expect(state).toEqual(expectedUrlState);
  });

});
