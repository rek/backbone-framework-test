/**
* @package Backbone Framework test.
*
* Mobile Cached Routing
*
* @created_at : 9 Nov 2013
* @author     : rekarnar
*
*/
define ([
        "jquery",
        "backbone"
    ], function(
        $,
        Backbone
    ) {

    var Router = Backbone.Router.extend( {

        initialize: function () {
            // local container for our view caching
            this.viewHolder = {};
        },

        currentView: { 'initial': true, $el: '#home' },

        // Backbone.js Routes
        routes: {
            // When there is no hash bang on the url, the home method is called
            ""                           : "home",
            // NOTE: the :page (#id) must be the view also.
            // EXTRA NOTE: This is not true now, but should be, this is used for one off's.
            ":page/:id"                  : "simple", // simple page
            ":page/:collection/:options" : "generic",// complex page
            ":action"                    : "action", // an action
            "*default"                   : 'comingSoon'
        },

        home: function() {
            // console.log('Default route hit.');

            // so that the menu swipe that checks the currentid will work.
            this.setCurrentView( { id: 'home', $el: '#home' } );
            this.changePage ( '#home' );
        },


        /**
        * Action, for performing a task without a view: Eg logout.
        *
        */
        action: function (action) {
            page = this.parent[action]();
            return this.changePage ("#" + page);
        },

        /**
        * Simple page route, used for: displaying a single listing
        *
        */
        simple: function (page, id) {
            var self = this;
            // console.log('(Router) Single listing simple route matched');

            require (['views/' + page], function (View) {
                self.setCurrentView (new View ({ el: "#" + page, id: id}));
                return self.changePage ("#" + page);
            });
        },

        /**
        * Gerenic route processor: This is the big guy. The power house. The special sauce.
        *
        */
        generic: function (page, collection, options) {
            var self = this;

            $.mobile.loading ("show");

            var key = page + collection + options;

            // check for view (unique for the page and collection)
            var view = this.viewHolder[ key ];

            // if there is no view, or if there is, but cacheing is not allowed for it
            // NOTE: options have not be parsed options yet so we use the string.
            if (!view || ( options.indexOf ('tempview') !== -1 ) ) {
                // console.log('(Router) View not found (or is temp), creating new... ' + key );

                // get the view
                require(['views/' + page], function (View) {
                    // create the view
                    var view = new View ({ el: "#" + page, options: { params: options } });

                    // save the key in case we need to kill it (@see revert)
                    view.info = { k: key, c: collection, o: options};

                    // set it to current. so we can change to it when the view's data arrives (via dispatcher)
                    self.setCurrentView (view);
                    // save the view, so we don't need to make it again
                    self.viewHolder[ key ] = view;

                    // get collection at each view. (do not store them in the view)
                    view.collection = self.parent.cm.get (collection, options);

                    // if it exists, then load it (if not, then hopefully it will load itself when it comes lol)
                    if (_.size (view.collection) !== 0 || view.collection.emptySet === true) { // NOTE: If it is cached and empty we also need to load it, so we check for that too.
                        // console.log('Drawing view with new cached collection');
                        self.renderThenChange();
                    }

                });

            } else { // else load cached view
                // console.log ('(Router) View found successfully: ' + page);

                // ahh our view nicely saved. thanks.
                self.setCurrentView (view);

                // the show it to us
                self.changePage ();
            }
        },

        /**
        * Set the current view
        *
        * But first save the old view
        * removed an old view if there was one
        */
        setCurrentView: function (view) {
            // console.log('(Router) Setting current view: ', view);
            this.prevView = this.currentView;

            // then set the new view to current
            this.currentView = view;
        },

        /**
        * Placeholder
        */
        comingSoon: function () {
            var self = this;
            require (['views/data'], function (DataView) {
                self.setCurrentView (new DataView( { el: "#comingSoon", string: "core.users.count" } ));
                // currentView.model.sync();
                return self.changePage ("#comingSoon");
            });
        },

        /**
        * Revert a page change
        * Used in the case of errors that cannot load a page
        * It destroys the view and collection, forcing a clean check next time.
        * Called from main.js/globalMessage -> if error
        */
        revert: function() {
            // console.log('(Router) Reverting page change');
            // destroy the view
            delete this.viewHolder[this.currentView.info.k]
            // also remove the collection
            this.parent.cm.remove(this.currentView.info.c, this.currentView.info.o);
            // set the current back to what it was
            this.currentView = this.prevView;
            if(this.currentView.info) { // also revert the url
                window.location.href = '#' + this.currentView.info.o;
            }
        },

        /**
        * Render view then change to that page
        *
        * Called from the dispatcher to render whatever when data arrives
        */
        renderThenChange: function () {
            // console.log('(Router) Render then change');
            if (this.currentView instanceof Backbone.View) {
                // now make sure we have the data drawn
                this.currentView.render ();
                // before we change the page, so the jquery mobile renders it good.
                this.changePage ();
            } else {
                console.error ('(Router) Cannot render and change page because current view is not a view.');
            }
        },

        /**
        * Change Page
        *
        * @param id - a html id. eg: #anId
        */
        changePage: function (page) {
            this.parent.dispatcher.trigger ( 'pageChanging' );
            if (!page) page = this.currentView.$el; // use current if not given a page id
            // console.log('(Router) Page changing: ', page);

            // then change the page.
            // $.mobile.changePage (page, { reverse: false, changeHash: false, transition: 'none' });
            $(":mobile-pagecontainer").pagecontainer("change", page, { reverse: false, changeHash: false, transition: 'none' });

            // update the side panel to show logged in or not menus
            this.parent.contextualiseArea ('li');

            // if the old view was not cached, make sure to close it.
            // so check if there was an old view
            // if(this.prevView.el)
                // console.log(this.prevView.el)

            if ((this.prevView && !this.prevView.initial) && (this.prevView.el && this.prevView.el.id != 'home')) {
                // console.log('(Router) Prev view found: ', this.prevView);
                // if we do not cache it
                // if(!this.prevView.cachable()) {
                    // console.log('(Router) Closing old view');
                    // then we need to close it (zombiies)
                    this.prevView.close();
                    this.prevView = null;
                // }
            }
            this.parent.dispatcher.trigger ('pageChanged');
        },

        loadModule: function (module) {
            require([module], function (module) {
                new module ();
            });
        },

        // set our path back the the app
        setContext: function (parent) {
            this.parent = parent;
        },

    } );

    return Router;
} );