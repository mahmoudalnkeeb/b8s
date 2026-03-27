/**
 * Diagnostic script to check Qdrant contents
 * Run with: docker exec <container> node check-qdrant.js <agent-id>
 */

const QDRANT_URL = process.env.VECTOR_DB_URL || 'http://qdrant:6333';

async function main() {
  const agentId = process.argv[2];
  
  if (!agentId) {
    console.log('Usage: node check-qdrant.js <agent-id>');
    console.log('Example: node check-qdrant.js b6a42776-4db3-44db-98ce-a4daccd35857');
    process.exit(1);
  }

  const collectionName = `kb_${agentId.replace(/-/g, '_')}`;

  // 1. List all collections
  console.log('=== Qdrant Collections ===');
  const collections = await fetch(`${QDRANT_URL}/collections`);
  const collectionsData = await collections.json();
  console.log(JSON.stringify(collectionsData, null, 2));

  // 2. Get collection info
  console.log(`\n=== Collection Info: ${collectionName} ===`);
  try {
    const info = await fetch(`${QDRANT_URL}/collections/${collectionName}`);
    const infoData = await info.json();
    console.log(JSON.stringify(infoData, null, 2));
  } catch (e) {
    console.log('Collection not found');
    return;
  }

  // 3. Scroll through points to see what's stored
  console.log('\n=== Sample Points (first 5) ===');
  const scroll = await fetch(`${QDRANT_URL}/collections/${collectionName}/points/scroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      limit: 5,
      with_payload: true,
      with_vector: false,
    }),
  });
  const scrollData = await scroll.json();
  
  if (scrollData.result?.points) {
    for (const point of scrollData.result.points) {
      console.log(`\n--- Point ${point.id} ---`);
      console.log('Text preview:', point.payload?.text?.substring(0, 200) + '...');
      console.log('File:', point.payload?.fileName);
      console.log('Chunk:', point.payload?.chunkIndex);
      console.log('Metadata:');
      console.log('  - URLs:', point.payload?.urls);
      console.log('  - Emails:', point.payload?.emails);
      console.log('  - Phones:', point.payload?.phones);
      console.log('  - Social Links:', JSON.stringify(point.payload?.socialLinks));
    }
  } else {
    console.log('No points found');
  }

  // 4. Count total points
  console.log('\n=== Total Points ===');
  const count = await fetch(`${QDRANT_URL}/collections/${collectionName}/points/count`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const countData = await count.json();
  console.log('Count:', countData.result?.count);

  // 5. Search for specific terms (if we can generate embeddings)
  console.log('\n=== Testing Vector Search ===');
  console.log('To test vector search, use the RAG query tool in the app.');
}

main().catch(console.error);
