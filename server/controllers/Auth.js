const bcrypt = require('bcryptjs')

module.exports = {
  register: async (req, res) => {
    // user input their info: name, email, password
    // check to see if email is already in db, if it is send a 409 status
    // create a salt
    // create a hash from the password and salt
    // store name, email, hash into db

    let db = req.app.get('db')
    let { name, email, password } = req.body

    let clientResponse = await db.getClientByEmail(email)
    let client = clientResponse[0]

    if (client) {
      return res.status(409).send('email already used')
    }

    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(password, salt)

    let createdClient = await db.createClient([name, email, hash])

    let sessionUser = { ...createdClient[0] }

    delete sessionUser.hash

    req.session.client = sessionUser
    res.send(req.session.client)
  },

  login: async (req, res) => {
    // user input: email, password
    // get user from db
    // if no user, send 401 status
    // compare the password and hash using bcrypt
    // if they don't match, send 403

    let db = req.app.get('db')
    let { email, password } = req.body

    let clientResponse = await db.getClientByEmail(email)
    let client = clientResponse[0]

    if (!client) {
      return res.status(401).send('invalid email')
    }

    const isAuthenticated = bcrypt.compareSync(password, client.hash)

    if (!isAuthenticated) {
      return res.status(403).send('incorrect password')
    }

    delete client.hash

    req.session.client = client 
    res.send(req.session.client)
  },

  logout: (req, res) => {
    req.session.destroy()
    res.sendStatus(200)
  }
}