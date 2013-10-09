angular.module('templates-main', ['templates/culvert.html', 'templates/default.html', 'templates/egg.html', 'templates/empty.html', 'templates/geslotenleiding.html', 'templates/intersecttool.html', 'templates/knoop.html', 'templates/kpi.html', 'templates/location.html', 'templates/object_id.html', 'templates/omnibox-search.html', 'templates/profile.html', 'templates/pumpstation.html', 'templates/weir.html']);

angular.module("templates/culvert.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/culvert.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/culvert.png\" class=\"img-circle\"/>\n" +
    "    <span>Culvert</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>BOB Bovenstrooms (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_upstream | number: 2\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>BOB Benedenstrooms (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_downstream | number: 2\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Breedte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.width | number: 2\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "        <td>Lengte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.length | number: 2\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/default.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/default.html",
    "<div class=\"card\" >\n" +
    "	<li class=\"recommendation no-right-padding\" href=\"#\" ng-click=\"toggle_tool('kpi')\" ng-class=\"{'icon-large': tools.kpi.enabled}\" title=\"Key Performance Indicator\">\n" +
    "    	<i class=\"icon-dashboard\"></i>\n" +
    "    	<a class=\"recommendations\">kpi</a>\n" +
    "	</li>\n" +
    "	<div class=\"vertical-divider\"></div>\n" +
    "	<li class=\"left-text no-left-padding\">\n" +
    "		<a href=\"#\" ng-click=\"geoLocate()\"><i class=\"icon-bullseye\"></i>&nbsp;Ga naar uw locatie</a>, of probeer te zoeken naar <a href=\"\" ng-click=\"simulateSearch('Purmerend')\">Purmerend</a> <i class=\"icon-circle very-small-icon\"></i> <a href=\"\" ng-click=\"simulateSearch('Apeldoorn')\">Apeldoorn</a> <i class=\"icon-circle very-small-icon\"></i> <a href=\"\" ng-click=\"simulateSearch('Riolering')\">Riolering</a>\n" +
    "	</li>\n" +
    "</div>");
}]);

angular.module("templates/egg.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/egg.html",
    "<h1>Easter</h1>\n" +
    "<img src=\"http://media.tumblr.com/tumblr_lnfmwz0gbq1qgllay.gif\"/>");
}]);

angular.module("templates/empty.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/empty.html",
    "");
}]);

angular.module("templates/geslotenleiding.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/geslotenleiding.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/geslotenleiding.png\" class=\"img-circle\"/>\n" +
    "    <span>Geslotenleiding</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Lengte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.lei_len | number: 2\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Breedte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.pro_bre | number: 2\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Hoogte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.pro_hgt | number: 2\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/intersecttool.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/intersecttool.html",
    "<div class=\"card\">\n" +
    "    <li class=\"recommendation no-right-padding\" href=\"#\" ng-click=\"toggle_tool('profile')\" title=\"Intersect tool\">\n" +
    "		<i class=\"icon-resize-full\"></i>\n" +
    "	  	<a class=\"recommendations\">intersect</a>\n" +
    "	</li>\n" +
    "	<div class=\"vertical-divider\"></div>\n" +
    "	<li class=\"left-text no-left-padding\">\n" +
    "		Trek een lijn met de intersectietool om een hoogteprofiel te krijgen\n" +
    "	</li>\n" +
    "</div>");
}]);

angular.module("templates/knoop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/knoop.html",
    "<div class=\"card\">\n" +
    "	<div class=\"card-title\">\n" +
    "		<img src=\"/static/distjs/images/knoop.png\" class=\"img-circle\"/>\n" +
    "		<span>Knoop</span>\n" +
    "	</div>\n" +
    "	<table class=\"left\">\n" +
    "		<tr>\n" +
    "			<td>BOK (m) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.knp_bok | number: 2\"></td>\n" +
    "		</tr>\n" +
    "		<tr>\n" +
    "			<td>Breedte (m) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.knp_bre | number: 2\"></td>\n" +
    "		</tr>\n" +
    "	</table>\n" +
    "	<table class=\"right\">\n" +
    "		<tr>\n" +
    "			<td>WOS opp. (m<sup>2</sup>) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.wos_opp | number: 2\"></td>\n" +
    "		</tr>\n" +
    "		<tr>\n" +
    "			<td>Maaiveld (m NAP) </td>\n" +
    "			<td ng-bind=\"metadadata.fromgrid.mvd_niv | number: 2\"></td>\n" +
    "		</tr>\n" +
    "	</table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"timeseriesdata\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>\n" +
    "");
}]);

