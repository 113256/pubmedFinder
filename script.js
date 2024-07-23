// Function to remove rows with a specific id from a table
function removeRowsById(tableId) {
    var table = document.getElementById(tableId);
    if (table) {
        var rows = table.getElementsByTagName('tr');
        // Start iterating from the second row (index 1)
        for (var i = rows.length - 1; i > 0; i--) {
            var row = rows[i];
            row.parentNode.removeChild(row);
        }
    } else {
        console.error('Table with id ' + tableId + ' not found.');
    }
}



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

const apiKeyAppend = "&api_key=c28229b70c70aa86892deec0b8a11f5f5308"

async function processKeywordToHTMLTable(){
  var keyword = document.getElementById("keyword").value;
  console.log(keyword);
  var xmldump = await searchPubmedTermForBooksDump (keyword);

  // Parse the XML string
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(xmldump, "text/xml");

  // Get the list of IDs
  var ids = xmlDoc.getElementsByTagName("Id");

  var idValues = Array.from(ids).map(function(id) {
      return id.textContent || id.innerText;
  });
  var idJoinedString = idValues.join(",");
  var abstractTextsArray = await getAbstractFromXMLDump(idJoinedString);


  // Loop through the IDs and add rows to the table
  var tbody = document.querySelector("#bookInfoTable tbody");
  var count = 0;

var abstractTextsString =  "";

  for (var i = 0; i < ids.length; i++) {

      if (abstractTextsArray[i].length > 1200){
        continue;
      }

      var id = ids[i].textContent;
      let {title,authors} = await processBookIDToTable(id);
      console.log(authors);
      var link = "https://pubmed.ncbi.nlm.nih.gov/"+id;
      abstractTextsString = abstractTextsString + abstractTextsArray[i]+",";
      var row = "<tr><td>" + id + "</td><td>"+title+"</td><td>"+authors+"</td><td>"+"<a href = '"+link+"'>"+link+"</a></td><td>"+abstractTextsArray[i]+"</td></tr>";
      tbody.insertAdjacentHTML('beforeend', row);
      count = count + 1;
      if (count > 4){
        break;
      }
  }


  //const abstractTextsString = abstractTextsArray.join(', ');
console.log("ABAB " +abstractTextsString);
    const formData = new FormData();
  formData.append('keyword', keyword); //need encodeURIComponent to make sure chinese filename isnt garbled, afterwards we use decodeURIComponent to convert it back to chinese!
   formData.append('text', abstractTextsString);

// const response = await fetch(`/delete-upload-info?fileName=${encodeURIComponent(fileName)}`, {

  try {
    const response = await fetch(`/fetch-summary?keyword=${encodeURIComponent(keyword)}`, {
      method: 'POST', // Changed to POST for sending data
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: abstractTextsString, keyword: keyword  })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const summary = await response.text(); // Assuming summary is a text response
    console.log('Summary:', summary);
    document.getElementById("summary").value = summary;
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }

}


async function getAbstractFromXMLDump(idListString){
  var xmlDump = await CallEFetchAPIPubmed(idListString);

  var parser = new DOMParser();
   var xmlDoc = parser.parseFromString(xmlDump, "text/xml");
   var abstractTexts = [];
  var abstractElements = xmlDoc.getElementsByTagName("AbstractText");
  for (var i = 0; i < abstractElements.length; i++) {
      abstractTexts.push(abstractElements[i].textContent.trim());
  }
  return abstractTexts;
}

