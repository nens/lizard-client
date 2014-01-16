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

from hydra_core.models import AdministrativeBoundary, Layer, ThreediInstance
from lizard_nxt.server.serializers import spatial
from lizard_nxt.server.middleware import ORGANISATION_IDS
from lizard_auth_client.models import Organisation


def _bootstrap(objects):
    return mark_safe(JSONRenderer().render(objects))


def index(request):
    base_layers = spatial.LayerSerializer(
        Layer.objects.filter(baselayer=True)).data
    layers = spatial.LayerSerializer(
        Layer.objects.filter(baselayer=False)).data
    data_bounds = {}
    orgs = getattr(request, ORGANISATION_IDS, [])
    all_boundaries = []
    for org in Organisation.objects.filter(id__in=orgs):
        boundaries = []
        for boundary in org.administrativeboundary_set.all():
            for polygon in boundary.the_geom:
                boundaries.append(polygon)
                all_boundaries.append(polygon)
        mp = MultiPolygon(boundaries)
        data_bounds[org.name] = {'type': mp.geom_type,'coordinates': mp.coords}
    if len(all_boundaries) > 0:
        (west, south, east, north) = MultiPolygon(all_boundaries).extent
        data_bbox = {'north': north, 'east': east, 'south': south, 'west': west}
    else:
        # The Netherlands
        data_bbox = {'north': 53.63, 'east': 7.58, 'south': 50.57, 'west': 3.04}

    context = {
        'random_string': md5(str(random.random())).hexdigest(),
        'strap_base_layers': _bootstrap(base_layers),
        'strap_layers': _bootstrap(layers),
        'strap_data_bounds': _bootstrap(data_bounds),
        'strap_data_bbox': _bootstrap(data_bbox),
        'threedi_instance': ThreediInstance.objects.all()[0],  # For now, just assign a server 
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
