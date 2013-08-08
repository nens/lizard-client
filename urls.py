from django.conf.urls import url, patterns
from django.conf.urls.defaults import include

urlpatterns = patterns('',
    url(r'^$', 'lizard_nxt.client.views.index', name='index'),
    url(r'^search/', 'lizard_nxt.client.views.search', name='search'),
    url(r'^jsonp/.*$', 'lizard_nxt.client.views.jsonp_view', name='jsonp'),
)
