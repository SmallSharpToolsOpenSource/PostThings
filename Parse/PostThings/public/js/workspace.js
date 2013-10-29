/*jslint white: true, browser: true, devel: true, windows: true, forin: true, vars: true, nomen: true, plusplus: true, bitwise: true, regexp: true, sloppy: true, indent: 4, maxerr: 50, unused: false */
/*global Parse: true, require: true, console: true, $: true */

var Post = Parse.Object.extend("Post");
var Comment = Parse.Object.extend("Comment");

var log = function(message) {
    console.log(message);
};

$(function() {
    Parse.initialize("YCEy5Ycyx8DIrfl8Q0AlKsum37OqbCzj4RrI4Vee", "Frs8zBIWKSyVLroYmB7eqoXtP8ryZnKqERsLFGhO");
    
    // Helper functions in PT namespace
    var PT = {
        
        eachItem : function (items, callback) {
            var index = 0;
            var promise = new Parse.Promise();
            
            var continueWhile = function(nextItemFunction, asyncFunction) {
                var item = nextItemFunction();
                if (item) {
                    asyncFunction(item).then(function() {
                        continueWhile(nextItemFunction, asyncFunction);
                    });
                }
                else {
                    promise.resolve();
                }
            };
            
            var nextItem = function() {
                if (index < items.length) {
                    var item = items[index];
                    index++;
                    return item;
                }
                else {
                    return null;
                }
            };
            
            continueWhile(nextItem, callback);
            
            return promise;
        },
    
        arrayContainsItem : function(array, item) {
            // True if item is in array
            var i = array.length;
            while (i--) {
                if (array[i] === item) {
                    return true;
                }
            }
            return false;
        },
        
        arrayContainsOtherArray : function(array, otherArray) {
            /// True if each item in other array is in array
            var i = otherArray.length;
            while (i--) {
                if (!PT.arrayContainsItem(array, otherArray[i])) {
                    return false;
                }
            }
            return true;
        },

        fetchPostTags : function(post) {
            return post.relation("tags").query().find();
        },
        
        fetchPostLikes : function(post) {
            return post.relation("likes").query().find();
        },

        fetchPostComments : function(post) {
            var query = new Parse.Query(Comment);
            query.equalTo("post", post);
            return query.find();
        },
        
        fetchPostDetails : function(post, json) {
            json.tags[post.id] = [];
            json.likes[post.id] = [];
            json.comments[post.id] = [];
            
            return PT.fetchPostTags(post).then(function(tags) {
                json.tags[post.id] = tags;
                return PT.fetchPostLikes(post);
            }).then(function(likes) {
                json.likes[post.id] = likes;
                return PT.fetchPostComments(post);
            }).then(function(comments) {
                json.comments[post.id] = comments;
                json.count++;
                log("Detail Work Finished for Post: " + post.get("text"));
                return Parse.Promise.as();
            });
        },
        
    };
    
    var fetchPostsLocally = function(limit, skip) {
        
        var json = {
            posts : [],
            tags : {},
            likes : {},
            comments : {},
            count : 0,
            completed : false,
            limit : (limit || 100),
            skip : (skip || 0)
        };
        
        var handleSuccess = function() {
            log("handleSuccess");
            json.completed = json.posts.length === json.count;
            log({length:json.posts.length,count:json.count});
            log(json);
            
            if (!json.completed) {
                $('#message').append("<p>Response data is incomplete.</p>");
            }
            json.posts.forEach(function(post) {
                $('#message').append("<p>Post: " + post.get("text") + "</p>");
            });
            // if the full limit was returned there may be more to fetch
            if (json.posts.length === limit) {
                fetchPostsLocally(limit, skip+limit);
            }
        };
        
        var handlerError = function(error) {
            log(error);
        };
        
        var fetchDetails = function(post) {
            return PT.fetchPostDetails(post, json);
        };
        
        var query = new Parse.Query("Post");
        query.descending("createdAt");
        query.limit(json.limit);
        query.skip(json.skip);
        query.find().then(function(posts) {
            json.posts = posts;
            return PT.eachItem(posts, fetchDetails);
        }).then(handleSuccess, handlerError);
    };
    
    var fetchPostsViaCloudCode = function(limit, skip) {
        // call Cloud Code function to fetch posts
        var params = { limit : limit, skip : skip };
        Parse.Cloud.run('fetchPosts', params, {
            success : function(response) {
                log(response);
                if (!response.completed) {
                    $('#message').append("<p>Response data is incomplete.</p>");
                }
                response.posts.forEach(function(post) {
                    $('#message').append("<p>Loaded Post: " + post.id + "</p>");
                });
                // if the full limit was returned there may be more to fetch
                if (response.posts.length === limit) {
                    fetchPostsViaCloudCode(limit, skip+limit);
                }
            },
            error : function(error) {
                log(error);
            }
        });
    };
    
    $('#fetchPostsLocallyButton').click(function() {
        fetchPostsLocally(2, 0);
        $('#message').empty();
    });
    
    $('#fetchPostsViaCloudCodeButton').click(function() {
        fetchPostsViaCloudCode(2, 0);
        $('#message').empty();
    });
    
});
