import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

async function testE2E() {
  console.log('--- Starting E2E Flow ---');
  try {
    // 1. Upload a .txt file
    console.log('1. Uploading file...');
    const formData = new FormData();
    const filePath = path.resolve('dummy.txt');
    const fileContent = fs.readFileSync(filePath);
    formData.append('file', new Blob([fileContent], { type: 'text/plain' }), 'dummy.txt');
    
    let res = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      body: formData
    });
    
    if (!res.ok) {
      console.error('Upload failed', await res.text());
      return;
    }
    const uploadedDoc = await res.json();
    console.log('Upload success:', uploadedDoc);

    // 2. Check if it appears in the list
    console.log('2. Fetching document list...');
    res = await fetch(`${API_URL}/documents`);
    const docs = await res.json();
    console.log('List retrieved. Contains uploaded file:', docs.some(d => d.id === uploadedDoc.id));

    // 3. Ask a related question in chat
    console.log('3. Asking question in chat...');
    res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What is this document about?' })
    });
    const chatRes = await res.json();
    console.log('Chat response:', chatRes.answer);
    console.log('Chat sources:', chatRes.sources);

    // 4. Download the file
    console.log('4. Downloading file...');
    res = await fetch(`${API_URL}/documents/${uploadedDoc.id}/download`);
    if (res.ok) {
      const text = await res.text();
      console.log('Download success. Content length:', text.length);
    } else {
      console.error('Download failed', res.status);
    }

    // 5. Delete it
    console.log('5. Deleting file...');
    res = await fetch(`${API_URL}/documents/${uploadedDoc.id}`, {
      method: 'DELETE'
    });
    console.log('Delete status:', res.status);

    // 6. Verify list updates correctly
    console.log('6. Fetching document list to verify deletion...');
    res = await fetch(`${API_URL}/documents`);
    const finalDocs = await res.json();
    console.log('List retrieved. Contains uploaded file:', finalDocs.some(d => d.id === uploadedDoc.id));
    
  } catch (err) {
    console.error('Test script error:', err);
  }
}

testE2E();
