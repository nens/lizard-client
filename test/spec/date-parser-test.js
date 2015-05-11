'use strict';

describe('Service: DateParser', function () {

  // load the service's module
  beforeEach(module('lizard-nxt'));

  var dateParser;

  beforeEach(inject(function ($injector) {
    dateParser = $injector.get('DateParser');
  }));

  it('should return an invalid moment when geocoded', function () {
    var d = dateParser('Amsterdam');
    expect(d.isValid()).toBe(false);
  });

  it('should return a valid date when provided with ISO-8601', function () {
    var d = dateParser('2010-01-01 17:06');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-01-2010');
    expect(d.hours()).toBe(17);
    expect(d.minutes()).toBe(6);
  });

  it('should return a valid date when provided with YYYY', function () {
    var d = dateParser('1995');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-01-1995');
  });

  it('should return a valid date when provided with YYYY-MM', function () {
    var d = dateParser('1995-04');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-04-1995');
  });

  it('should return a valid date when provided with MM-YYYY', function () {
    var d = dateParser('05-1995');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-05-1995');
  });

  it('should return a valid date when provided with MM-YYYY', function () {
    var d = dateParser('05-1995');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-05-1995');
  });

  it('should return a valid date when provided with DD-MM-YYYY', function () {
    var d = dateParser('14-04-2012');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('14-04-2012');
  });

  it('should return a valid date when provided with DD-MMM-YYYY', function () {
    var d = dateParser('14 april 2012');
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('14-04-2012');
  });

  it('should return a valid moment when provided with a month name', function () {
    var d = dateParser('April');
    var now = new Date();
    expect(d.isValid()).toBe(true);
    expect(d.calendar()).toBe('01-04-' + now.getFullYear());
  });

  it('should contain a duration as interval to zoom to', function () {
    var d = dateParser('April 4');
    expect(d.nxtInterval.days()).toBe(1);
  });

  it('should contain a string to display result', function () {
    var d = dateParser('April 4');
    expect(d.nxtFormatString).toBe('DD MMMM YYYY');
  });

});
