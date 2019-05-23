const InmatePrinter = require('./InmatePrinter');
const FacilityPrinter = require('./FacilityPrinter');

class Printer {
  constructor() {
    this.fp = new FacilityPrinter();
    this.ip = new InmatePrinter();
  }
}

module.exports = Printer;