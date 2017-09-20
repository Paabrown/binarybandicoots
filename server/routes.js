const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session')
const Promise = require('bluebird');
const app = express();
const db = require('../db/db.js');
const Item = require('../db/itemModel.js');
const Event = require('../db/eventModel.js');
const Account = require('../db/accountModel.js');
const algorithm = require('./kennysMagicalAlgorithm.js');

app.use(bodyParser.json());

app.use(cors());

app.use(session({
  secret: 'peal-mall',
  cookie: { maxAge: 60000 }
}));

app.use(express.static('client'));

//Router



//API

app.post('/meals', (req, res) => {
  // We first create a new Event document in order to generate a unique Primary Key for each Item document in the Items table
  // If an Event Name was specified by the Organizer, use that; otherwise use an empty string
  Event.create({
    eventName: req.body.eventName || ' '
  })
  // Using the Document returned by Event.create, insert each Item into the database
  .then(event => {
    return Promise.all(req.body.receiptItems.map(item => {
      return Item.create({
        eventID: event._id,
        itemName: item.itemName,
        quantity: item.quantity || 1,
        price: item.price
      });
    }))
  })
  // When ALL items have been inserted (hence Promise.all), send the Response back to the client-side
  .then(insertedItems => {
    res.send(200, insertedItems[0].eventID);
  })
  .catch(err => res.send('Database insertion error:', err));
});

app.get('/meals*', (req, res) => {
  Item.find({ eventID: req.url.slice(7) })
    .then(items => res.send(items))
    .catch(err => res.send('Database retrieval error:', err));
});

app.post('/share', (req, res) => {
  console.log('req.body /share', req.body);
  Promise.all(req.body.receiptItems.map(item => {
    let query = { _id: item };
    let update = { $push: { shares: req.body.diner } };
    let options = { new: true };
    return Item.findOneAndUpdate(query, update, options);
  }))
    .then(updatedItems => res.send(updatedItems))
    .catch(err => res.send('Database update error:', err));
});

app.get('/receipt*', (req, res) => {
  let event = req.url.slice(9)

  Item.find({eventID: event})
    .then(items => {
      let receiptTotals = algorithm.calculateTotals(items);
      res.send(receiptTotals);
    })
});

// LOGIN/SIGNUP

app.post('/accounts', (req, res) => {
  console.log('POST /accounts, req.body=', req.body);
  var {username, password} = req.body;

  Account.findOne({ username: username })
  .then(account => {
    if (account) { 
      // consider how to handle this
      res.status(202).send('this username already exists!')
    } else {
      Account.create({ username: username, password: password})
      .then(acct => {
        req.session.account = acct._id;
        res.status(201).send(acct)
      })
      .catch(err => res.status(404).send('/accounts post error when trying to add acct:' + err))
    }
  })
  .catch(err => res.send('/accounts post error when looking for pre-existing account:' + err));
})

app.post('/login', (req, res) => {
  console.log('POST /login, req.body=', req.body);
  var {username, password} = req.body;

  Account.findOne({ username: username, password: password })
  .then(acct => {
    if (acct) {
      req.session.account = acct._id;
      res.redirect('/profile')
    } else {
      res.status(202).send('this is an incorrect login');
    }
  })
  .catch(err => res.send('/login post error when looking for pre-existing account:' + err));
})

app.post('/receipt', (req, res) => {
  console.log('POST /receipt, req.body=', req.body);
  var {mealid, timestamp} = req.body;
  var accountId = req.session.account

  if (accountId) {
    Account.addReceipt(accountId, {mealId: mealid, timeStamp: timestamp})
    .then(acct => res.redirect('/profile?' + accountId))
    .catch(err => res.send('err when trying to add receipt"' + err))
  } else {
    session.receipt = req.body;
    res.redirect('/login');
  }
});

module.exports = app;