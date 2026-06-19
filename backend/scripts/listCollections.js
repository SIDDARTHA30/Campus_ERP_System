(async ()=>{
  try{
    const { MongoClient } = require('mongodb');
    const uri = 'mongodb://127.0.0.1:27017';
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('campus-erp');
    const cols = await db.listCollections().toArray();
    for(const c of cols){
      const count = await db.collection(c.name).countDocuments();
      console.log(c.name, count);
    }
    await client.close();
    process.exit(0);
  }catch(err){
    console.error('error',err);
    process.exit(1);
  }
})();
