var path            = require('path');
var mongoose        = require('mongoose'), Schema = mongoose.Schema;
var bcrypt          = require('bcrypt-nodejs');
var jwt             = require('jwt-simple');
var constants       = require('../scripts/constants');
var config          = require(path.join(constants.paths.config, '/config'));
var secure          = require(path.join(constants.paths.scripts, '/secure'));
var groupSchema     = require('./group');

var Token = mongoose.Schema({
    token           : {type: String},
    dateCreated     : {type: Date, default: Date.now},
});

Token.statics.hasExpired= function(created) {
    var now = new Date();
    var diff = (now.getTime() - created);
    return diff > config.get('auth.ttl');
};

var TokenModel = mongoose.model('Token', Token);

// define the schema for our user model
var userSchema = mongoose.Schema({
    name             : {
      prefix         : { type: String, trim: true },
      first          : { type: String, trim: true, required: true },
      middle         : { type: String, trim: true },
      last           : { type: String, trim: true, required: true },
      suffix         : { type: String, trim: true }
    },
    email            : { type: String, trim: true, required: true },
    avatar           : { type: String, trim: true },
    summary          : { type: String, trim: true },
    jobTitle         : { type: String, trim: true },
    organization     : { type: String, trim: true },
    orgRef           : { type: Schema.Types.ObjectId, ref: 'client' },
    association      : {type: String, enum: ['employee', 'partner', 'customer', 'contractor'], trim: true },
    socialProfile    : [{
      handle         : { type: String, trim: true },
      network        : { type: String, trim: true }
    }],
    contactNo        : [{
      contactNumber         : { type: String, trim: true },
      contactType           : { type: String, trim: true }
    }],
    stats            : {
      dateCreated    : { type: Date},
      dateLastLogin  : { type: Date}
    },
    preferences      : {
      language       : { type: String, trim: true }
    },
    local            : {
        email        : { type: String, trim: true, required: true },
        password     : { type: String, trim: true, required: true }
    },
    facebook         : {
        id           : { type: String, trim: true },
        token        : { type: String, trim: true },
        email        : { type: String, trim: true },
        name         : { type: String, trim: true }
    },
    twitter          : {
        id           : { type: String, trim: true },
        token        : { type: String, trim: true },
        displayName  : { type: String, trim: true },
        username     : { type: String, trim: true }
    },
    google           : {
        id           : { type: String, trim: true },
        token        : { type: String, trim: true },
        email        : { type: String, trim: true },
        name         : { type: String, trim: true }
    },
    token            : {type: Object},
    status           : {type: String, default: 'Active'},
    memberOf         : [{ type: Schema.Types.ObjectId, ref: 'group' }]

});

// Execute before each user.save() call
userSchema.pre('save', function(callback) {
    var user = this;

    // Break out if the password hasn't changed
    //if (!user.isModified('password')) return callback();
    this.token = genToken();
    callback();

  // Password changed so we need to hash it
/*  bcrypt.genSalt(5, function(err, salt) {
    if (err) return callback(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return callback(err);
      user.password = hash;
      callback();
    });
  });*/
});

userSchema.post('init', function(doc) {
  if(doc.avatar === undefined){
    // doc.avatar = "/public/assets/g/imgs/avatar.jpg";
    doc.avatar = "/public/assets/g/imgs/generic.png";
  }
	doc.set('groups', secure.getGroups(doc),  { strict: false });
});

userSchema.post('find', function(result) {
  //console.log(this instanceof mongoose.Query); // true
  // prints returned documents
  //console.log('find() returned ' + JSON.stringify(result));
	// console.log(result);
	// result.set('groups', secure.getGroups(result),  { strict: false });
  // prints number of milliseconds the query took
  //console.log('find() took ' + (Date.now() - this.start) + ' millis');
});

// exclude unwanted and sensitive data from exposed results
userSchema.methods.toJSON = function() {
  var obj = this.toObject();
  delete obj.local;
  delete obj.facebook;
  delete obj.twitter;
  delete obj.google;
  return obj;
}

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// private method
function genToken() {
  var expires = expiresIn(config.get('auth.expires'));
  var token = jwt.encode({
    exp: expires
  }, config.get('auth.secret'));

  return {
    token: token,
    dateCreated: new Date()
  };
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
module.exports.Token = TokenModel;
