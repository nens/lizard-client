# (c) Nelen & Schuurmans.  GPL licensed, see LICENSE.rst.
# -*- coding: utf-8 -*-

from __future__ import print_function
from __future__ import unicode_literals

from hashlib import md5
import json
import random

from django.conf import settings
from django.contrib.gis.geos import MultiPolygon
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.safestring import mark_safe
from rest_framework.renderers import JSONRenderer

from hydra_core.models import Layer
from hydra_core.models import Event
from hydra_core.models import EventSeries
from lizard_nxt.server.serializers import spatial
from lizard_nxt.server.middleware import ORGANISATION_IDS
from lizard_auth_client.models import Organisation


def _bootstrap(objects):
    """Render objects as JSON.

    :param objects: objects to render
    """
    return mark_safe(JSONRenderer().render(objects))


def index(request):
    base_layers = spatial.LayerSerializer(
        Layer.objects.filter(baselayer=True)).data
    layers = spatial.LayerSerializer(
        Layer.objects.filter(baselayer=False)).data
    event_series = EventSeries.objects.all()
    event_types = []
    for event_series_ in event_series:
        count = Event.objects.filter(event_series=event_series_).count()
        event_types.append({"type": event_series_.type,
                            "event_count": count,
                            "event_series": event_series_.id})

    for layer in layers:
        if layer['type'] == 'ASSET':
            layer['url'] = ('http://' + request.META['HTTP_HOST'] +
                            '/api/v1/tiles/{slug}/{z}/{x}/{y}.{ext}')

    # Define data bounds based on the (multiple) administrative bounds of all
    # the user's organisations. The data bounding box is the rectangle around
    # the data bounds.
    data_bounds = {}
    orgs = getattr(request, ORGANISATION_IDS, [])
    all_boundaries = []
    for org in Organisation.objects.filter(id__in=orgs):
        boundaries = []
        for boundary in org.administrativeboundary_set.all():
            for polygon in boundary.the_geom:
                boundaries.append(polygon)
                all_boundaries.append(polygon)
        if len(boundaries) > 0:
            (west, south, east, north) = MultiPolygon(boundaries).extent
            data_bounds[org.name] = {'north': north, 'east': east,
                                     'south': south, 'west': west}
    if len(all_boundaries) > 0:
        (west, south, east, north) = MultiPolygon(all_boundaries).extent
        data_bounds['all'] = {'north': north, 'east': east,
                              'south': south, 'west': west}
    else:
        # The Netherlands
        data_bounds['all'] = {'north': 53.63, 'east': 7.58,
                              'south': 50.57, 'west': 3.04}

    context = {
        'random_string': md5(str(random.random())).hexdigest(),
        'strap_base_layers': _bootstrap(base_layers),
        'strap_layers': _bootstrap(layers),
        'strap_data_bounds': _bootstrap(data_bounds),
<<<<<<< HEAD
        'strap_event_types': _bootstrap(event_types),
=======
        'strap_orgs': _bootstrap(orgs),
        'threedi_instance': ThreediInstance.objects.all()[0],
>>>>>>> af5c41d94140583cd68dcd38fdffe0b38d6395fd
        # For now, just assign a server
    }
    if getattr(settings, "DEV_TEMPLATE", False):
        return render_to_response('client/debug.html', context,
                                  context_instance=RequestContext(request))
    else:
        return render_to_response('client/base.html', context,
                                  context_instance=RequestContext(request))


def search(request):
    context = {
        'random_string': md5(str(random.random())).hexdigest(),
    }
    return render_to_response('search/search.html', context,
                              context_instance=RequestContext(request))


def jsonp_view(request):
    data = json.dumps(request.GET.dict())
    callback_string = request.GET['callback']
    jsonp = callback_string + '(' + data + ')'
    return HttpResponse(jsonp, mimetype='application/javascript')