async function CallEFetchAPIPubmed(idListString){
  
    const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id='+idListString+'&retmode=xml&rettype=abstract';
console.log(url);
  const maxRetries = 10; // You can adjust the number of retries as needed
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
    console.log(responseTxt);
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


async function processBookIDToTable(id){
  var xmldump = await getBookDetailsDump (id);
  // Parse the XML string
var parser = new DOMParser();
var xmlDoc = parser.parseFromString(xmldump, "text/xml");

    let titleNode = xmlDoc.querySelector('Item[Name="Title"]');
    let title = titleNode ? titleNode.textContent.trim() : "";


    // Extracting authors
    let authorsList = xmlDoc.querySelectorAll('Item[Name="Author"]');
    let authors = Array.from(authorsList).map(author => author.textContent.trim()).join(", ");
console.log(title+"="+authors);

return { title, authors };
}


async function searchPubmedTermForBooksDump(term){
  const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=' + term.replace(" ","+")+apiKeyAppend;

  const maxRetries = 10; // You can adjust the number of retries as needed
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

/*
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE eSummaryResult PUBLIC "-//NLM//DTD esummary v1 20041029//EN" "https://eutils.ncbi.nlm.nih.gov/eutils/dtd/20041029/esummary-v1.dtd">
<eSummaryResult>
<DocSum>
  <Id>38401644</Id>
  <Item Name="PubDate" Type="Date">2024 Feb 22</Item>
  <Item Name="EPubDate" Type="Date">2024 Feb 22</Item>
  <Item Name="Source" Type="String">Am J Infect Control</Item>
  <Item Name="AuthorList" Type="List">
    <Item Name="Author" Type="String">Wu J</Item>
    <Item Name="Author" Type="String">Li Q</Item>
    <Item Name="Author" Type="String">Wang J</Item>
    <Item Name="Author" Type="String">Gong Y</Item>
    <Item Name="Author" Type="String">Yin X</Item>
  </Item>
  <Item Name="LastAuthor" Type="String">Yin X</Item>
  <Item Name="Title" Type="String">Prevalence of self-medication with antibiotics and its related factors among the general public and health professionals during the COVID-19 pandemic: a cross-sectional study in China.</Item>
  <Item Name="Volume" Type="String"></Item>
  <Item Name="Issue" Type="String"></Item>
  <Item Name="Pages" Type="String"></Item>
  <Item Name="LangList" Type="List">
    <Item Name="Lang" Type="String">English</Item>
  </Item>
  <Item Name="NlmUniqueID" Type="String">8004854</Item>
  <Item Name="ISSN" Type="String">0196-6553</Item>
  <Item Name="ESSN" Type="String">1527-3296</Item>
  <Item Name="PubTypeList" Type="List">
    <Item Name="PubType" Type="String">Journal Article</Item>
  </Item>
  <Item Name="RecordStatus" Type="String">PubMed - as supplied by publisher</Item>
  <Item Name="PubStatus" Type="String">aheadofprint</Item>
  <Item Name="ArticleIds" Type="List">
    <Item Name="pubmed" Type="String">38401644</Item>
    <Item Name="doi" Type="String">10.1016/j.ajic.2024.02.008</Item>
    <Item Name="pii" Type="String">S0196-6553(24)00080-4</Item>
  </Item>
  <Item Name="DOI" Type="String">10.1016/j.ajic.2024.02.008</Item>
  <Item Name="History" Type="List">
    <Item Name="medline" Type="Date">2024/02/25 00:42</Item>
    <Item Name="pubmed" Type="Date">2024/02/25 00:42</Item>
    <Item Name="received" Type="Date">2023/10/09 00:00</Item>
    <Item Name="revised" Type="Date">2024/02/16 00:00</Item>
    <Item Name="accepted" Type="Date">2024/02/16 00:00</Item>
    <Item Name="entrez" Type="Date">2024/02/24 19:13</Item>
  </Item>
  <Item Name="References" Type="List"></Item>
  <Item Name="HasAbstract" Type="Integer">1</Item>
  <Item Name="PmcRefCount" Type="Integer">0</Item>
  <Item Name="FullJournalName" Type="String">American journal of infection control</Item>
  <Item Name="ELocationID" Type="String">pii: S0196-6553(24)00080-4. doi: 10.1016/j.ajic.2024.02.008</Item>
  <Item Name="SO" Type="String">2024 Feb 22;</Item>
</DocSum>

</eSummaryResult>
*/
async function getBookDetailsDump(bookid){
  const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=' + bookid+apiKeyAppend;

  const maxRetries = 10; // You can adjust the number of retries as needed
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



function openPopup(event, url) {
  event.preventDefault();
  const width = 800;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  const features = `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars`;

  window.open(url, '_blank', features);
}



function filterTable() {
  const selectedMedicine = document.getElementById('medicineDropdown').value;
  const selectedEffect = document.getElementById('effectFilter').value;
  const dataTable = document.getElementById('aeTable');
  const tableRows = dataTable.querySelectorAll('tbody tr');

  // Loop through each row in the table and check if it matches the selected filters
  tableRows.forEach((row) => {
	  const fileNameCell = row.querySelector('td:first-child').innerText;
    const medicineCell = row.querySelector('td:nth-child(2)').innerText;
    const effectsCell = row.querySelector('td:nth-child(3)').innerText;
	
    // Show the row if both filters match or if any of the filters is set to "All"
    if (
      (selectedMedicine === '' || medicineCell === selectedMedicine) &&
      (selectedEffect === '' || effectsCell.includes(selectedEffect))
    ) {
      row.style.display = 'table-row';
    } else {
      row.style.display = 'none';
    }
  });
}







// On page load, fetch the data and populate the table
window.addEventListener('load', () => {
 
});