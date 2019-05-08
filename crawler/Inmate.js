class Inmate {
  constructor(first,last,dob, facility) {
    this.first = first;
    this.last = last;
    this.dob = dob;
    this.facility = facility;
  }

  print() {
    return printHTML();
  }
  printConsole() {
    return (`${this.first}\t${this.last}\t${this.dob}\t${this.facility}`)
  }
  printHTML() {
    return (`<tr><td>${this.first}</td><td>${this.last}</td><td>${this.dob}</td></tr>`)
  }

  printJSON(){
    return (`{"first": "${this.first}", "last": "${this.last}", "dob": "${this.dob}", "facility": "${this.facility}"}`)
  }
  printSQL() {
    return (`(${this.first},${this.last},${this.dob},${this.facility})`)
  }
}

module.exports = Inmate;