import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = await readFile(resolve(root, 'learning-visuals.js'), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(source, context, { filename: 'learning-visuals.js' });

const render = context.window.renderLearningVisual;
assert.equal(typeof render, 'function');

const btree = render('B-Tree', 'Database');
assert.match(btree, /separator keys: 17 \| 42/);
assert.match(btree, /Leaf page/);
assert.match(btree, /Heap row \/ TID/);
assert.match(btree, /ordered range scan/);
assert.match(render('B+Tree', 'Database'), /B-Tree \/ B\+Tree Index/);

const servlet = render('Servlet과 Container', 'Java & Spring');
assert.match(servlet, /Connector/);
assert.match(servlet, /Worker/);
assert.match(servlet, /Filter chain/);
assert.match(servlet, /service\(\)/);
assert.doesNotMatch(servlet, /HandlerMapping/);

const springMvc = render('DispatcherServlet', 'Java & Spring');
assert.match(springMvc, /Spring MVC DispatcherServlet Flow/);
assert.match(springMvc, /DispatcherServlet/);
assert.match(springMvc, /HandlerMapping/);
assert.match(springMvc, /HandlerAdapter/);
assert.match(springMvc, /Controller/);
assert.match(springMvc, /ViewResolver · MessageConverter/);
assert.doesNotMatch(springMvc, /Container responsibilities/);
assert.match(render('Spring MVC', 'Java & Spring'), /Spring MVC DispatcherServlet Flow/);
assert.match(render('Spring Web MVC', 'Java & Spring'), /HandlerAdapter/);

assert.equal(render('Index', 'Database'), '', 'generic Index must not claim a B-Tree layout');
assert.equal(render('Transaction', 'Database'), '', 'Database category must not trigger a B-Tree fallback');
assert.equal(render('Embedding', 'AI & Design'), '', 'AI category must not trigger a RAG fallback');
assert.equal(render('Container', 'Java & Spring'), '', 'Servlet Container must not be mistaken for a Docker diagram');
assert.equal(render('Unknown concept', 'DevOps'), '', 'unknown concepts must not receive a generic diagram');

console.log('Learning visual mapping PASS: concept-specific diagrams only');
