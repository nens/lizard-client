from django.conf.urls import url, patterns
from django.conf.urls.defaults import include

urlpatterns = patterns('',
    url(r'^$', 'client.views.index', name='index'),
    url(r'^search/', 'client.views.search', name='search'),
    url(r'^jsonp/.*$', 'client.views.jsonp_view', name='jsonp'),
)
