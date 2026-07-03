(function buildLearningVisuals(){
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const palette={navy:'#07152f',blue:'#3957ff',cyan:'#28d7e5',paper:'#f7f9fc',line:'#cbd5e1',text:'#344054',green:'#12a071',pink:'#d34d9a'};
  const shell=(title,body)=>`<figure class="learning-visual"><figcaption>${esc(title)} 구조도</figcaption><svg viewBox="0 0 720 280" role="img" aria-label="${esc(title)} 구조도"><defs><marker id="atlasArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${palette.blue}"/></marker></defs><rect x="1" y="1" width="718" height="278" rx="22" fill="${palette.paper}" stroke="${palette.line}"/>${body}</svg></figure>`;
  const box=(x,y,w,h,label,color=palette.blue,sub='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="white" stroke="${color}" stroke-width="2"/><text x="${x+w/2}" y="${y+h/2-(sub?6:0)}" text-anchor="middle" font-size="14" font-weight="700" fill="${palette.navy}">${esc(label)}</text>${sub?`<text x="${x+w/2}" y="${y+h/2+15}" text-anchor="middle" font-size="10" fill="${palette.text}">${esc(sub)}</text>`:''}`;
  const arrow=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${palette.blue}" stroke-width="2" marker-end="url(#atlasArrow)"/>`;
  const flow=(title,items)=>{
    const count=Math.min(items.length,6),gap=14,w=(650-gap*(count-1))/count,y=105;
    let body='';items.slice(0,count).forEach((item,i)=>{const x=35+i*(w+gap);body+=box(x,y,w,68,item,i%2?palette.cyan:palette.blue);if(i<count-1)body+=arrow(x+w,y+34,x+w+gap-3,y+34)});return shell(title,body);
  };
  const diagrams={
    memory:()=>shell('JVM Memory',`${box(32,34,156,212,'Thread Stack',palette.blue,'frame · local · reference')}${box(210,34,286,212,'Heap',palette.green,'object · array · String pool')}${box(518,34,170,96,'Metaspace',palette.pink,'class metadata')}${box(518,150,170,96,'PC / Native',palette.cyan,'thread execution')}${arrow(188,140,210,140)}<text x="353" y="88" text-anchor="middle" font-size="12" fill="${palette.text}">Young → Old Generation</text><rect x="242" y="105" width="92" height="95" rx="10" fill="#eef4ff"/><rect x="370" y="105" width="92" height="95" rx="10" fill="#ecfdf3"/><text x="288" y="156" text-anchor="middle" font-size="13" font-weight="700">Young</text><text x="416" y="156" text-anchor="middle" font-size="13" font-weight="700">Old</text>${arrow(334,152,368,152)}`),
    process:()=>shell('Process & Thread',`${box(35,28,650,220,'Process',palette.blue,'isolated address space')}${box(70,75,155,120,'Thread A',palette.cyan,'private stack')}${box(282,75,155,120,'Thread B',palette.cyan,'private stack')}${box(494,75,155,120,'Shared',palette.green,'code · heap · files')}${arrow(225,135,280,135)}${arrow(437,135,492,135)}<text x="360" y="224" text-anchor="middle" font-size="12" fill="${palette.text}">scheduler switches register + stack context</text>`),
    hashmap:()=>shell('HashMap',`${box(28,100,125,68,'Key',palette.blue)}${arrow(153,134,205,134)}${box(208,100,130,68,'hash spread',palette.cyan)}${arrow(338,134,390,134)}${box(393,100,130,68,'bucket index',palette.blue)}${arrow(523,134,575,134)}${box(578,60,108,60,'equals',palette.green)}${box(578,150,108,60,'collision',palette.pink)}<text x="632" y="234" text-anchor="middle" font-size="11" fill="${palette.text}">list → tree bin</text>`),
    list:()=>shell('ArrayList vs LinkedList',`${box(35,42,150,48,'ArrayList',palette.blue)}${[0,1,2,3].map((_,i)=>box(220+i*105,38,78,56,`[${i}]`,palette.cyan)).join('')}${box(35,174,150,48,'LinkedList',palette.green)}${[0,1,2,3].map((_,i)=>box(220+i*105,170,78,56,`Node ${i+1}`,palette.green)+(i<3?arrow(298+i*105,198,322+i*105,198):'')).join('')}<text x="448" y="118" text-anchor="middle" font-size="11" fill="${palette.text}">index O(1) · node traversal O(n)</text>`),
    btree:()=>shell('B-Tree Index',`${box(286,28,148,54,'Root Page',palette.blue)}${arrow(320,82,160,128)}${arrow(360,82,360,128)}${arrow(400,82,560,128)}${box(90,130,140,52,'Branch',palette.cyan)}${box(290,130,140,52,'Branch',palette.cyan)}${box(490,130,140,52,'Branch',palette.cyan)}${arrow(160,182,160,220)}${arrow(360,182,360,220)}${arrow(560,182,560,220)}${box(90,222,140,38,'Leaf / Row Ref',palette.green)}${box(290,222,140,38,'Leaf / Row Ref',palette.green)}${box(490,222,140,38,'Leaf / Row Ref',palette.green)}`),
    web:()=>flow('Web Request',['URL','DNS','TCP / TLS','HTTP','Application','Render']),
    mvc:()=>flow('Spring MVC',['Client','Filter','DispatcherServlet','Controller','Service','Response']),
    rag:()=>flow('RAG Pipeline',['Question','Embedding','Vector Search','Rerank','LLM','Evidence']),
    container:()=>shell('Container Platform',`${box(35,42,150,70,'Image',palette.blue,'immutable layers')}${arrow(185,77,260,77)}${box(265,42,150,70,'Container',palette.cyan,'running process')}${arrow(415,77,490,77)}${box(495,42,185,70,'Kubernetes Pod',palette.green,'desired state')}${box(80,168,180,70,'Volume',palette.pink,'persistent data')}${box(300,168,180,70,'Network',palette.cyan,'service discovery')}${box(520,168,120,70,'Signals',palette.blue,'M · L · T')}`)
  };
  window.renderLearningVisual=(title,category)=>{
    const value=String(title).toLowerCase();
    if(value.includes('jvm')||value.includes('memory')||value.includes('gc')||value.includes('메모리'))return diagrams.memory();
    if(value.includes('process')||value.includes('thread')||value.includes('프로세스'))return diagrams.process();
    if(value.includes('hash'))return diagrams.hashmap();
    if(value.includes('arraylist')||value.includes('linkedlist'))return diagrams.list();
    if(value.includes('index')||value.includes('b-tree')||value.includes('btree'))return diagrams.btree();
    if(value.includes('rag')||value.includes('embedding')||value.includes('vector')||value.includes('agent'))return diagrams.rag();
    if(value.includes('spring')||value.includes('servlet')||value.includes('mvc')||value.includes('dispatcher'))return diagrams.mvc();
    if(value.includes('docker')||value.includes('container')||value.includes('kubernetes'))return diagrams.container();
    if(category==='OS & Network'||category==='Web & React')return diagrams.web();
    if(category==='AI & Design'||category==='AX Scenario')return diagrams.rag();
    if(category==='Database')return diagrams.btree();
    if(category==='DevOps')return diagrams.container();
    return diagrams.mvc();
  };
  window.renderSystemFlow=(title,items)=>flow(title,items);
})();