angular.module("templates/kpi.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/kpi.html",
    "<div class=\"card kpi\" ng-controller=\"KpiCtrl\" ng-animate=\" 'animate' \">\n" +
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
    "                class=\"btn btn-xs btn-block\">\n" +
    "                <% kpi.cat_dict[category]  %>\n" +
    "              </button>\n" +
    "            </dt>\n" +
    "            <dd>\n" +
    "              <!--ugly crap, make nicer data model for this -->\n" +
    "              <span class=\"label\" ng-class=\"{\n" +
    "                'label-success': labelValue(kpi.slct_date, kpi.slct_area, category) >= kpi.thresholds.warning,\n" +
    "                'label-warning': labelValue(kpi.slct_date, kpi.slct_area, category) <  kpi.thresholds.warning && labelValue(kpi.slct_date, kpi.slct_area, category) > kpi.thresholds.error,\n" +
    "                'label-danger': labelValue(kpi.slct_date, kpi.slct_area, category) <= kpi.thresholds.error && labelValue(kpi.slct_date, kpi.slct_area, category) > 0\n" +
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
    "      <button type=\"button\" class=\"btn btn-sm\"\n" +
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
    "      <input type='range' ng-model='kpi.thresholds.warning' min='1' max='10'><br>\n" +
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

angular.module("templates/location.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/location.html",
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
    "  <div ng-show=\"box.query.length > 0\" ng-cloak ng-repeat=\"(key, value) in searchData\" class=\"card cluster location\">\n" +
    "    <span ng-if=\"value.pin\">\n" +
    "      <i class=\"icon-table\"></i>&nbsp;\n" +
    "      <a ng-click=\"showDetails(value)\" data-latitude=\"<% value.geometry[0] %>\" data-longitude=\"<% value.geometry[1] %>\" style=\"cursor:pointer;\">\n" +
    "        <span ng-bind-html-unsafe=\"value.name\"></span>\n" +
    "      </a>\n" +
    "    </span>\n" +
    "  </div>\n" +
    "\n" +
    "  \n" +
    "  <div ng-show=\"box.type == 'location'\" class=\"card cluster location\" ng-repeat=\"g in box.content | orderBy:'display_name'\">\n" +
    "    <i class=\"icon-map-marker\"></i>&nbsp;<a ng-click=\"showDetails(g)\" title=\"<% g.display_name %>\" data-latitude=\"<% g.lat %>\" data-longitude=\"<% g.lon %>\" style=\"cursor:pointer;\"><span ng-bind-html-unsafe=\"g.display_name \"></span></a> \n" +
    "    <!-- | highlight:box.query -->\n" +
    "  </div>\n" +
    "    \n" +
    "    \n" +
    "  <div ng-show=\"box.type == 'location'\" class=\"card cluster location\" ng-repeat=\"g in box.bbox_content\">\n" +
    "    <i class=\"icon-map-marker\"></i>&nbsp;<a ng-click=\"showDetails(g)\" title=\"<% g.name %>\" data-latitude=\"<% g.geometry[0] %>\" data-longitude=\"<% g.geometry[1] %>\" style=\"cursor:pointer;\"><span ng-bind-html-unsafe=\"g.name \"></span></a> \n" +
    "    <!-- | highlight:box.query -->\n" +
    "  </div>    \n" +
    "");
}]);

angular.module("templates/object_id.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/object_id.html",
    "<div class=\"card\">\n" +
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

angular.module("templates/omnibox-search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/omnibox-search.html",
    "<div class=\"searchbox\" id=\"searchbox\" tabindex=\"-1\" role=\"search\" style=\"\">\n" +
    "    <form id=\"searchbox_form\"> \n" +
    "        <table cellspacing=\"0\" cellpadding=\"0\" id=\"\" class=\"searchboxinput\" style=\"width: 375px; padding: 0px;\">\n" +
    "            <tbody>\n" +
    "                <tr>\n" +
    "                    <td>\n" +
    "                        <input ui-keydown=\"{esc: 'reset_query()'}\" ui-keyup=\"{'enter':'search($event)'}\" ng-model=\"box.query\" ng-focus id=\"searchboxinput\" name=\"q\" tabindex=\"1\" autocomplete=\"off\" dir=\"ltr\" spellcheck=\"false\"><a href=\"\" ng-click=\"reset_query()\" id=\"clear\"></a>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </form> \n" +
    "    <button id=\"search-button\" class=\"searchbutton\" ng-click=\"search($event)\" aria-label=\"Search\" tabindex=\"3\"></button>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"cards\" class=\"pullDown cardbox\" ng-show=\"box.showCards\" style=\"overflow:auto;display:block;\"></div> ");
}]);

angular.module("templates/profile.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/profile.html",
    "<div class=\"card\">\n" +
    "    <nxt-line-graph data=\"box.content.data\" ylabel=\"box.content.yLabel\" xlabel=\"box.content.xLabel\" ymin=\"-10\" ymax=\"10\"></nxt-line-graph>\n" +
    "    <!--<nxt-line-graph data=\"box.content\" ylabel=\"\" xlabel=\"\"></nxt-line-graph>-->\n" +
    "</div>\n" +
    "");
}]);

angular.module("templates/pumpstation.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/pumpstation.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/gemaal.png\" class=\"img-circle\"/>\n" +
    "    <span>Gemaal</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Aanslagpeil (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.start_level | number: 2\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Afslagpeil (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.stop_level | number: 2\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Capaciteit (l/s) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.capacity | number: 2\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/weir.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/weir.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/weir.png\" class=\"img-circle\"/>\n" +
    "    <span>Stuw</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Kruinbreedte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_upstream | number: 2\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Kruinhoogte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_downstream | number: 2\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Debiet coefficient</td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.discharge_coef | number: 2\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);
