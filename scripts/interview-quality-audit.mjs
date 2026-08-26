import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=async path=>JSON.parse(await readFile(resolve(root,path),'utf8'));
const [contract,bank,coding,playlists,review,sources,facts]=await Promise.all([
  read('data/interview/interview-quality-contract.json'),read('data/interview/generated/interview-question-bank.json'),read('data/interview/generated/coding-challenges.json'),read('data/interview/generated/interview-playlists.json'),read('data/interview/interview-review-manifest.json'),read('data/interview/sources/job-sources.json'),read('data/interview/candidate-facts-public.json')
]);
const jobs=await Promise.all((await readdir(resolve(root,'data/interview/jobs'))).sort().map(file=>read(`data/interview/jobs/${file}`)));
const errors=[];const fail=(id,message)=>errors.push({id,message});const questions=bank.questions||[];const challenges=coding.challenges||[];const jobByRole=new Map(jobs.map(job=>[`${job.company}\0${job.role}`,job]));
const count=predicate=>questions.filter(predicate).length;const ids=new Set();const sourceIds=new Set(sources.sources.map(source=>source.id));for(const fact of facts.facts)for(const ref of fact.sourceRefs||[])sourceIds.add(ref);
for(const question of questions){
  if(!question.id||ids.has(question.id))fail(question.id||'empty-id','question id must be unique');ids.add(question.id);
  if(question.reviewStatus!=='reviewed')fail(question.id,'public question must be reviewed');
  if(!question.question||!question.answer20Sec||!question.answer90Sec||!question.deepDive)fail(question.id,'question and answer layers are required');
  const rubricEntries=Object.entries(question.rubric||{});const rubricTotal=rubricEntries.reduce((sum,[,value])=>sum+Number(value||0),0);
  if(rubricTotal!==100)fail(question.id,'rubric must total 100');
  if(question.category==='system-design'&&rubricEntries.length!==9)fail(question.id,'system-design rubric must cover nine required factors');
  if(question.category==='behavior'&&rubricEntries.length!==6)fail(question.id,'behavior rubric must cover six required factors');
  if(!Array.isArray(question.followUps)||question.followUps.length<contract.publicQuestionRules.minimumFollowUps)fail(question.id,'at least two follow-ups required');
  if(question.followUps?.length!==question.followUpGuides?.length)fail(question.id,'follow-up guides must align');
  if(!question.sourceRefs?.length||question.sourceRefs.some(ref=>!sourceIds.has(ref)))fail(question.id,'sourceRefs must resolve');
  if(question.scope==='candidate'&&!question.evidenceFactIds?.length)fail(question.id,'candidate question requires evidenceFactIds');
  if(question.scope==='company'){
    const job=jobByRole.get(`${question.companies?.[0]}\0${question.roles?.[0]}`);
    const expected=job?.id.includes('needs-confirmation')?'practice-inference':'official-jd-derived';
    if(!job||question.provenanceLevel!==expected)fail(question.id,'company question must match one job role and its evidence level');
  }
  if(!contract.provenanceLevels.includes(question.provenanceLevel))fail(question.id,'unknown provenance level');
}
const minimums=contract.releaseMinimums;
if(count(q=>q.scope==='candidate')<minimums.candidate)fail('count-candidate','candidate minimum not met');
if(count(q=>q.scope==='company')<minimums.companyPerJob*Object.keys(playlists.jobs).length)fail('count-company','company minimum not met');
if(count(q=>q.id.startsWith('system-'))<minimums.systemScenario)fail('count-system','system scenario minimum not met');
if(count(q=>q.id.startsWith('behavior-'))<minimums.behavior)fail('count-behavior','behavior minimum not met');
if(questions.length<minimums.topLevel)fail('count-total','top-level minimum not met');
if(questions.reduce((sum,q)=>sum+q.followUps.length,0)<minimums.followUps)fail('count-followups','follow-up minimum not met');
for(const [jobId,playlist] of Object.entries(playlists.jobs)){
  if(playlist.questionIds.length<minimums.playlistPerJob)fail(jobId,'playlist minimum not met');
  if(playlist.questionIds.some(id=>!ids.has(id)&&!playlist.legacyReviewedQuestionIds.includes(id)))fail(jobId,'playlist has unknown question');
  const job=jobs.find(item=>item.id===jobId);const resolved=playlist.questionIds.map(id=>questions.find(question=>question.id===id)).filter(Boolean);const companyQuestions=resolved.filter(question=>question.scope==='company');const systemQuestions=resolved.filter(question=>question.category==='system-design');
  if(!job||companyQuestions.length!==minimums.companyPerJob||companyQuestions.some(question=>question.companies[0]!==job.company||question.roles[0]!==job.role))fail(jobId,'playlist must isolate exactly one company role');
  if(!Array.isArray(playlist.systemFocus)||!playlist.systemFocus.length||systemQuestions.length<5||systemQuestions.slice(0,5).some(question=>!question.tags.includes(playlist.systemFocus[0])))fail(jobId,'playlist must prioritize five role-specific system design questions');
}
const challengeIds=new Set();for(const challenge of challenges){
  if(!challenge.id||challengeIds.has(challenge.id))fail(challenge.id||'empty-challenge-id','coding challenge id must be unique');challengeIds.add(challenge.id);
  for(const key of ['prompt','input','output','complexity'])if(!challenge[key])fail(challenge.id,`coding challenge ${key} is required`);
  for(const key of ['edgeCases','solutionOutline','alternatives','followUps','sourceRefs'])if(!Array.isArray(challenge[key])||!challenge[key].length)fail(challenge.id,`coding challenge ${key} is required`);
  if(challenge.reviewStatus!=='reviewed')fail(challenge.id,'coding challenge must be reviewed');
  if(challenge.sourceRefs?.some(ref=>!sourceIds.has(ref)))fail(challenge.id,'coding challenge sourceRefs must resolve');
}
for(const [category,minimum] of Object.entries(minimums.coding))if(challenges.filter(item=>item.category===category).length<minimum)fail(`coding-${category}`,'coding minimum not met');
if(review.questionIds.length!==questions.length||review.questionIds.some(id=>!ids.has(id)))fail('review-manifest','review manifest must cover every question');
if(review.codingChallengeIds.length!==challenges.length||review.codingChallengeIds.some(id=>!challengeIds.has(id)))fail('review-manifest-coding','review manifest must cover every coding challenge');
const counts={questions:questions.length,candidate:count(q=>q.scope==='candidate'),company:count(q=>q.scope==='company'),system:count(q=>q.id.startsWith('system-')),behavior:count(q=>q.id.startsWith('behavior-')),coding:challenges.length,followUps:questions.reduce((sum,q)=>sum+q.followUps.length,0),jobs:Object.keys(playlists.jobs).length,errors:errors.length};
console.log(JSON.stringify({counts,errors:errors.slice(0,20)},null,2));if(errors.length)process.exitCode=1;
