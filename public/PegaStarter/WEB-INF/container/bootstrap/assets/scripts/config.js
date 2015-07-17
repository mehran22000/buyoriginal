/* ----------------------------------------------------------------------------
 * (c) 2013 Antenna Software.
 * ----------------------------------------------------------------------------
 */

var HC$ = HC$ || {};

HC$.config = {
    mode:            @mode@,
    showLoginScreen: @showLoginScreen@,
    defaultUsername: @defaultUsername@,
    defaultPassword: @defaultPassword@,
    applicationURL:  @applicationURL@,
    localURL: @localURL@,
    gatewayURL: @gatewayURL@,
    partitioning: @partitioning@,
    profileService: {
        url:                  @profileService.url@,
        applicationURLFilter: @profileService.applicationURLFilter@
    },
    updateInterval: @updateInterval@
};

