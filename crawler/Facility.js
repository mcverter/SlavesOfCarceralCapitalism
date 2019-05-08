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
    return this.printHTML();
  }
  printConsole() {
    return (`${this.name}\t${this.city}\t${this.state}`)
  }
  printHTML() {
    return `\n<tr><td>${this.name}</td><td>${this.city}</td><td>${this.state}</td><td><a href="#facility${this.number}-inmates">(See inmates)</a></td></tr>\n`;
  }
  printJSON(){
    return (`{"name": "${this.name}", city: "${this.city}", state: "${this.state}"}`)
  }

  printSQL(){
    return (`(${this.number},${this.name},${this.city},${this.state})`)
  }
}

module.exports = Facility;
