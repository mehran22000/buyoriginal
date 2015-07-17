/* ----------------------------------------------------------------------------
 * (c) 2013-2014 Antenna Software.
 * ---------------------------------------------------------------------------- */

/**
 * Configuration object, to be used when running in a web browser.
 */
var Application$Config = {

    /**
     * A configuration object that should be used by ACF implementation when running in the browser.
     * @type {*|{gatewayUrl: string, masterConnectionOwner: object}}
     */
    acfConfig: {
        gatewayURL : 'ws://example.ampchroma.com:8081' // ASE gateway url.
    },

    /**
     * ACF Credentials configuration that should be used by ACF implementation when running in the browser.
     * @type {*|{userId: string, password: string, deviceId: string}}
     */
    acfCredentials: {
        userId:   'username',             // User identifier
        password: 'password',             // User password
        deviceId: 'imei:000000000000000'  // Device identifier
    }

};
