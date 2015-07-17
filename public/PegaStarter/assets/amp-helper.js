/* ----------------------------------------------------------------------------
 * (c) 2013-2014 Antenna Software.
 * ---------------------------------------------------------------------------- */

/**
 * Helper for detecting browser and lite containers.
 * <ul>
 *   <li>For Android/iOS containers, do not attach any scripts or configure ACF as it is already done.</li>
 *   <li>For browsers, you need to attach the WebAPI script (it will happen automatically on AMP$.init() call) and configure ACF.</li>
 * </ul>
 */
var AMP$ = {

    /**
     * Asynchronously loads WebAPI scripts, if needed (when running the application in a browser).
     */
    init: function() {
        this._loadWebAPI();
    },

    /**
     * Verifies if the application is running on the Windows Phone platform.
     * @returns {boolean}
     */
    isRunningOnWindowsPhone: function() {
        return navigator.userAgent.search("Windows Phone 8") >= 0;
    },

    /**
     * Verifies if the application is running in the Android/iOS container.
     * It is done by checking the UserAgent value of the running instance. Android/iOS containers use the
     * "AmpWebControl" value. The method returns "true" only when the web application is running in AMP
     * Hybrid Client (Android and iOS containers are supported for now, it will falsely return "false" for WP8/BB10)
     * @returns {boolean}
     */
    isRunningInContainer: function() {
        return navigator.userAgent.search("AmpWebControl") >= 0 || this.isRunningOnWindowsPhone();
    },

    /**
     * Appends the WebAPI script tag to the document.
     * @private
     */
    _loadWebAPI: function() {
        if (!this.isRunningInContainer()) {
            var script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", "./assets/amp-webapi.js");
            document.getElementsByTagName("head")[0].appendChild(script);
        }
    }

};

/**
 * Calls AMP initializer.
 * If the application is not running in AMP Hybrid Client, it appends the WebAPI script tag (from the
 * hardcoded location - ./assets/amp-webapi.js) and loading is done asynchronously.
 */
AMP$.init();
