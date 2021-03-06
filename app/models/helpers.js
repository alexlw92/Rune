var User = require('./user.js');
var Project = require('./project.js');
var async = require('async');
var request = require('request');

// Check if user is logged in, redirect to error page if they aren't
module.exports.isLoggedIn = function(req, res, callback) {
    if (req.isAuthenticated()) {
        return callback();
    } else {
        res.redirect('/login');
    }
};

// Make sure that if the user url is manually entered, that it exists
module.exports.doesUserExist = function(req, res, callback) {
    User.findOne({'local.userid': req.params.userid}, function(err,user){
        if (err)
            throw err;
        else if (!user) {
            req.flash('errorMessage', 'User does not exist');
            res.redirect('/error');
        } else {
            return callback();
        }
    });
},

// Only the logged in user can edit their own profile
module.exports.canUserEditProfile = function(req, res, callback) {
    if (req.params.userid === req.user.local.userid) {
        return callback();
    } else {
        req.flash('errorMessage', 'Can only edit own account');
        res.redirect('/error');
    }
};

//Find the current user and make sure they're part of the project being accessed
module.exports.isUserProjectMember = function(req, res, callback) {
    Project.findOne({
        'members': req.user.local.email,
        'projectid': req.params.projectid
    }, function(err,user) {
        if (err) {
            throw err;
        } else if (!user) {
            req.flash('errorMessage', 'Not a member of project');
            res.redirect('/error');
        } else {
            return callback();
        }
    });
};

//Make sure that if the project url is manually entered, that it exists
module.exports.doesProjectExist = function(req, res, callback) {
    Project.findOne({'projectid': req.params.projectid}, function(err, proj){
        if (err) {
            throw err;
        } else if (!proj) {
            req.flash('errorMessage', 'Project does not exist');
            res.redirect('/error');
        } else {
            return callback();
        }
    });
};

// Check if HTTP request made is from AJAX or not.
module.exports.isAjaxRequest = function(req, res, callback) {
    if (req.xhr)
        return callback();
    else {
        res.redirect('/error');
    }
},

// This is used to pad the task number with 0s. For example, it creates JIRA-001
module.exports.zeroPad = function(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
};

// Get a list of project members of a given project.
module.exports.getProjectMemberList = function(projectid, done) {
    async.waterfall([
        // Look for the project to make sure it exists
        function getProjectById(callback) {
            Project.findById(projectid, function(err, foundProj) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, foundProj);
                }
            });
        },
        function findUsers(foundProj, callback) {
            User.find( {'local.email' : {$in : foundProj.members} }, function(err, users) {
                if (err) {
                    callback(err);
                } else {
                    var usersList = [];
                    for (var i = 0; i < users.length; i++) {
                        usersList.push({
                            'name': users[i].local.firstname + ' ' + users[i].local.lastname,
                            'email': users[i].local.email,
                            'color': users[i].local.userColor
                        });
                    }
                    callback(null, usersList);
                }
            });
        }
    ], function(err, usersList) {
        if (err) {
            done(err);
        } else {
            //console.log(userList);
            done(null, usersList);
        }
    });
};
