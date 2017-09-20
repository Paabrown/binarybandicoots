const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
 username: { type: String, required: true },
 password: { type: String, required: true },
 receipts: { type: Array, required: false }
});

const Account = mongoose.model('Account', accountSchema);

Account.addReceipt = function(accountId, receipt) {
  console.log('accountId', accountId);
  console.log('receipt', receipt);
  return Account.findOne({ _id: ObjectId(accountId)})
  .then(acct => {
    acct ? acct.receipts.push(receipt) : console.log('error! expected account to exist but it does not');
    return acct;
  })
  .catch(err => {
    console.log('error when trying to look up account to add receipt', err);
    return err;
  })
}

module.exports = Account;