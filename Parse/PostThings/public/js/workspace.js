/*jslint white: true, browser: true, devel: true, windows: true, forin: true, vars: true, nomen: true, plusplus: true, bitwise: true, regexp: true, sloppy: true, indent: 4, maxerr: 50, unused: false */
/*global Parse: true, require: true, console: true, $: true */

var Post = Parse.Object.extend("Post");
var Comment = Parse.Object.extend("Comment");

var log = function(message) {
    console.log(message);
};

$(function() {
    Parse.initialize("YCEy5Ycyx8DIrfl8Q0AlKsum37OqbCzj4RrI4Vee", "Frs8zBIWKSyVLroYmB7eqoXtP8ryZnKqERsLFGhO");
            
    var fetchPosts = function(limit, skip) {
        // call Cloud Code function to fetch posts
        var params = { limit : limit, skip : skip };
        Parse.Cloud.run('fetchPosts', params, {
            success : function(response) {
                log(response);
                response.posts.forEach(function(post) {
                    $('#message').append("<p>Loaded Post: " + post.id + "</p>");
                });
                // if the full limit was returned there may be more to fetch
                if (response.posts.length === limit) {
                    fetchPosts(limit, skip+limit);
                }
            },
            error : function(error) {
                log(error);
            }
        });
    };
    
    $('#fetchPostsButton').click(function() {
        fetchPosts(2, 0);
        $('#message').empty();
    });
    
});
