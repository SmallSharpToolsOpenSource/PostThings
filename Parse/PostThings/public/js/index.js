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
                if (response.posts.length) {
                    fetchPosts(limit, skip+limit);
                }
                
                response.posts.forEach(function(post) {
                    var postOwner = post.get("owner");
                    $('#posts').append("<p>Post: <b>" + post.get("text") + "</b> by " + 
                                       postOwner.get("username") + "</p>");
                    var tags = response.tags[post.id];
                    var likes = response.likes[post.id];
                    var comments = response.comments[post.id];
                    tags.forEach(function(tag) {
                        $('#posts').append("<p>Tag: " + tag.get("username") + "</p>");
                    });
                    likes.forEach(function(like) {
                        $('#posts').append("<p>Like: " + like.get("username") + "</p>");
                    });
                    comments.forEach(function(comment) {
                        var commentOwner = comment.get("owner");
                        $('#posts').append("<p>Comment: " + comment.get("text") + " (" + 
                                           commentOwner.get("username") + ")</p>");
                    });
                    $('#posts').append("<hr />");
                });
            },
            error : function(error) {
                log(error);
            }
        });
    };
    
    fetchPosts(2, 0);
    
});
