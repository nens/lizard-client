# (c) Nelen & Schuurmans.  GPL licensed, see LICENSE.rst.
# -*- coding: utf-8 -*-
from __future__ import print_function
from __future__ import unicode_literals
from hashlib import md5
import json
import logging
import random

from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.utils.safestring import mark_safe
from rest_framework.renderers import JSONRenderer, BrowsableAPIRenderer

from lizard_nxt.server.models import Layer, LayerGroup
from lizard_nxt.server.serializers import spatial


def _bootstrap(objects):
    return mark_safe(JSONRenderer().render(objects))


def index(request):
    layers = spatial.LayerSerializer(Layer.objects.all()).data
    layer_groups = spatial.LayerGroupSerializer(LayerGroup.objects.all()).data

    context = {
        'random_string': md5(str(random.random())).hexdigest(),
        'strap_layers': _bootstrap(layers),
        'strap_layer_groups': _bootstrap(layer_groups),
        # 'extent': extent,
    }
    return render_to_response('client/index.html', context,
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
