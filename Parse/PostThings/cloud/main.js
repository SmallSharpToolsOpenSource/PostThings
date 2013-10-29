/*jslint white: true, browser: true, devel: true, windows: true, forin: true, vars: true, nomen: true, plusplus: true, bitwise: true, regexp: true, sloppy: true, indent: 4, maxerr: 50, unused: false */
/*global Parse: true, require: true, console: true */

// PT (PostThings)

require('cloud/app.js');

var Post = Parse.Object.extend("Post");
var Comment = Parse.Object.extend("Comment");

var StatusOK = { status : "OK" };

var log = function(message) {
    console.log(message);
};

(function() {
    
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
                return Parse.Promise.as();
            });
        },
        
    };
    
    var CloudCodeFunctions = {
        fetchPosts : function(request, response) {
            var json = {
                posts : [],
                tags : {},
                likes : {},
                comments : {},
                count : 0,
                completed : false,
                limit : (request.params.limit || 100),
                skip : (request.params.skip || 0)
            };
            
            var handleSuccess = function() {
                json.completed = json.posts.length === json.count;
                response.success(json);
            };
            
            var handlerError = function(error) {
                response.error(error);
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
        }
    };
    
    var CloudCodeJobs = {
        
        createSampleData : function(request, status) {
            Parse.Cloud.useMasterKey();
            
            var handleSuccess = function() {
                status.success("Work completed");
            };
            
            var handleError = function(error) {
                status.error(error);
            };

            // 1) Create accounts
            // 2) Create posts
            // 3) Add tags for posts (relation for Parse.User)
            // 4) Add likes for posts (relation for Parse.User)
            // 5) Add comments (Comments objects with Post as pointer)
            
            var users = {};
            
            var createAccounts = function() {
                return Parse.User.signUp("user1", "badpassword").then(function(user) {
                    users.user1 = user;
                    return Parse.User.signUp("user2", "badpassword");
                }).then(function(user) {
                    users.user2 = user;
                    return Parse.User.signUp("user3", "badpassword");
                }).then(function(user) {
                    users.user3 = user;
                    return Parse.Promise.as();
                });
            };
            
            var createPosts = function() {
                
                // create 2 posts for each user
                
                var count = 1;
                
                var createPost = function(owner) {
                    var post = new Post();
                    post.set("count", count);
                    post.set("text", "Post " + count);
                    post.set("owner", owner);
                    var acl = new Parse.ACL(owner);
                    acl.setPublicReadAccess(true);
                    post.setACL(acl);
                    count++;
                    return post.save();
                };
                
                return createPost(users.user1).then(function() {
                    return createPost(users.user1);
                }).then(function() {
                    return createPost(users.user2);
                }).then(function() {
                    return createPost(users.user2);
                }).then(function() {
                    return createPost(users.user3);
                }).then(function() {
                    return createPost(users.user3);
                }).then(function() {
                    return Parse.Promise.as();    
                });
            };
            
            var createTags = function() {
                // each post is tagged by the 2 users which are not the owner of the post
                
                var addTagsToPost = function(count, tags) {
                    var query = new Parse.Query(Post);
                    query.equalTo("count", count);
                    return query.each(function(post) {
                        tags.forEach(function(tag) {
                            post.relation("tags").add(tag);
                        });
                        return post.save();
                    });
                };
                
                return addTagsToPost(1, [users.user2, users.user3]).then(function() {
                    return addTagsToPost(2, [users.user2, users.user3]);
                }).then(function() {
                    return addTagsToPost(3, [users.user1, users.user3]);
                }).then(function() {
                    return addTagsToPost(4, [users.user1, users.user3]);
                }).then(function() {
                    return addTagsToPost(5, [users.user1, users.user2]);
                }).then(function() {
                    return addTagsToPost(6, [users.user1, users.user2]);
                });
            };
            
            var createLikes = function() {
                // each post is liked by the 2 users which are not the owner of the post
                
                var addLikesToPost = function(count, likes) {
                    var query = new Parse.Query(Post);
                    query.equalTo("count", count);
                    return query.each(function(post) {
                        likes.forEach(function(like) {
                            post.relation("likes").add(like);
                        });
                        return post.save();
                    });
                };
                
                return addLikesToPost(1, [users.user2, users.user3]).then(function() {
                    return addLikesToPost(2, [users.user2, users.user3]);
                }).then(function() {
                    return addLikesToPost(3, [users.user1, users.user3]);
                }).then(function() {
                    return addLikesToPost(4, [users.user1, users.user3]);
                }).then(function() {
                    return addLikesToPost(5, [users.user1, users.user2]);
                }).then(function() {
                    return addLikesToPost(6, [users.user1, users.user2]);
                });
            };
            
            var createComments = function() {
                // each post is commented on by the 2 users which are not the owner of the post
                
                var addCommentToPost = function(count, text, owner) {
                    var query = new Parse.Query(Post);
                    query.equalTo("count", count);
                    return query.each(function(post) {
                        var comment = new Comment();
                        comment.set("text", text);
                        comment.set("owner", owner);
                        comment.set("post", post);
                        var acl = new Parse.ACL(owner);
                        acl.setPublicReadAccess(true);
                        comment.setACL(acl);
                        return comment.save();
                    });
                };
                
                return addCommentToPost(1, "A comment", users.user2).then(function() {
                }).then(function() {
                    return addCommentToPost(1, "A comment", users.user3);
                }).then(function() {
                    return addCommentToPost(2, "A comment", users.user2);
                }).then(function() {
                    return addCommentToPost(2, "A comment", users.user3);
                }).then(function() {
                    return addCommentToPost(3, "A comment", users.user1);
                }).then(function() {
                    return addCommentToPost(3, "A comment", users.user3);
                }).then(function() {
                    return addCommentToPost(4, "A comment", users.user1);
                }).then(function() {
                    return addCommentToPost(4, "A comment", users.user3);
                }).then(function() {
                    return addCommentToPost(5, "A comment", users.user1);
                }).then(function() {
                    return addCommentToPost(5, "A comment", users.user2);
                }).then(function() {
                    return addCommentToPost(6, "A comment", users.user1);
                }).then(function() {
                    return addCommentToPost(6, "A comment", users.user2);
                });
            };
            
            createAccounts().
                then(createPosts).
                then(createTags).
                then(createLikes).
                then(createComments).
                then(handleSuccess, handleError);
        },
        
        purgeSampleData : function(request, status) {
            Parse.Cloud.useMasterKey();
            
            var handleSuccess = function() {
                status.success("Work completed");
            };
            
            var handleError = function(error) {
                status.error(error);
            };
            
            // 1) Purge Comment objects
            // 2) Purge Post objects
            // 3) Purge all users
            
            var purgeComments = function() {
                var query = new Parse.Query(Comment);
                return query.each(function(comment){
                    return comment.destroy();
                });
            };
            
            var purgePosts = function() {
                var query = new Parse.Query(Post);
                return query.each(function(post){
                    return post.destroy();
                });
            };
            
            var purgeUsers = function() {
                var query = new Parse.Query(Parse.User);
                return query.each(function(user){
                    return user.destroy();
                });
            };
            
            purgeComments().
                then(purgePosts).
                then(purgeUsers).
                then(handleSuccess, handleError);
        }
        
    };
    
    var key;
    for (key in CloudCodeFunctions) {
        Parse.Cloud.define(key, CloudCodeFunctions[key]);
    }
    
    for (key in CloudCodeJobs) {
        Parse.Cloud.job(key, CloudCodeJobs[key]);
    }

}());
