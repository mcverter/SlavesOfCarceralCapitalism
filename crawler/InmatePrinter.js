
class InmatePrinter {
  constructor(facility, inmates) {
    this.facility = facility;
    this.inmates = inmates;
  }

  printOutFacilities(){

  }
  printOutInmates(){
    let output = `
        <hr />
            <h2><a name="facility${this.facility.number}-inmates">Here are the inmates in ${this.facility.name} (${this.facility.city}, ${this.facility.state})</a></h2>
            <table>
                <tr><th>First Name</th><th>Last Name</th><th>Date of Birth</th></tr>`;
    output = this.inmates.reduce((accumulator, current) => {
      console.log(accumulator, 'current', current)
      return `${accumulator}\n${current.print()}`;
    }, output);
    output += "</table>\n";

    console.log(output);
    return output;
  }

  writeOutCompletePage(){

  }

  writeOutSection(){

  }
}

module.exports = InmatePrinter;