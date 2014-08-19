/**
 * Map service encapsulates all kinds of helper functions
 * for the map-directive. A wrapper of sorts for Leaflet stuff.
 *
 * 
 */

Problem
=======
Map Directive has become polluted, aggregate directives are misplaced. 

Solution
========
Call into life a map-service that handles this stuff.

TODO
----
- [ ] Create map-service
- [ ] Write tests
- [ ] Port/refactor map-directive helper functions to service
- [ ] Port/refactor aggregate-directive to service
