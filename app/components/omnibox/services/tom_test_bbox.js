var bbox = [ 4.783492, 52.417721, 4.862738, 52.484027 ]

L.latLngBounds(
  L.latLng(bbox[3], bbox[2]),
  L.latLng(bbox[1], bbox[0])
);