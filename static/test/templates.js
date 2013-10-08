angular.module('templates-main', ['../lizard_nxt/client/static/source/app/templates/egg.html', '../lizard_nxt/client/static/source/app/templates/empty.html', '../lizard_nxt/client/static/source/app/templates/geslotenleiding.html', '../lizard_nxt/client/static/source/app/templates/graph.html', '../lizard_nxt/client/static/source/app/templates/knoop.html', '../lizard_nxt/client/static/source/app/templates/kpi.html', '../lizard_nxt/client/static/source/app/templates/location.html', '../lizard_nxt/client/static/source/app/templates/object_id.html', '../lizard_nxt/client/static/source/app/templates/profile.html', '../lizard_nxt/client/static/source/app/templates/pumpstation.html']);

angular.module("../lizard_nxt/client/static/source/app/templates/egg.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/egg.html",
    "<h1>Easter</h1>\n" +
    "<img src=\"http://media.tumblr.com/tumblr_lnfmwz0gbq1qgllay.gif\"/>");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/empty.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/empty.html",
    "");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/geslotenleiding.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/geslotenleiding.html",
    "<div class=\"card objectidgraph\" ng-controller=\"ObjectIdGraphCtrl\">\n" +
    "	<strong>Geslotenleiding - <% metadata.fromgrid.id %></strong>\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>Lengte </dt><dd ng-bind=\"metadata.fromgrid.lei_len\"></dd>\n" +
    "		<dt>Hoogte </dt><dd ng-bind=\"metadata.fromgrid.pro_hgt\"></dd>\n" +
    "		<dt>Breedte </dt><dd ng-bind=\"metadata.fromgrid.pro_bre\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/graph.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/graph.html",
    "<div class=\"card\" ng-controller=\"GraphCtrl\">\n" +
    "	<nxt-line-graph data=\"data\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/knoop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/knoop.html",
    "<div class=\"card objectidgraph\" ng-controller=\"ObjectIdGraphCtrl\">\n" +
    "	<strong>Knoop - <% metadata.fromgrid.id %></strong>\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>BOK (m)</dt><dd ng-bind=\"metadata.fromgrid.knp_bok\"></dd>\n" +
    "		<dt>Breedte (m)</dt><dd ng-bind=\"metadata.fromgrid.knp_bre\"></dd>\n" +
    "		<dt>Water op straat (m<sup>2</sup>)</dt><dd ng-bind=\"metadata.fromgrid.wos_opp\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<!-- TODO: should be back to name. Name should be enterd in database. -->\n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>\n" +
    "\n" +
    "<!-- <div class=\"card objectidgraph\" ng-controller=\"ObjectIdGraphCtrl\">\n" +
    "	<h4>Knoop - <% metadata.fromgrid.id %></h4>\n" +
    "	<label for=\"info-knoop\"><i class=\"icon-info-2x\"></i> </label>\n" +
    "	<input type=\"checkbox\" ng-bind=\"info-button\" class=\"hide\" id=\"info-knoop\">\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>BOK (m)</dt><dd ng-bind=\"metadata.fromgrid.knp_bok\"></dd>\n" +
    "		<dt>Breedte (m)</dt><dd ng-bind=\"metadata.fromgrid.knp_bre\"></dd>\n" +
    "		<dt>Water op straat (m<sup>2</sup>)</dt><dd ng-bind=\"metadata.fromgrid.wos_opp\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.code\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div> -->");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/kpi.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/kpi.html",
    "<div class=\"card\" ng-controller=\"KpiCtrl\" ng-animate=\" 'animate' \">\n" +
    "  <div>\n" +
    "    <h2> <% kpi.cat_dict[kpi.slct_cat]  %> - <% kpi.slct_date %> </h2>\n" +
    "    <h4> <% kpi.slct_area %> </h4>\n" +
    "    <div>\n" +
    "      <dl class=\"dl-horizontal\">\n" +
    "        <div class=\"btn-group btn-group-vertical\">\n" +
    "          <div ng-repeat=\"category in kpi.categories\">\n" +
    "            <dt>\n" +
    "              <button \n" +
    "                type=\"button\"\n" +
    "                ng-class=\"{'btn-primary': category == kpi.slct_cat}\"\n" +
    "                ng-click=\"activate(kpi.slct_date, kpi.slct_area, category)\"\n" +
    "                class=\"btn btn-mini btn-block\">\n" +
    "                <% kpi.cat_dict[category]  %>\n" +
    "              </button>\n" +
    "            </dt>\n" +
    "            <dd>\n" +
    "              <!--ugly crap, make nicer data model for this -->\n" +
    "              <span class=\"badge\" ng-class=\"{\n" +
    "                'badge-success': labelValue(kpi.slct_date, kpi.slct_area, category) >= kpi.thresholds.warning,\n" +
    "                'badge-warning': labelValue(kpi.slct_date, kpi.slct_area, category) <  kpi.thresholds.warning && labelValue(kpi.slct_date, kpi.slct_area, category) > kpi.thresholds.error,\n" +
    "                'badge-important': labelValue(kpi.slct_date, kpi.slct_area, category) <= kpi.thresholds.error && labelValue(kpi.slct_date, kpi.slct_area, category) > 0\n" +
    "                }\">\n" +
    "                <% labelValue(kpi.slct_date, kpi.slct_area, category) %>\n" +
    "              </span>\n" +
    "            </dd>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </dl>\n" +
    "    </div>\n" +
    "    <nxt-line-graph data=\"formatted_data\" title=\"\" ylabel=\"\" xlabel=\"\" ymin=\"0\" ymax=\"10\" type=\"kpi\"></nxt-line-graph>\n" +
    "    <div>\n" +
    "      <button type=\"button\" class=\"btn btn-small\"\n" +
    "        ng-class=\"{'btn-primary': date == kpi.slct_date}\"\n" +
    "        ng-repeat=\"date in kpi.dates\"\n" +
    "        ng-click=\"activate(date, kpi.slct_area, kpi.slct_cat)\"><%date%>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <br />\n" +
    "    <div class=\"input-append\">\n" +
    "      <select ng-model=\"kpi.slct_area\" ng-options=\"area for area in kpi.areas\"></select>\n" +
    "      <button class=\"btn\"\n" +
    "        ng-class=\"{'btn-primary': area_level == 'wijk'}\"\n" +
    "        ng-click=\"kpiFormatter('wijk')\">wijk</button>\n" +
    "      <button class=\"btn\"\n" +
    "        ng-class=\"{'btn-primary': area_level == 'gemeente'}\"\n" +
    "        ng-click=\"kpiFormatter('gemeente')\">gemeente</button>\n" +
    "    </div>\n" +
    "    <div class=\"btn-group\" ng-model=\"area_level\">\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div>\n" +
    "    <label class=\"checkbox\">\n" +
    "      <input type=\"checkbox\" ng-model=\"checked\" ng-init=\"checked=false\" /> Instellen grenzen\n" +
    "    </label>\n" +
    "    <div ng-show=\"checked\" id=\"threshold\" class=\"well\">\n" +
    "      <label for=\"low\">Bovengrens: </label>\n" +
    "      <input type='range' ng-model='kpi.thresholds.warning' min='1' max='10'>\n" +
    "\n" +
    "      <label for=\"high\">Ondergrens: </label>\n" +
    "      <input type='range' ng-model='kpi.thresholds.error' min='1' max='10'>\n" +
    "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/location.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/location.html",
    "<div ng-controller=\"ResultsCtrl\">\n" +
    "\n" +
    "<div id=\"detail\" class=\"card location\" ng-class=\"{'pullDown': currentObject}\" ng-show=\"currentObject\">\n" +
    "	<h5><i class=\"icon-map-marker icon-large\"></i>&nbsp;<span ng-bind=\"currentObject.display_name\"></span></h5>\n" +
    "	<ul style=\"list-style:none;padding:0;margin:0;\">\n" +
    "	    <li ng-repeat=\"(key, value) in currentObject\" class=\"truncateme\">\n" +
    "      		<abbr ng-bind=\"value\" title=\"<% key %>\"></abbr>\n" +
    "	    </li>\n" +
    "	</ul>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<!--\n" +
    "  <div ng-show=\"box.query.length > 0\" ng-cloak ng-repeat=\"(key, value) in searchData\" class=\"card location\">\n" +
    "    <i class=\"icon-table\"></i>&nbsp;<a href=\"#\"><span ng-cloak ng-repeat=\"(k,v) in value\">\n" +
    "      <span ng-bind-html-unsafe=\"k | highlight:box.query\"></span>: <span ng-bind-html-unsafe=\"v | highlight:box.query\"></span></a>\n" +
    "    </span>       \n" +
    "  </div>\n" +
    "-->\n" +
    "  \n" +
    "  <div ng-show=\"box.type == 'location'\" class=\"card location\" ng-repeat=\"g in box.content | orderBy:'display_name'\">\n" +
    "    <i class=\"icon-map-marker\"></i>&nbsp;<a ng-click=\"showDetails(g)\" title=\"<% g.display_name %>\" data-latitude=\"<% g.lat %>\" data-longitude=\"<% g.lon %>\" style=\"cursor:pointer;\"><span ng-bind-html-unsafe=\"g.display_name \"></span></a> \n" +
    "    <!-- | highlight:box.query -->\n" +
    "  </div>\n" +
    "    \n" +
    "</div>");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/object_id.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/object_id.html",
    "<div class=\"card\" ng-controller=\"ObjectIdGraphCtrl\">\n" +
    "	<h3 ng-bind=\"metadata.title\"></h3>\n" +
    "	<h4 ng-show=\"metadata.type\" ng-bind=\"metadata.type\"></h4>\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>Lengte </dt><dd ng-bind=\"metadata.leidinglengte\"></dd>\n" +
    "		<dt>Hoogte </dt><dd ng-bind=\"metadata.profiel_hoogte\"></dd>\n" +
    "		<dt>Breedte </dt><dd ng-bind=\"metadata.profiel_breedte\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.name\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/profile.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/profile.html",
    "<div class=\"card\">\n" +
    "    <nxt-line-graph data=\"box.content\" ylabel=\"hoogte [mnap]\" xlabel=\"afstand [m]\" ymin=\"-10\" ymax=\"10\"></nxt-line-graph>\n" +
    "    <!--<nxt-line-graph data=\"box.content\" ylabel=\"\" xlabel=\"\"></nxt-line-graph>-->\n" +
    "</div>\n" +
    "");
}]);

angular.module("../lizard_nxt/client/static/source/app/templates/pumpstation.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("../lizard_nxt/client/static/source/app/templates/pumpstation.html",
    "<div class=\"card objectidgraph\" ng-controller=\"ObjectIdGraphCtrl\">\n" +
    "	<strong>Gemaal - <% metadata.fromgrid.code %></strong>\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>Start niveau </dt><dd ng-bind=\"metadata.fromgrid.start_level\"></dd>\n" +
    "		<dt>Stop niveau </dt><dd ng-bind=\"metadata.fromgrid.stop_level\"></dd>\n" +
    "		<dt>Capaciteit </dt><dd ng-bind=\"metadata.fromgrid.capacity\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);
