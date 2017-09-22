const Item = require('../db/itemModel.js');
const Event = require('../db/eventModel.js');
const Account = require('../db/accountModel.js');

exports.createNewEvent = (eventName = '', tipRate, taxRate, discountRaw, discountRate, totalDiners) => {
  return Event.create({ eventName, tipRate, taxRate, discountRaw, discountRate, totalDiners, totalDiners, responsesSoFar: 0 });
};

exports.getEvent = (eventID) => {
  return Event.find({ _id: eventID });
};

exports.updateResponsesSoFarForEvent = (eventID) => {
  let query = { _id: eventID };
  let update = { $inc: { responsesSoFar: 1 } };
  let options = { new: true };
  return Event.findOneAndUpdate(query, update, options);
};

exports.getAccount = (identifier) => {
  return identifier.length === 12 ? Account.findOne({ phoneNumber: identifier }) : Account.findOne({ _id: identifier });
};

exports.createOrUpdateAccount = (phoneNumber, eventID) => {
  console.log('about to create or update account', phoneNumber, eventID);
  let query = { phoneNumber };
  let update = { $push: { events: eventID } };
  let options = { new: true, upsert: true };
  return Account.findOneAndUpdate(query, update, options)
  .then(acct => console.log('created or updated acct', JSON.stringify(acct)))
  .catch(err => console.log('FAILED TO created acct', err))
};

exports.createNewItem = (itemName, quantity = 1, price, eventID) => {
  return Item.create({ itemName, quantity, price, eventID });
};

exports.getItems = (eventID) => {
  return Item.find({ eventID });
};

exports.updateAndReturnItem = (item, diner) => {
  let query = { _id: item };
  let update = { $push: { shares: diner } };
  let options = { new: true };
  return Item.findOneAndUpdate(query, update, options);
};