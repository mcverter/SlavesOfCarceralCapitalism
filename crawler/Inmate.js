class Inmate {
  constructor(first,last,dob, facility) {
    this.first = first;
    this.last = last;
    this.dob = dob;
    this.facility = facility;
  }

  print() {
    this.printHTML();
  }
  printConsole() {
    console.log(`${this.first}\t${this.last}\t${this.dob}\t${this.facility}`)
  }
  printHTML() {
    console.log(`<tr><td>${this.first}</td><td>${this.last}</td><td>${this.dob}</td></tr>`)
  }

  printJSON(){
    console.log(`{"first": "${this.first}", "last": "${this.last}", "dob": "${this.dob}", "facility": "${this.facility}"}`)
  }
  printSQL() {
    console.log(`(${this.first},${this.last},${this.dob},${this.facility})`)
  }

}

module.exports = Inmate;