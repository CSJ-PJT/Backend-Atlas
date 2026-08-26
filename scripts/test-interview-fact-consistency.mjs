import {readFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');const read=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));const [bank,facts]=await Promise.all([read('data/interview/generated/interview-question-bank.json'),read('data/interview/candidate-facts-public.json')]);const ids=new Set(facts.facts.map(item=>item.id));
const unresolved=bank.questions.filter(q=>q.scope==='candidate').flatMap(q=>q.evidenceFactIds.filter(id=>!ids.has(id)).map(id=>`${q.id}:${id}`));if(unresolved.length)throw new Error(`Unknown candidate facts: ${unresolved.slice(0,10).join(', ')}`);
const text=JSON.stringify(bank);for(const forbidden of ['티머니 직원','야놀자 직원','SAP ERP 자체 개발','자체 LLM 학습 경험','GPU 모델 서버 운영 경험','DSP 실무 경험 보유','Staff 조직 관리 경험','동일 건수에서 855배'])if(text.includes(forbidden))throw new Error(`Forbidden claim leaked: ${forbidden}`);
console.log(`Interview fact consistency passed: ${ids.size} public-safe facts.`);
