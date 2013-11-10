/*jslint indent: 4 */
/*globals $, console */

define([
    "models/authentication"
], function(
    AuthModel
) {

    /**
    * The Mobile Application
    *
    * @created_at : 27 Aug 2013
    *
    */
    var MobileApplication = (function() {

        // console.log('Starting Mobile Application');

        var cm,
            auth,
            router,
            dispatcher,
            self = this;

        var config = {
            key: '',
            url: ''
        }

        var init = function (collectionManager, r) {
            // console.log('(MobileApplication) Init');

            this.cm = collectionManager;
            this.router = r;
            this.router.setContext(this);
            this.dispatcher = _.extend({}, Backbone.Events);

            // so we can fire logout and login requests to the api
            this.auth = new AuthModel(config);
            // TODO: move this into init of auth
            this.auth.setup(config);

            // TODO: init auth state
            //        -add stay logged in flag
            //        -relogin upon app launch
            if(!isAuthenticated())
                window.localStorage.setItem("session", "guest");

            // re-auth has not taken place, using possible old session
            this.auth.stale = true; // <- not used yet

            return setupEvents( this );
        },

        /**
        * Setup the events for this application
        */
        setupEvents = function (self) {
            // console.log('(MobileApplication) Setting up event watchers');

            // watch for updated collections, and change page when that happens
            self.dispatcher.on('dataArrived', self.router.renderThenChange, self.router);
            self.dispatcher.on('loginStateChanged', self.loginStateChanged, self);

            self.dispatcher.on('cm-initalized', function(){
                // console.log('(MobileApplication) CM Init event caught');
                // cache categorys from the start
                // self.cm.get('category');

                // and when cm is ready, lets trigger the app start:
                // KICK IT ALL OFF: (aka start watching for hashchange events)
                Backbone.history.start();

            }, self.cm);

            // self.dispatcher.on('pageChanging', self.updateMenu, self);

            return self;
        },

        /**
        * Things to do after login or logout
        *
        */
        loginStateChanged = function () {
            // console.log('(MobileApplication) Login state changed: Performing state setup');
            // if login has just been done
            if(this.isAuthenticated()) {
                // console.log('(MobileApplication) Login state changed: Authenticated state found');
                // after login, do we want to get favs automatically
                this.cm.get('favorite');

            } else { // if logout has just been done
                console.log('(MobileApplication) Login state changed: Not authenticated');
            }

            this.router.renderThenChange();
        },

        /**
        * NOTE: It would be better to abstract this logic
        * into the auth model, and just call to that from here.
        */
        getUserId = function () {
            if(this.isAuthenticated()) {
                // since user is authed, then local info must exist
                return window.localStorage.getItem("user_id");

            }
            return false;
        },

        /**
        * Authentication check.
        */
        isAuthenticated = function () {
            // our auth is controlled by our localstorage setting.
            return window.localStorage.getItem("session")==='authenticated';
        },

        /**
        * Display a message for 5 seconds on the home page
        *
        * @param message     - string - the message to display
        * @param error       - bool   - true: display an error, false: a notice
        * @param currentPage - bool   - true: display on the current page, false: homepage
        */
        globalMessage = function (message, error, currentPage) {
            // console.log('(Main) Global message called')

            // display on the selected page or on the current page.
            var msgPage = currentPage === true ? this.router.prevView.$el : currentPage;

            var msgDiv = $(msgPage).find( error ? '.error' : '.notice' );

            if (!msgDiv.length) { // if there is not one, lets make one.
                // console.log('(MobileApplication) This page did not have an error or notice div');
                msgDiv = $(msgPage).find('.header').next().prepend('<span class="' + error ? 'error' : 'notice' + '"></span>');
            }

            msgDiv.html(message);

            // and clear both
            setTimeout(function(error) {
                  msgDiv.html('');
            }, 10000);

            // if there is an error, also revert the router
            if (error) {
                this.router.revert();
            }

            return this;
        },

        logout = function () {
            // console.log('(Main): Logout called.')
            this.auth.logout();

            return 'home';
        };

        return {
            init: init,
            cm: cm,
            auth: auth,
            dispatcher: dispatcher,
            config: config,
            loginStateChanged: loginStateChanged,
            globalMessage: globalMessage,

            getUser: getUserId,

            isAuthenticated: isAuthenticated,

            logout: logout
        };

    });

    return MobileApplication;

});