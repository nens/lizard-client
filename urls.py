from django.conf.urls import patterns, url

urlpatterns = patterns(
    '',
    url(r'^$', 'lizard_nxt.client.views.index', name='index'),
    url(r'^search/', 'lizard_nxt.client.views.search', name='search'),
    url(r'^jsonp/.*$', 'lizard_nxt.client.views.jsonp_view', name='jsonp'),
)
