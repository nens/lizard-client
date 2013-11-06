/*
 * L.TileLayer.WMS.incrementalSingleTile is used for putting WMS tile layers on the map

 	...just like the original
	the improvment is that a lot of WMS-Requests get combined to a single request (for performance issues).
	It is done by merging all of the TilePoints to blocks described by L.Bounds. Each L.bound results in only one Request ("singleTile").
	After a  pan there is nop need to load the map as a whole but only to incement the tiles in the empty areas ("incremental").
	
	The behaviour (typical):
	on first load of the wms layer: 1 WMS-request in container-size
	after a pan-gesture: 1 request for a row or a column
	(works also for the rare case that after panning in a wide circle there is a only a small gap between loaded blocks)
	
	in the case that the zoom and the options result in multiple earths in a row we end up with one request for each of the earths (but there are only 3 cases possible: left-cut-off, full, right cut off; so for more than one in the middle/full browsercaching kicks in)
	
	feel free to clean up this mess ;-)
 */

L.TileLayer.WMS.incrementalSingleTile = L.TileLayer.WMS.extend({

	initialize: function(url, options) {
		L.TileLayer.WMS.prototype.initialize.call(this, url, options);
		// tilePoints is a look-up table to store ids for "tilePoints" that where loaded in a bigger tile
		// it works as an replacment for the look-up functionality of the typed Array the tiles are stored in 
		this.tilePoints = [];
	},

	getTileUrl: function(tileBounds, zoom) { // (Bounds, Number) -> String
		// only minor changes to deal with the switchover in the input from tilePoint to tileBound
		var width = tileBounds.max.x - tileBounds.min.x + 1;
		var height = tileBounds.max.y - tileBounds.min.y + 1;

		var tilePoint = new L.Point(tileBounds.min.x, tileBounds.min.y)
		var map = this._map,
			tileSize = this.options.tileSize,

			nwPoint = tilePoint.multiplyBy(tileSize),
			sePoint = nwPoint.add([tileSize * width, tileSize * height]),

			nw = this._crs.project(map.unproject(nwPoint, zoom)),
			se = this._crs.project(map.unproject(sePoint, zoom)),

			bbox = [nw.x, se.y, se.x, nw.y].join(','),

			url = L.Util.template(this._url, {
				s: this._getSubdomain(tilePoint)
			});

		// width and height for the WMS-Request is changing on every call
		// the only need to "store" it to the wmsParams is to get the upcoming Util function work
		if (this.options.detectRetina && L.Browser.retina) {
			this.wmsParams.width = tileSize * width*2;
			this.wmsParams.height = tileSize * height*2;
		} else {
			this.wmsParams.width = tileSize * width;
			this.wmsParams.height = tileSize * height;
		}

		return url + L.Util.getParamString(this.wmsParams, url, true) + '&BBOX=' + bbox;
	},

	_tileShouldBeLoaded: function(tilePoint) {
		if (this.tilePoints.indexOf(tilePoint.x + ':' + tilePoint.y) != -1){
			return false;
		}
		

		var options = this.options;

		if (!options.continuousWorld) {
			var limit = this._getWrapTileNum();

			// don't load if exceeds world bounds
			if ((options.noWrap && (tilePoint[0] < 0 || tilePoint[0] >= limit)) ||
				tilePoint[1] < 0 || tilePoint[1] >= limit) {
				return false;
			}
		}

		if (options.bounds) {
			var tileSize = options.tileSize,
				nwPoint = tilePoint.multiplyBy(tileSize),
				sePoint = nwPoint.add([tileSize, tileSize]),
				nw = this._map.unproject(nwPoint),
				se = this._map.unproject(sePoint);

			// TODO temporary hack, will be removed after refactoring projections
			// https://github.com/Leaflet/Leaflet/issues/1618
			if (!options.continuousWorld && !options.noWrap) {
				nw = nw.wrap();
				se = se.wrap();
			}

			if (!options.bounds.intersects([nw, se])) {
				return false;
			}
		}

		return true;
	},

	_adjustTilePoint: function (tileBound) {
		var limit = this._getWrapTileNum();
		if (!this.options.continuousWorld && !this.options.noWrap) {
			//orginal Code: tilePoint.x = ((tilePoint.x % limit) + limit) % limit;
			/* what worked for a single point seems to work for bounds to; not proofed*/
			tileBound.min.x = ((tileBound.min.x % limit) + limit) % limit;
			tileBound.max.x = ((tileBound.max.x % limit) + limit) % limit;
		}

		if (this.options.tms) {
			tileBound.y = limit - tileBound.y - 1;
		}

		tileBound.z = this._getZoomForUrl();
	},

	_addTilesFromCenterOut: function(bounds) { /*the name of the function is missleading*/
		var queue = [];

		var limit = this._getWrapTileNum();

		for (j = bounds.min.y; j <= bounds.max.y; j++) {
			for (i = bounds.min.x; i <= bounds.max.x; i++) {
				if (this._tileShouldBeLoaded(new L.Point(i, j))) {
					// in the following i use a simple Array to descripe the tilePoint and not Leaflets L.Point-Object
					// for me its more comfortable for the sorting, splitting and merging to come to bounds
					queue.push([i,j]);
					this.tilePoints.push(i + ':' + j)
				}
			}
		}

		if (queue.length === 0) { return; }


		//----------
		// this is the hardest task: Combining Tilepoints to tileBounds
		// For clearity I split the function in three parts:
		// 1: Sort the Array of tilepoints
		// 2: split the sorted Array of tilepoints in solid rows
		// 3: merge rows if it results is an rectangale

		// I think that this can be done better and more efficient

		// (1) sort the list of Tilepoints like this: worldCopy > y > x
		queue.sort(function(a,b){
			var aCopy = Math.floor(a[0]/limit)
			var bCopy = Math.floor(b[0]/limit)
			if (aCopy === bCopy){
				if (a[1] === b[1]){
					return a[0] - b[0]
				}
				return a[1] - b[1]
			}
			return aCopy - bCopy
		})

		// (2) split the list into rows
		var rows = [], row;
		while (queue.length){
			var point = queue.shift()
			// split whenever the y value or the worldCopy changes
			if (row && row[0][1]==point[1] && Math.floor(row[0][0]/limit) == Math.floor(point[0]/limit)){
				row.push(point);
			} else {
				row = [point];
				rows.push(row);
			}
		}

		// (3) merge consecutive rows if they fit together in x-Dimension
		// two rows fit if they have the same length and their first and last Point has the same x-value
		// (TODO: show that fitting rows are neighbours; y distance = 1)
		var bounds = [], bound;
		while (rows.length){
			var bound = rows.shift();
			var rowLength = bound.length;
			while (rows[0] && (rowLength == rows[0].length) && (bound[0][0]==rows[0][0][0]) && (bound[rowLength-1][0]==rows[0][rowLength-1][0]))
				bound = bound.concat(rows.shift())
			// first and last tilePoint in merged rows determine the dimension of the bound
			bounds.push(new L.Bounds([[bound[0][0],bound[0][1]],[bound[bound.length-1][0],bound[bound.length-1][1]]]))
		};

		//----------
		// the rest is straight-forward


		var tilesToLoad = bounds.length;

		if (tilesToLoad === 0) {
			return;
		}

		var fragment = document.createDocumentFragment();

		// if its the first batch of tiles to load
		if (!this._tilesToLoad) {
			this.fire('loading');
		}

		this._tilesToLoad += tilesToLoad;

		for (i = 0; i < tilesToLoad; i++) {
			this._addTile(bounds[i], fragment);
		}

		this._tileContainer.appendChild(fragment);
	},

	_reset: function (e) {
		// clear the look-up table
		this.tilePoints = [];
		L.TileLayer.prototype._reset.call(this);
	},

	_addTile: function(tileBounds, container) {
		// only minor changes to deal with the switchover in the input from tilePoint to tileBound
		var width = tileBounds.max.x - tileBounds.min.x + 1;
		var height = tileBounds.max.y - tileBounds.min.y+1;
		tilePoint = new L.Point(tileBounds.min.x, tileBounds.min.y)
		var tilePos = this._getTilePos(tilePoint);

		var tile = this._getTile();
		tile.style.width = this.options.tileSize * width + 'px';
		tile.style.height = this.options.tileSize * height + 'px';

		L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

		this._tiles[tileBounds.min.x + ':' + tileBounds.min.y + ":" + tileBounds.max.x + ":" + tileBounds.max.y] = tile;

		this._loadTile(tile, tileBounds);

		if (tile.parentNode !== this._tileContainer) {
			container.appendChild(tile);
		}
	},


	_removeOtherTiles: function (bounds) {
		var kArr, x, y, key;

		for (key in this._tiles) {
			kArr = key.split(':');
			nw = new L.Point(parseInt(kArr[0], 10),parseInt(kArr[1], 10))
			se = new L.Point(parseInt(kArr[2], 10),parseInt(kArr[3], 10))

			// remove tile if it's out of bounds
			if (!bounds.intersects(new L.Bounds(nw,se))) {
				this._removeTile(key);
				for (var x = nw.x; x <= se.x; x++) {
					for (var y = nw.y; y <= se.y; y++) {
						this.tilePoints.splice(this.tilePoints.indexOf(x+":"+y), 1)
					};
				};
			}
		}
	}
});

L.tileLayer.wmsIncrementalSingleTile = function(url, options) {
	return new L.TileLayer.WMS.incrementalSingleTile(url, options);
};
