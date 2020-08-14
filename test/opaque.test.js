/*
 *  This is the setup for authenticated PAKE between a client and server.
 *  In this test, a new user approaches the sever and registers an account.
 *  Then the connection is reset, and the user attempts to log in.
 */
var IO = require('./test-io.js');
const OPAQUE = require('../index.js')(IO);

test('end-to-end working flow', done => {
  workflow(true, done)
})

test('end-to-end wrong pass for client authenticate flow', done => {
  workflow(false, done)
})

const workflow = (valid, done) => {
  OPAQUE.then(function (OPAQUE) {

    /*
     *  Client
     */
    const user_id = 'newuser';
    const password = 'correct horse battery staple';
    const wrongPass = 'correct horse battery staples';

    // Sign up
    OPAQUE.client_register(password, user_id).then(console.log.bind(null, 'Registered:'));

    // Log in for the first time and receive a session token
    if (valid) {
      OPAQUE.client_authenticate(password, user_id).then(() => {
        valid && console.log.bind(null, 'Shared secret:');
      });
    } else {
      OPAQUE.client_authenticate(wrongPass, user_id).then(() => {}, () => {
        !valid && done();
      });
    }


    /*
     *  Server
     */
    const database = {};  // Test database to show what user data gets stored

    // Register a new user
    OPAQUE.server_register().then(user => {
      database[user.id] = user.pepper;

      // Handle a login attempt
      let user_id = user.id;
      let pepper = database[user_id];
      OPAQUE.server_authenticate(user_id, pepper).then(token => {
        try {
          valid && expect(token).not.toBeNull();
          done()
        } catch (error) {
          done(error);
        }
      }, error => {
        !valid && expect(error).toBeDefined();
      });
    });

  });
}