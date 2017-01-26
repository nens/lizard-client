/**
 * The global state.
 *
 * Lizard does not heavily rely on angulars scope inheritance
 * instead it stores state in a service. As a result state is injectable.I do
 * feel like it is better to only inject State in lizard-nxt-mastercontroller
 * and pass it around explicitly using isolated scopes in directives.
 *
 * See: https://docs.angularjs.org/guide/directive
 *
 * Contrary to Flux/React et al. Angular uses MVC with two way data-binding and
 * it does mutate the state. Some pieces of functionality use a pattern of
 * Object.defineProperty('state.property', 'property') with setters to
 * trigger side effects when state.property.property changes. Redefining
 * State.property will mess this up, so do not do this. For example of this
 * pattern, see data-service or timeseries-service. To completely change the
 * whole state at once, use FavouriteService.applyFavourite.
 */
angular.module("global-state", []);
