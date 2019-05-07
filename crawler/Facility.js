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

  print() {
    this.printHTML();
  }
  printConsole() {
    console.log(`${this.name}\t${this.city}\t${this.state}`)
  }
  printHTML() {
    console.log(`<tr><td>${this.name}</td><td>${this.city}</td><td>${this.state}</td><td><a href="#facility${this.number}-inmates">(See inmates)</a></td></tr>`)
  }
  printJSON(){
    console.log(`{"name": "${this.name}", city: "${this.city}", state: "${this.state}"}`)
  }

  printSQL(){
    console.log(`(${this.number},${this.name},${this.city},${this.state})`)

  }

}

module.exports = Facility;
