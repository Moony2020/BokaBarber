const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\Mymoon Dobaibi\\.gemini\\antigravity-ide\\brain\\0328eff8-4d5c-4727-aa6a-db4b4aaf76ee\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lastUserInput = '';

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        lastUserInput = obj.content;
      }
    } catch (e) {
      // ignore parse error
    }
  }

  console.log(lastUserInput);
}

processLineByLine();
