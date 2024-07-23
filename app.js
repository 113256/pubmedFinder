// app.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
//const fetch = require('node-fetch');
const PDFParser = require('pdf-parse');
//const sqlite3 = require('sqlite3').verbose();
const http = require('http');
//const  PDFExtract = require('pdf-extraction');
const pdfjsLib = require('pdfjs-dist');
const path = require('path');
const XLSX = require('xlsx');
const { promisify } = require('util');
const sleep = promisify(setTimeout);


var bodyParser = require('body-parser')



/*import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import PDFParser from 'pdf-parse';
import sqlite3 from 'sqlite3';
import http from 'http';
*/
const app = express();


// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
//const port = 3000;

const port = process.env.PORT || 3000

/*
const dbFile = 'database.db';

// Check if the database file exists
const dbExists = fs.existsSync(dbFile);


const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Database error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create "AE" table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS AE (id INTEGER PRIMARY KEY AUTOINCREMENT, Medicine TEXT, Effects TEXT, fileName TEXT)`);
	db.run(`CREATE TABLE IF NOT EXISTS Evidence (id INTEGER PRIMARY KEY AUTOINCREMENT, fileName TEXT, evidence TEXT)`);
    // Create "uploadInfo" table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS uploadInfo (id INTEGER PRIMARY KEY AUTOINCREMENT, fileName TEXT, uploadTime DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'Processed' )`);
  }
});
*/

app.get('/read-file', (req, res) => {
  const fileName = decodeURIComponent(req.query.fileName);

  // Check if the fileName is provided
  if (!fileName) {
    return res.status(400).send('File name not provided.');
  }

  const filePath = path.join(__dirname, 'uploads', fileName);
   console.log(path.join(__dirname, 'uploads', fileName));
  // Read the file content
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err.message);
      return res.status(500).send('Error reading file.');
    }

    // Send the file content as the response
	console.log(data);
    res.send(data);
  });
});

app.get('/searchGoogleScholarTerm', async (req, res) => {
  const term = decodeURIComponent(req.query.term);

  var data = await searchGoogleScholarTermForBooksDump(term);

    // Send the file content as the response
    console.log(data);
    res.send(data);
 
});


app.post('/fetch-summary', jsonParser , async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const joinedTxt = req.body.text;
    console.log("BBB "+req.body);
    const summary = await processOpenAI(joinedTxt,keyword);
    console.log("SSS "+summary);
    res.send(summary);
  } catch (error) {
    console.error('Error processing summary:', error);
    res.status(500).send('Internal Server Error');
  }
});




async function processOpenAI(pdfText, keyword) {
  console.log("Process summary");
  const scriptPath = 'summary.txt';
  const maxRetries = 1; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;
  let responseData = "";

  while (!success && retryCount < maxRetries) {
    try {
      const promptData = await fs.promises.readFile(scriptPath, 'utf8');
      let prompt = promptData;
      prompt = prompt.replace("{data}", pdfText);
      prompt = prompt.replace("{keyword}", keyword);
      fs.writeFileSync('test.txt', prompt);

      // Call ChatGPT API to get the response
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
      };

      const data = JSON.stringify({
        messages: [{ "role": "user", "content": prompt }],
        model: "gpt-3.5-turbo-16k",
        temperature: 0.7,
        max_tokens: 6000
      });

      console.log(prompt);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: headers,
        body: data
      });

      const responseData = await response.json();
      console.log(responseData);
      const result = responseData.choices[0].message.content;
      console.log(result);
      
      // If the above operations succeed, mark the process as successful
      success = true;
      
      // Return the result
      return result;
    } catch (err) {
      console.error('Error processing prompt data:', err);
      await sleep(20000); // 20000 milliseconds = 20 seconds
      retryCount++;
    }
  }

  // If the function exits the loop without success, throw an error
  if (!success) {
    throw new Error('Failed to process OpenAI request after maximum retries.');
  }
}





