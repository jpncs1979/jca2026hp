import XLSX from 'xlsx';

const path = process.argv[2] || 'c:\\Users\\tomoh\\Desktop\\会員.xlsx';

try {
  const wb = XLSX.readFile(path);
  console.log('Sheets:', wb.SheetNames.join(', '));
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    console.log(`\n--- Sheet: ${name} ---`);
    console.log('Rows:', data.length);
    if (data[0]) console.log('Headers:', JSON.stringify(data[0]));
    if (data[1]) console.log('Row1:', JSON.stringify(data[1]));
    if (data[2]) console.log('Row2:', JSON.stringify(data[2]));
  }
} catch (e) {
  console.error(e.message);
}
