const API_KEY = '72f4bbf88emsh370df14bbde0284p1584b0jsnff223f3366ed';

async function test() {
  const url = 'https://dicolink.p.rapidapi.com/mot/ministre/antonymes?limite=10';
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'dicolink.p.rapidapi.com'
    }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Data:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
