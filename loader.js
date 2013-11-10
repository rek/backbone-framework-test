/**
* @package Backbone Framework test.
*
* Library Setup
*
* @created_at : 9 Nov 2013
* @author     : rekarnar
*
*/
require.config( { // Sets the require.js configuration for your application.
    paths: { // 3rd party script alias names (Easier to type "jquery" than "libs/jquery-1.8.2.min")

        // Core Libraries
        jquery        : "libs/jquery-1.10.2.min",
        jquerymobile  : "libs/jquery.mobile-1.4.0-rc.1.min",
        underscore    : "libs/lodash.underscore.min",
        backbone      : "libs/backbone.min",
        moment        : "libs/moment.min",
        l10n          : "libs/l10n"

        // ,fb            : "libs/facebook/FacebookConnect"
    },
    shim: { // Sets the config for third party scripts that are not AMD compatible

        backbone: {
            deps    : [ "underscore", "jquery" ],
            exports : "Backbone"  //attaches "Backbone" to the window object
        }

    } // end Shim Configuration
} );

require(['main'], function(main) {
    // console.log('(Loaded) Application loaded');
});