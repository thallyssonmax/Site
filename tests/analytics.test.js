import test from 'node:test';
import assert from 'node:assert/strict';
import { isOwner, summarize, validEvent, OWNER } from '../server/analytics-model.js';
import report from '../api/analytics/report.js';
import collect from '../api/analytics/collect.js';
import { OAuth2Client } from 'google-auth-library';
const now = Date.parse('2026-10-15T12:00:00Z');
const e = (visitor, kind, target = '', seconds = 0, session = 'one', source = 'Direto') => ({ visitor_id: visitor, session_id: session, kind, target, source, path: '/', created_at: new Date(now - 3600000 + seconds * 1000).toISOString() });
test('unique visitors are deduplicated across reloads and repeated sessions', () => {
  const report = summarize([e('a','page'),e('a','page'),e('a','section','sobre',1),e('a','project','case',2),e('a','contact','WhatsApp',3),e('a','page','',4,'two')], '', now);
  assert.equal(report.total, 1); assert.deepEqual(report.funnel,[1,1,1,1]); assert.equal(report.contacts,1);
});
test('funnel is ordered within the same visit and direct contacts are independent', () => {
  const report = summarize([e('a','page'),e('a','contact','WhatsApp',1),e('a','project','case',2),e('a','contact','WhatsApp',3,'two')], '', now);
  assert.deepEqual(report.funnel,[1,1,1,0]); assert.equal(report.contacts,1);
});
test('first source attribution is exclusive; filtering retains full visitor journey', () => {
  const report = summarize([e('a','page','',0,'one','linkedin.com'),e('a','project','case',1,'two','Direto'),e('b','page')], 'linkedin.com',now);
  assert.equal(report.total,1); assert.deepEqual(report.funnel,[1,1,1,0]); assert.equal(report.sources.reduce((n,s)=>n+s.count,0),2);
});
test('latest journey excludes active visitors from exits and ignores heartbeat as destination', () => {
  const events = [e('a','section','sobre'), e('a','heartbeat','',10), e('b','page'),e('b','heartbeat','',3590)];
  const report = summarize(events,'',now);
  assert.equal(report.active,1); assert.deepEqual(report.exits,[{label:'/#sobre',count:1}]);
});
test('empty dataset remains zero without fabricated conversion', () => { const report = summarize([]); assert.equal(report.total,0); assert.deepEqual(report.funnel,[0,0,0,0]); });
test('owner must be exact verified Google identity', () => {
  assert.ok(isOwner({email:OWNER,email_verified:true,sub:'123'}));
  assert.ok(!isOwner({email:OWNER,email_verified:false,sub:'123'}));
  assert.ok(!isOwner({email:'other@gmail.com',email_verified:true,sub:'123'}));
  assert.ok(!isOwner({email:OWNER,email_verified:true}));
});
test('collector rejects malformed identifiers, private routes and query strings', () => {
  const id='550e8400-e29b-41d4-a716-446655440000'; const valid={id,visitor:id,session:id,kind:'page',path:'/',target:'',source:'Direto',timestamp:Date.now()};
  assert.ok(validEvent(valid));
  for (const change of [{visitor:'invalid'},{path:'/analytics'},{path:'/?email=private'},{kind:'arbitrary'},{source:'x'.repeat(81)},{timestamp:Date.now()-3600000}]) assert.ok(!validEvent({...valid,...change}));
});
function response() { return { code:200,headers:{}, setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;},end(){return this;} }; }
test('API protects reports without a token and never caches analytics',async()=>{ const res=response(); await report({method:'GET',headers:{},query:{}},res); assert.equal(res.code,401); assert.equal(res.headers['Cache-Control'],'private, no-store'); });
test('API rejects another Google account and invalid tokens before database access',async()=>{
  const previous = process.env.GOOGLE_CLIENT_ID; process.env.GOOGLE_CLIENT_ID='test-client';
  const original = OAuth2Client.prototype.verifyIdToken;
  try {
    OAuth2Client.prototype.verifyIdToken = async () => ({getPayload:()=>({email:'other@gmail.com',email_verified:true,sub:'1'})});
    const res=response(); await report({method:'GET',headers:{authorization:'Bearer test'},query:{}},res); assert.equal(res.code,403);
    OAuth2Client.prototype.verifyIdToken = async () => { throw new Error('bad signature'); };
    const invalid=response(); await report({method:'GET',headers:{authorization:'Bearer invalid'},query:{}},invalid); assert.equal(invalid.code,401);
  } finally { OAuth2Client.prototype.verifyIdToken=original; if(previous === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID=previous; }
});
test('collector rejects foreign origins and invalid requests',async()=>{
  for (const [req,status] of [[{method:'GET',headers:{}},405],[{method:'POST',headers:{origin:'https://other.test'}},403],[{method:'POST',headers:{origin:'https://thallyssonmax.com','content-type':'application/json'},body:{}},400]]) {
    const res=response(); await collect(req,res); assert.equal(res.code,status);
  }
});
