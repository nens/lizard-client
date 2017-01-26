angular.module('lizard-nxt')

.value('user', {})

.value('version', {})

.value('debug', false)

/**
 * @name notie
 * @memberOf app
 * @description Notification service
 */
.constant('notie', window.notie)

/**
 * @name production backend
 * @memberOf app
 * @description subdomain of production backend.
 */
.constant('backendDomain', 'https://demo.lizard.net');