async function processPromptDataBaiduGetSummary(pdfText,keyword) {
  console.log("Process summary");
  const scriptPath = 'summary.txt';
 
  const maxRetries = 10; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;

while (!success && retryCount < maxRetries) {
  try {
    const promptData = await fs.promises.readFile(scriptPath, 'utf8');
    let prompt = promptData;
    //prompt = prompt.replace("{data}", pdfText);
    prompt = prompt.replace("{keyword}", keyword);
    fs.writeFileSync('test.txt', prompt);

  
  //baidu
          const apiKey = "0IkAVWO2FcokrYDbFaWMkcgn";
        const secretKey = "ZnpoAwTRSBSDjye5mkXGhv25qPPirzkK";
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

        const accessTokenResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const accessTokenData = await accessTokenResponse.json();
        const accessToken = accessTokenData.access_token;

        const chatUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${accessToken}`;
        
        
        //console.log(prompt)
      
 
        const chatPayload = JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const chatHeaders = {
            'Content-Type': 'application/json'
        };

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: chatHeaders,
            body: chatPayload
        });

        const responseData = await response.json();
    
  
    console.log("sum:"+responseData);

    var responseContent = responseData.result;
    console.log("sum = "+ responseContent);
  
  // If the above operations succeed, mark the process as successful
    success = true;

    // All data rows are inserted successfully
    return responseContent
  } catch (err) {
    console.error('Error processing prompt data:', err);
  await sleep(20000); // 5000 milliseconds = 5 seconds
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

//dont send fetch on client side as there is CORS error, hence send from server-side!
async function searchGoogleScholarTermForBooksDump(term){
  const apiKeyAppendGoogleScholar = "&api_key=4e6a2b3759237635706100136464050429072ef11c27f9b18a7f136163e6c92d";
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


// Function to convert Excel data to an HTML table
function convertToHtmlTable(data) {
  let tableHtml = '<table>\n';

  // Create table header
  if (data.length > 0) {
    tableHtml += '  <tr>\n';
    const headers = Object.keys(data[0]);
    for (const header of headers) {
      tableHtml += `    <th>${header}</th>\n`;
    }
    tableHtml += '  </tr>\n';
  }

  // Add table rows
  for (const row of data) {
    tableHtml += '  <tr>\n';
    for (const value of Object.values(row)) {
      tableHtml += `    <td>${value}</td>\n`;
    }
    tableHtml += '  </tr>\n';
  }

  tableHtml += '</table>';
  return tableHtml;
}

async function processPromptData(pdfText, medicineInput,fileName,rowIndex) {
  console.log("Process prompt Data " +fileName+", medicine = "+medicineInput);	
  const scriptPath = medicineInput ? 'scriptListAll - OneMedicine.txt' : 'scriptListAll.txt';
 
  const maxRetries = 10; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;

while (!success && retryCount < maxRetries) {
  try {
    const promptData = await fs.promises.readFile(scriptPath, 'utf8');
    let prompt = promptData;
    prompt = prompt.replace("{data}", pdfText);
    prompt = prompt.replace("{Medicine}", medicineInput);
    fs.writeFileSync('test.txt', prompt);

	
	
    const headers = {
      "Content-Type": "application/json",
      "api-key": "3d77e5e7217b4d2d8dc40f9d12a04855"
    };

    const data = JSON.stringify({
      messages: [{"role": "user", "content": prompt}],
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 1000
    });
	
	 const response = await fetch("https://japanctest.openai.azure.com/openai/deployments/16k/chat/completions?api-version=2023-03-15-preview", {
     method: "POST",
     headers: headers,
     body: data
    });

    const responseData = await response.json();
	
	/*
	//baidu
	        const apiKey = "0IkAVWO2FcokrYDbFaWMkcgn";
        const secretKey = "ZnpoAwTRSBSDjye5mkXGhv25qPPirzkK";
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

        const accessTokenResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const accessTokenData = await accessTokenResponse.json();
        const accessToken = accessTokenData.access_token;

        const chatUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${accessToken}`;
        
        
        console.log(prompt)
      
 
        const chatPayload = JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const chatHeaders = {
            'Content-Type': 'application/json'
        };

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: chatHeaders,
            body: chatPayload
        });

        const responseData = await response.json();
	*/	
	
    console.log("RES:"+responseData);

    var responseContent = responseData.choices[0].message.content;
    console.log("OLD = "+	responseContent);
	
	responseContent = extractJSONString(responseContent);
	console.log("NEW "+responseContent);
    const parseData = JSON.parse(responseContent);

    const evidenceArray = parseData.evidence;


    for (let i = 0; i < evidenceArray.length; i++) {
		
      // Insert data into the "Evidence" table
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO Evidence (fileName, evidence) VALUES (?, ?)', [fileName, evidenceArray[i]], (err) => {
          if (err) {
            console.error('Database insertion error:', err.message);
            reject(err);
          } else {
            console.log('Data inserted into "evidence" table:', evidenceArray[i]);
            resolve();
          }
        });
      });
    }

    const dataTableArray = parseData.aeTable;

    for (let i = 0; i < dataTableArray.length; i++) {
      const row = dataTableArray[i];

      // Insert data into the "AE" table
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO AE (Medicine, Effects, fileName) VALUES (?, ?, ?)', [rowIndex+row.Drug, row.AdverseEvent, fileName], (err) => {
          if (err) {
            console.error('Database insertion error:', err.message);
            reject(err);
          } else {
            console.log('Data inserted into "AE" table:', row.Drug + "=" + row.AdverseEvent);
            resolve();
          }
        });
      });
    }
	
	// If the above operations succeed, mark the process as successful
    success = true;

    // All data rows are inserted successfully
    return Promise.resolve();
  } catch (err) {
    console.error('Error processing prompt data:', err);
	await sleep(20000); // 5000 milliseconds = 5 seconds
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


async function processPromptDataTencen() {

 
  const maxRetries = 10; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;

while (!success && retryCount < maxRetries) {
  try {
    const apiKeyAppendGoogleScholar = "&api_key=4e6a2b3759237635706100136464050429072ef11c27f9b18a7f136163e6c92d";
    const url = 'https://serpapi.com/search.json?engine=google_scholar&q=' + term.replace(" ","+")+apiKeyAppendGoogleScholar;
  

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestData),
    });

    const responseData = await response.json();
    console.log(responseData);
	
    console.log("RES:"+responseData);

    var responseContent = responseData.result;
    console.log("OLD = "+	responseContent);
	
    

      // Insert data into the "AE" table
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO AE (Medicine, Effects, fileName) VALUES (?, ?, ?)', [rowIndex+medicineInput, responseContent, fileName], (err) => {
          if (err) {
            console.error('Database insertion error:', err.message);
            reject(err);
          } else {
            console.log('Data inserted into "AE" table:');
            resolve();
          }
        });
      });
    
	
	// If the above operations succeed, mark the process as successful
    success = true;

    // All data rows are inserted successfully
    return Promise.resolve();
  } catch (err) {
    console.error('Error processing prompt data:', err);
	await sleep(20000); // 5000 milliseconds = 5 seconds
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

async function processPromptDataBaidu(pdfText, medicineInput,fileName,rowIndex) {
  console.log("Process prompt Data " +fileName+", medicine = "+medicineInput);	
  const scriptPath = medicineInput ? 'scriptListAll - OneMedicine.txt' : 'scriptListAll.txt';
 
  const maxRetries = 10; // You can adjust the number of retries as needed
  let retryCount = 0;
  let success = false;

while (!success && retryCount < maxRetries) {
  try {
    const promptData = await fs.promises.readFile(scriptPath, 'utf8');
    let prompt = promptData;
    prompt = prompt.replace("{data}", pdfText);
    prompt = prompt.replace("{Medicine}", medicineInput);
    fs.writeFileSync('test.txt', prompt);

	
	/*
    const headers = {
      "Content-Type": "application/json",
      "api-key": "3d77e5e7217b4d2d8dc40f9d12a04855"
    };

    const data = JSON.stringify({
      messages: [{"role": "user", "content": prompt}],
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 1000
    });
	
	 const response = await fetch("https://japanctest.openai.azure.com/openai/deployments/16k/chat/completions?api-version=2023-03-15-preview", {
     method: "POST",
     headers: headers,
     body: data
    });

    const responseData = await response.json();
	*/
	
	//baidu
	        const apiKey = "0IkAVWO2FcokrYDbFaWMkcgn";
        const secretKey = "ZnpoAwTRSBSDjye5mkXGhv25qPPirzkK";
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;

        const accessTokenResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const accessTokenData = await accessTokenResponse.json();
        const accessToken = accessTokenData.access_token;

        const chatUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant?access_token=${accessToken}`;
        
        
        console.log(prompt)
      
 
        const chatPayload = JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const chatHeaders = {
            'Content-Type': 'application/json'
        };

        const response = await fetch(chatUrl, {
            method: 'POST',
            headers: chatHeaders,
            body: chatPayload
        });

        const responseData = await response.json();
		
	
    console.log("RES:"+responseData);

    var responseContent = responseData.result;
    console.log("OLD = "+	responseContent);
	
    

      // Insert data into the "AE" table
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO AE (Medicine, Effects, fileName) VALUES (?, ?, ?)', [rowIndex+medicineInput, responseContent, fileName], (err) => {
          if (err) {
            console.error('Database insertion error:', err.message);
            reject(err);
          } else {
            console.log('Data inserted into "AE" table:');
            resolve();
          }
        });
      });
    
	
	// If the above operations succeed, mark the process as successful
    success = true;

    // All data rows are inserted successfully
    return Promise.resolve();
  } catch (err) {
    console.error('Error processing prompt data:', err);
	await sleep(20000); // 5000 milliseconds = 5 seconds
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

function getFileNameFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath));
}
function extractJSONString(response) {
  const regex = /\{[\s\S]*\}/; // Updated regex pattern to capture everything from the first '{' to the last '}'
  const match = response.match(regex);

  if (match) {
    return match[0];
  } else {
    throw new Error('JSON object not found in the response.');
  }
}




//app.listen(port, () => {
//  console.log(`Server is running on http://localhost:${port}`);
//});
app.use('/', express.static(__dirname));
const server = http.createServer(app);
server.listen(port, () => console.log('Server started on port localhost:3000'));