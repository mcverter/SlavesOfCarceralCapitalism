class Facility {
  constructor(number,name,city,state, pageNum) {
    this.number = number;
    this.name = name;
    this.city = city;
    this.state = state;
    this.pageNum = pageNum;
    this.immigrantProportionScore = undefined;
    this.homepage = `https://csgpay.com/order/facility/${number}/product/2/select-inmate`
  }
}

module.exports = Facility;
