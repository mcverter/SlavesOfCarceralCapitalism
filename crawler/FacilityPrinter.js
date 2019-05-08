
class FacilityPrinter {
  constructor(facilities) {
    this.facilities = facilities;
  }

  printOutFacilities(){
    let output = `
      <h1>FACILITY LIST:</h1>
      <table>
          <tr><th>NAME</th><th>CITY</th><th>STATE</th></tr>`;
    this.facilities.reduce((accumulator, current) => {
      accumulator += "n" + current.print();
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

module.exports = FacilityPrinter;