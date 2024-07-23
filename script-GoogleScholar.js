/*
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE eSearchResult PUBLIC "-//NLM//DTD esearch 20060628//EN" "https://eutils.ncbi.nlm.nih.gov/eutils/dtd/20060628/esearch.dtd">
<eSearchResult><Count>414033</Count><RetMax>20</RetMax><RetStart>0</RetStart><IdList>
<Id>38402396</Id>
<Id>38402333</Id>
<Id>38402329</Id>
<Id>38402300</Id>
<Id>38402287</Id>
<Id>38402266</Id>
<Id>38402214</Id>
<Id>38402195</Id>
<Id>38402167</Id>
<Id>38402071</Id>
<Id>38402070</Id>
<Id>38401902</Id>
<Id>38401900</Id>
<Id>38401797</Id>
<Id>38401782</Id>
<Id>38401746</Id>
<Id>38401674</Id>
<Id>38401673</Id>
<Id>38401651</Id>
<Id>38401644</Id>
</IdList><TranslationSet><Translation>     <From>covid 19</From>     <To>("COVID-19" OR "COVID-19"[MeSH Terms] OR "COVID-19 Vaccines" OR "COVID-19 Vaccines"[MeSH Terms] OR "COVID-19 serotherapy" OR "COVID-19 serotherapy"[Supplementary Concept] OR "COVID-19 Nucleic Acid Testing" OR "covid-19 nucleic acid testing"[MeSH Terms] OR "COVID-19 Serological Testing" OR "covid-19 serological testing"[MeSH Terms]  OR "COVID-19 Testing" OR "covid-19 testing"[MeSH Terms]  OR "SARS-CoV-2" OR "sars-cov-2"[MeSH Terms]  OR "Severe Acute Respiratory Syndrome Coronavirus 2" OR "NCOV" OR "2019 NCOV" OR (("coronavirus"[MeSH Terms] OR "coronavirus" OR "COV") AND 2019/11/01[PDAT] : 3000/12/31[PDAT]))</To>    </Translation></TranslationSet><QueryTranslation>"covid 19"[All Fields] OR "covid 19"[MeSH Terms] OR "covid 19 vaccines"[All Fields] OR "covid 19 vaccines"[MeSH Terms] OR "covid 19 serotherapy"[All Fields] OR "covid 19 nucleic acid testing"[All Fields] OR "covid 19 nucleic acid testing"[MeSH Terms] OR "covid 19 serological testing"[All Fields] OR "covid 19 serological testing"[MeSH Terms] OR "covid 19 testing"[All Fields] OR "covid 19 testing"[MeSH Terms] OR "sars cov 2"[All Fields] OR "sars cov 2"[MeSH Terms] OR "severe acute respiratory syndrome coronavirus 2"[All Fields] OR "ncov"[All Fields] OR "2019 ncov"[All Fields] OR (("coronavirus"[MeSH Terms] OR "coronavirus"[All Fields] OR "cov"[All Fields]) AND 2019/11/01:3000/12/31[Date - Publication])</QueryTranslation></eSearchResult>
*/

const apiKeyAppendGoogleScholar = "&api_key=4e6a2b3759237635706100136464050429072ef11c27f9b18a7f136163e6c92d"

async function processKeywordToHTMLTableGoogleScholar(){
  var keyword = document.getElementById("keyword").value;
  //dont send fetch on client side as there is CORS error, hence send from server-side!
  //var jsondump = await searchGoogleScholarTermForBooksDump (keyword);

  const response = await fetch(`/searchGoogleScholarTerm?term=${encodeURIComponent(keyword)}`, {
    method: 'GET'
  });
  console.log(response);
  const jsondump = await response.text(); // Parse the JSON response



  // Parse the XML string
let data = JSON.parse(jsondump);


// Loop through the IDs and add rows to the table
var tbody = document.querySelector("#googleScholarTable tbody");
for (var i = 0; i < data.organic_results.length; i++) {
    var res = data.organic_results[i];
    var row = "<tr><td>" + res.result_id + "</td><td>"+res.title+"</td><td>"+res.publication_info.summary+"</td><td>"+"<a href='"+res.link+"'>"+res.link+"</a></td><td>"+res.snippet+"</td></tr>";
    tbody.insertAdjacentHTML('beforeend', row);
}
}


//dont send fetch on client side as there is CORS error, hence send from server-side!
async function searchGoogleScholarTermForBooksDump(term){
  const url = 'https://serpapi.com/search.json?engine=google_scholar&q=' + term.replace(" ","+")+apiKeyAppendGoogleScholar;
  console.log(url);
  const maxRetries = 1; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;

while (!success && retryCount < maxRetries) {

try{
  
  const response = await fetch(url, {
     method: "GET",
    });

    const responseTxt = await response.text(); // to print errors etc...
    // If the above operations succeed, mark the process as successful
    success = true;
    return responseTxt;
  
  } catch (err) {
    console.error('Error processing prompt data:', err);
    //await sleep(3000); // 5000 milliseconds = 5 seconds
      retryCount++;
    //throw err;
  }
}

if (!success) {
    console.error('Failed after multiple retries. Aborting.');
    // Optionally, you can throw an error here or perform any other action.
    throw new Error('Failed after multiple retries. Aborting.');
    }

}





// On page load, fetch the data and populate the table
window.addEventListener('load', () => {
 
});