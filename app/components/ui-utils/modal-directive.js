/**
 * Wrapper around bootstrap modal.
 * There is a MotherModal that provides a skeleton.
 * The skeleton is now supplemented with the right contents if you
 * start the following directive:
 * <ui-modal></ui-modal>
 * The state as well as the templateName are in the
 * state service.
 */

angular.module('ui-utils').directive('uiModal', [
  'State',
  '$compile',
  '$templateCache',
  '$q',
  '$http',
  function (State, $compile, $templateCache, $q, $http) {
    var snippet;

    /**
    * Get template, either from cache or URL,
    * it returns a promise with a template.
    * @param {string} templateUrl - expects the url that it should get here.
    * @return {object} thennable promise
    */
    var getTemplate = function (templateUrl) {
      var deferred = $q.defer();

      snippet = $templateCache.get(templateUrl);

      if (snippet) {
        deferred.resolve(snippet);
      } else {
        $http.get(templateUrl).
          then(function (response) {
            // only return the html stuff
            return deferred.resolve(response.data);
          });
      }
      return deferred.promise;
    };

    var oldScope;

    /**
    * Replace the content with the template
    * @param {string} templateUrl - url of template
    * @param {object} element - element that should display new template
    * @param {object} scope - context of template
    * @return {void}
    */
    var replaceTemplate = function (templateUrl, element, scope) {
      getTemplate(templateUrl)
      .then(function (response) {
        // The local scope contained in this snippet
        // needs destruction
        if (oldScope) { oldScope.$destroy(); }

        // The snippet loaded from the templateCache
        // is used to replace the current content
        snippet = response;
        $templateCache.put(templateUrl, response);
        $(element).html(snippet);

        // newly created scope for this particular piece of html
        // needs 'compilation' for it to be picked up by ng
        var newScope = scope.$new();
        $compile(element.contents())(newScope);
        oldScope = newScope;

        return true;
      });
    };


    /**
     * replaceTitle - Replace the title of the modal
     *
     * @param  {title} title description
     */
    var replaceTitle = function (title, element) {
      $(element).find('.modal-title').html(title);
    };

    var link = function (scope, el) {
      scope.$watch(State.toString('modal.templateBody'),
      function (n) {
        if (n) {
          var templateBodyUrl = '/components/' + State.modal.templateBody + '.html';
          replaceTemplate(templateBodyUrl, $(el).find('.modal-body'), scope);
        }
      });

      scope.$watch(State.toString('modal.templateFooter'),
      function (n) {
        if (n) {
          var templateFooterUrl = '/components/' + State.modal.templateFooter + '.html';
          replaceTemplate(templateFooterUrl, $(el).find('.modal-footer'), scope);
        }
      });

      scope.$watch(State.toString('modal.title'),
      function () {
        replaceTitle(State.modal.title, el);
      });

      scope.$watch(State.toString('modal.active'),
      function (n, o) {
        if (n === o) { return; }
        var mode = (State.modal.active) ? 'show' : 'hide';
        $(el).modal(mode);
      });

      scope.closeModal = function () {
        State.modal.active = false;
      };

      // ensures there is no conflict between Bootstrap set state and ng internals
      el.on('hide.bs.modal', function () {
        if (State.modal.active) {
          State.modal.active = false;
        }
      });
    };

    return {
      link: link,
      templateUrl: 'ui-utils/modal-base.html',
      restrict: 'E',
      replace: true
    };
  }
]);
