/**
* @package Backbone Framework test.
*
* Collection Manager
* Cache for collections and also some models thesedays.
* Used as the manager to efficiently source collections for views. Either loading directly or from cache.
*
* @created_at : 9 Nov 2013
* @author     : rekarnar
*
*/
var collectionManager = (function() {

    var constructors = {}

    var modelCache = {}
    var collectionCache = {};
    var selectedCollection = {};

    function init(){
        require([
            "collections/testCollection",
        ], function(
            test,
        ) {
            constructors.test = test;

            biddyMobileApplication.dispatcher.trigger('cm-initalized');
        });

        return this;
    };

    /**
    * Take the string of options and return an associative array
    *
    * @param string - cat-2-tempview-1
    *
    * @return array - { cat: "2", tempview: "1" }
    *
    * Note: also for non dashed string: 2 -> { 0: "2" }
    */
    function processOptions(options) {
        // console.log("Collection Manager starting to process options: ", options);
        // process options if we need to.

        if(options && typeof options === 'string' && options.indexOf('-') !== -1) {
            // console.log('Processing options for view (in router)');
            processedOptions = {};
            s = options.split('-');
            for(var i = 0; i < s.length; i++) {
                next = parseInt ( i + 1 );
                if(s[next])
                    processedOptions[s[i++]] = s[next];
            }
        } else { processedOptions = options }

        return $.extend( { }, processedOptions );
    };

    /**
    * If we do not have a ref to these models. save them.
    */
    function saveModel(model) {
        // console.log('Saving model: ' + model.id)
        if(!modelCache[model.id]) modelCache[model.id] = model;
    }

    /**
    * Get a model from the cache.
    */
    function getModel(id) {
        // console.log('Getting model: ' + model.id)
        return modelCache[id] ? modelCache[id] : null;
    }

    /**
    * Takes a collection, and call's the saveModel function on each of its models.
    */
    function cacheCollectionsModels(collection) {
        // if called from even, then the context is the collection
        var collectionToCache = collection ? collection : this;
        // console.log('Beginning cache on models of collection: ...', collectionToCache);
        // TODO: if this is ever called directly, we need to make the call to saveModel work
        // its setup to only work when called from the event (below), and thus the ref to this is changed
        _.each(collectionToCache.models, this.manager.saveModel);
    }

    /*
    * Get the key for the collection based upon the options
    */
    function _getKey(rawOptions, objectOptions) {
        var options = processOptions( rawOptions );
        options = $.extend(options, ( objectOptions || {} ));
        // console.log('Getting collection (' + name + ') with options: ', options);

        // we don't want this stuff in the key, since we want both ways to use this collection. (@see favoriteCollection)
//todo^
        rawOptions = ( typeof rawOptions == 'object' ) ? JSON.stringify(rawOptions) : ( rawOptions || "" );
        // make all category keys the same
        // rawOptions = rawOptions.indexOf('category') != 0 ? 'category' : rawOptions;
        // create the unique key for this collection
        var key = name+rawOptions.replace('-updateView-1','');

        return { options: options, key: key };
    }

    /**
    * Un-cache a collection
    */
    function remove(name, rawOptions, objectOptions) {
        var options = _getKey(rawOptions, objectOptions);
        delete collectionCache[options.key];
    }

    /**
    * Main method - Get a collection
    */
    function get(name, rawOptions, objectOptions) {
        var o = _getKey(rawOptions, objectOptions);
        // console.log('(CM) Options: ', o);
        var options = o.options;
        var key = o.key;

        // TODO: might need to check this works, called when clicking a link to logon
        if( options.nocollection == 1 ) return { 'Fake collection': true };

        if(!collectionCache[key] || ( options.tempcol == 1 ) ) {
            // console.log('(Collection manager) Collection not found, creating new: ' + key);
            // this is the awesome, make our new collection:
            var collection = new constructors[name]( [], options );

            // this is crap. find a new way later on. perhaps a flag in the INIT constructor stuff!!!! <-good
            if( name != 'category' ) { // cache models of non categories.
                // console.log('(Collection manager) Adding cache event on "added" trigger');
            // if( name == 'listings' || name == 'featured' || name == 'search' ) // cache the models of this collection
                collection.manager = this; // pass in ref back to us.
                collection.on('addToCache', cacheCollectionsModels, collection);
            }

            // BUG: reset the page on new collections, since im not sure why BiddyCollection acts like a shared class?
            collection.api.page = 0;

            // used in manual fetching, eg: categories
            options.fetch = false;
            if(!collection.manualFetch) {
                options.fetch = true; //fetch: true
                collection.fetch(options);
            }

            collectionCache[key] = collection;
        } else {
            // console.log('(Collection manager) Using cached collection: ' + key);
        }

        // now we know the collection is there, we can assign it
        selectedCollection = collectionCache[key];

        // If the collection from our cache (aka not from the server) is empty, mark it.
        // This is so that the router will deal with it properly,
        // not thinking that it is just waiting for the server to return a response.
        if(!options.fetch && selectedCollection.length === 0) {
            // console.error('(Collection manager) Returning an empty collection');
            selectedCollection.emptySet = true;
        }

        return selectedCollection;
    }

    return {
        init: init,
        getModel: getModel,
        saveModel: saveModel,
        get: get,
        remove: remove
    }

})();